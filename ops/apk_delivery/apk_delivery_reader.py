#!/usr/bin/env python3
"""Root-owned, privacy-minimizing Caddy log projector for APK delivery facts.

The reader never changes the public download path. It reads complete JSONL
records from root-only Caddy logs, projects an allow-list, and sends bounded,
idempotent batches to the organization-owned API. State advances only after a
successful acknowledgement.
"""

from __future__ import annotations

import argparse
import fcntl
import gzip
import hashlib
import json
import os
import re
import ssl
import sys
import time
import urllib.error
import urllib.request
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Iterable

SCHEMA_VERSION = "apk_http_delivery_v1"
PROJECTION_VERSION = "caddy_jsonl_projection_v1"
PURPOSES = {"production", "qa", "smoke", "internal", "development"}
DOWNLOAD_ID_RE = re.compile(r"^dl_[0-9a-f]{32}$")
SHA256_RE = re.compile(r"^[0-9a-f]{64}$")
APP_VERSION_RE = re.compile(r"^[0-9]+(?:\.[0-9]+){2}$")
CONTENT_RANGE_RE = re.compile(r"^bytes ([0-9]+)-([0-9]+)/([0-9]+)$")
DEFAULT_BATCH_SIZE = 500
MAX_LINE_BYTES = 16 * 1024


class ReaderError(RuntimeError):
    """A fail-closed source, projection, or transport error."""


@dataclass(frozen=True)
class SourceRecord:
    file_id: str
    offset_start: int
    offset_end: int
    projected: dict[str, Any] | None


# Caddy's named access logger is site-scoped. Releases before the explicit
# non-qualified-route log_skip fix can therefore contain ordinary site access
# records with none of the delivery-contract fields. Those records are safe to
# advance past only when the complete qualification envelope is absent. A
# partially populated envelope remains a fail-closed projection error.
QUALIFICATION_FIELDS = {
    "download_id",
    "artifact_id",
    "artifact_size_bytes",
    "app_version",
    "build_number",
    "request_method",
    "traffic_purpose",
    "known_bot",
}


def is_unqualified_access_record(raw: dict[str, Any]) -> bool:
    return not any(field in raw for field in QUALIFICATION_FIELDS)


def _canonical_json(value: Any) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode("utf-8")


def source_file_id(path: Path) -> str:
    stat = path.stat()
    raw = f"{stat.st_dev}:{stat.st_ino}".encode("ascii")
    return hashlib.sha256(raw).hexdigest()


def logical_file_size(path: Path) -> int:
    if path.suffix != ".gz":
        return path.stat().st_size
    with gzip.open(path, "rb") as handle:
        handle.seek(0, os.SEEK_END)
        return handle.tell()


def _utc_iso_from_epoch(value: Any) -> str:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ReaderError("invalid_ts")
    parsed = datetime.fromtimestamp(float(value), tz=timezone.utc)
    return parsed.isoformat().replace("+00:00", "Z")


def project_caddy_record(raw: dict[str, Any]) -> dict[str, Any]:
    """Return only fields allowed by the cross-team delivery contract."""

    if not isinstance(raw, dict):
        raise ReaderError("invalid_json_object")
    download_id = raw.get("download_id")
    artifact_id = raw.get("artifact_id")
    app_version = raw.get("app_version")
    purpose = raw.get("traffic_purpose")
    method = raw.get("request_method")
    content_range = raw.get("response_content_range") or None
    try:
        artifact_size = int(raw.get("artifact_size_bytes"))
        build_number = int(raw.get("build_number"))
        http_status = int(raw.get("http_status"))
        bytes_written = int(raw.get("bytes_written"))
    except (TypeError, ValueError) as exc:
        raise ReaderError("invalid_numeric_field") from exc
    known_bot = raw.get("known_bot")
    if isinstance(known_bot, str):
        known_bot = known_bot.lower() == "true"

    if not isinstance(download_id, str) or DOWNLOAD_ID_RE.fullmatch(download_id) is None:
        raise ReaderError("invalid_download_id")
    if not isinstance(artifact_id, str) or SHA256_RE.fullmatch(artifact_id) is None:
        raise ReaderError("invalid_artifact_id")
    if not isinstance(app_version, str) or APP_VERSION_RE.fullmatch(app_version) is None:
        raise ReaderError("invalid_app_version")
    if purpose not in PURPOSES:
        raise ReaderError("invalid_traffic_purpose")
    if method not in {"GET", "HEAD"}:
        raise ReaderError("invalid_request_method")
    if artifact_size <= 0 or build_number <= 0 or http_status < 100 or http_status > 599 or bytes_written < 0:
        raise ReaderError("invalid_numeric_range")
    if known_bot is not True and known_bot is not False:
        raise ReaderError("invalid_known_bot")
    if content_range is not None and (
        not isinstance(content_range, str) or CONTENT_RANGE_RE.fullmatch(content_range) is None
    ):
        # Preserve the fact that a response was unclassifiable without sending
        # the unbounded original header value.
        content_range = "invalid"

    return {
        "ts": _utc_iso_from_epoch(raw.get("ts")),
        "downloadId": download_id,
        "artifactId": artifact_id,
        "artifactSizeBytes": artifact_size,
        "appVersion": app_version,
        "buildNumber": build_number,
        "requestMethod": method,
        "httpStatus": http_status,
        "bytesWritten": bytes_written,
        "responseContentRange": content_range,
        "knownBot": known_bot,
        "trafficPurpose": purpose,
        "schemaVersion": SCHEMA_VERSION,
        "projectionVersion": PROJECTION_VERSION,
    }


def load_state(path: Path, source_id: str) -> dict[str, Any]:
    if not path.exists():
        return {
            "version": 1,
            "sourceId": source_id,
            "offsets": {},
            "observedSizes": {},
            "previousBatchId": None,
            "sourceGap": False,
        }
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise ReaderError("state_unreadable") from exc
    if (
        not isinstance(value, dict)
        or value.get("version") != 1
        or value.get("sourceId") != source_id
        or not isinstance(value.get("offsets"), dict)
    ):
        raise ReaderError("state_contract_mismatch")
    value.setdefault("observedSizes", {})
    value.setdefault("sourceGap", False)
    if not isinstance(value["observedSizes"], dict) or not isinstance(value["sourceGap"], bool):
        raise ReaderError("state_contract_mismatch")
    return value


def save_state(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
    temporary = path.with_suffix(".tmp")
    payload = json.dumps(value, sort_keys=True, indent=2) + "\n"
    with temporary.open("w", encoding="utf-8") as handle:
        os.fchmod(handle.fileno(), 0o600)
        handle.write(payload)
        handle.flush()
        os.fsync(handle.fileno())
    os.replace(temporary, path)


def discover_logs(active_path: Path) -> list[Path]:
    candidates = [path for path in active_path.parent.glob(f"{active_path.name}*") if path.is_file()]
    # Compressed rotations cannot preserve byte-offset replay semantics.
    compressed = [path for path in candidates if path.suffix in {".zip", ".bz2", ".xz"}]
    if compressed:
        raise ReaderError("compressed_rotation_present")
    return sorted(candidates, key=lambda path: (path.stat().st_mtime_ns, path.name))


def read_records(paths: Iterable[Path], offsets: dict[str, int]) -> list[SourceRecord]:
    records: list[SourceRecord] = []
    for path in paths:
        file_id = source_file_id(path)
        start = int(offsets.get(file_id, 0))
        size = path.stat().st_size
        if start < 0 or start > size:
            raise ReaderError("source_offset_regressed")
        opener = gzip.open if path.suffix == ".gz" else Path.open
        with opener(path, "rb") as handle:
            handle.seek(start)
            while True:
                offset_start = handle.tell()
                line = handle.readline(MAX_LINE_BYTES + 1)
                if not line:
                    break
                if len(line) > MAX_LINE_BYTES:
                    raise ReaderError("source_line_too_large")
                if not line.endswith(b"\n"):
                    # Caddy may still be writing the final record; retry it on
                    # the next run instead of accepting a partial fact.
                    break
                offset_end = handle.tell()
                try:
                    raw = json.loads(line)
                except json.JSONDecodeError as exc:
                    raise ReaderError("source_json_invalid") from exc
                projected = None if is_unqualified_access_record(raw) else project_caddy_record(raw)
                records.append(
                    SourceRecord(
                        file_id=file_id,
                        offset_start=offset_start,
                        offset_end=offset_end,
                        projected=projected,
                    )
                )
    return records


def build_batch(
    *,
    source_id: str,
    previous_batch_id: str | None,
    records: list[SourceRecord],
    coverage_through: datetime | None,
    source_gap: bool = False,
) -> dict[str, Any]:
    events = []
    for record in records:
        if record.projected is None:
            continue
        event = dict(record.projected)
        event.update(
            {
                "sourceId": source_id,
                "sourceFileId": record.file_id,
                "sourceOffsetStart": record.offset_start,
                "sourceOffsetEnd": record.offset_end,
            }
        )
        events.append(event)
    payload: dict[str, Any] = {
        "sourceId": source_id,
        "previousBatchId": previous_batch_id,
        "coverageThrough": coverage_through.isoformat().replace("+00:00", "Z") if coverage_through else None,
        "sourceGap": source_gap,
        "schemaVersion": SCHEMA_VERSION,
        "projectionVersion": PROJECTION_VERSION,
        "events": events,
    }
    payload["batchId"] = hashlib.sha256(_canonical_json(payload)).hexdigest()
    return payload


def post_batch(*, api_url: str, api_key: str, batch: dict[str, Any], timeout_seconds: int) -> None:
    request = urllib.request.Request(
        api_url,
        data=_canonical_json(batch),
        method="POST",
        headers={
            "Content-Type": "application/json",
            "X-Apk-Delivery-Ingest-Key": api_key,
            "User-Agent": "luta-apk-delivery-reader/1",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout_seconds, context=ssl.create_default_context()) as response:
            if response.status not in {200, 201}:
                raise ReaderError("ingest_rejected")
            body = json.loads(response.read(64 * 1024))
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
        raise ReaderError("ingest_unavailable") from exc
    if body.get("code") != 0 or body.get("data", {}).get("batchId") != batch["batchId"]:
        raise ReaderError("ingest_ack_invalid")


def run_once(args: argparse.Namespace) -> None:
    source_id = args.source_id
    if SHA256_RE.fullmatch(source_id) is None:
        raise ReaderError("source_id_invalid")
    api_key = os.environ.get("APK_DELIVERY_INGEST_KEY", "").strip()
    if len(api_key) < 32:
        raise ReaderError("ingest_key_missing")

    state_path = Path(args.state_path)
    lock_path = Path(args.lock_path)
    lock_path.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
    with lock_path.open("a+", encoding="utf-8") as lock_handle:
        os.fchmod(lock_handle.fileno(), 0o600)
        try:
            fcntl.flock(lock_handle.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError as exc:
            raise ReaderError("reader_already_running") from exc

        state = load_state(state_path, source_id)
        paths = discover_logs(Path(args.log_path))
        observed_sizes = {source_file_id(path): logical_file_size(path) for path in paths}
        detected_gap = any(
            file_id not in observed_sizes and int(state["offsets"].get(file_id, 0)) < int(prior_size)
            for file_id, prior_size in state["observedSizes"].items()
        )
        source_gap = bool(state["sourceGap"] or detected_gap)
        records = read_records(paths, state["offsets"])
        previous = state.get("previousBatchId")
        for index in range(0, len(records), args.batch_size):
            chunk = records[index : index + args.batch_size]
            batch = build_batch(
                source_id=source_id,
                previous_batch_id=previous,
                records=chunk,
                coverage_through=None,
                source_gap=source_gap,
            )
            post_batch(api_url=args.api_url, api_key=api_key, batch=batch, timeout_seconds=args.timeout_seconds)
            for record in chunk:
                state["offsets"][record.file_id] = record.offset_end
            previous = batch["batchId"]
            state["previousBatchId"] = previous
            save_state(state_path, state)

        heartbeat = build_batch(
            source_id=source_id,
            previous_batch_id=previous,
            records=[],
            coverage_through=datetime.now(timezone.utc) - timedelta(seconds=args.coverage_lag_seconds),
            source_gap=source_gap,
        )
        post_batch(api_url=args.api_url, api_key=api_key, batch=heartbeat, timeout_seconds=args.timeout_seconds)
        state["previousBatchId"] = heartbeat["batchId"]
        for file_id, prior_size in list(state["observedSizes"].items()):
            if file_id not in observed_sizes and int(state["offsets"].get(file_id, 0)) >= int(prior_size):
                state["offsets"].pop(file_id, None)
        state["observedSizes"] = observed_sizes
        state["sourceGap"] = source_gap
        save_state(state_path, state)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser()
    parser.add_argument("--log-path", default="/var/log/caddy/apk-delivery.json")
    parser.add_argument("--state-path", default="/var/lib/luta-apk-delivery-reader/state.json")
    parser.add_argument("--lock-path", default="/run/luta-apk-delivery-reader/reader.lock")
    parser.add_argument("--source-id", required=True)
    parser.add_argument(
        "--api-url",
        default="https://api.lutaai.com/api/v1/internal/attribution/apk-delivery/batches",
    )
    parser.add_argument("--batch-size", type=int, default=DEFAULT_BATCH_SIZE, choices=range(1, 501))
    parser.add_argument("--timeout-seconds", type=int, default=20, choices=range(1, 121))
    parser.add_argument("--coverage-lag-seconds", type=int, default=30, choices=range(0, 301))
    return parser


def main() -> int:
    try:
        run_once(build_parser().parse_args())
    except ReaderError as exc:
        print(f"apk_delivery_reader_failed reason={exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
