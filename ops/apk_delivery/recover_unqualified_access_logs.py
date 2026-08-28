#!/usr/bin/env python3
"""Compact unread qualified APK records into a new transport file.

Caddy 2.8.4 named loggers are site-scoped. Before non-qualified routes gained
``log_skip``, ordinary access records could appear in the private APK delivery
log. They are not delivery facts, but simply omitting them from an ingest batch
creates byte-offset gaps that the API correctly rejects.

This one-time, fail-closed recovery tool must run while both Caddy and the
reader timer are stopped. It copies only fully qualified, valid unread records
verbatim into a new root-only file, moves the original source files into a
root-only rollback directory, and advances the private reader state over the
classified originals. The next reader run therefore starts the recovered file
at offset zero without weakening the API continuity contract.
"""

from __future__ import annotations

import argparse
import fcntl
import gzip
import hashlib
import json
import os
from pathlib import Path
import re
import sys
import time
from typing import Any

import apk_delivery_reader as reader


RECOVERY_ID_RE = re.compile(r"^[a-z0-9][a-z0-9-]{2,63}$")


class RecoveryError(RuntimeError):
    """A fail-closed planning, validation, or mutation error."""


def _fsync_directory(path: Path) -> None:
    descriptor = os.open(path, os.O_RDONLY | getattr(os, "O_DIRECTORY", 0))
    try:
        os.fsync(descriptor)
    finally:
        os.close(descriptor)


def _load_private_state(path: Path) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise RecoveryError("state_unreadable") from exc
    if (
        not isinstance(value, dict)
        or value.get("version") != 1
        or not isinstance(value.get("offsets"), dict)
        or not isinstance(value.get("observedSizes"), dict)
    ):
        raise RecoveryError("state_contract_mismatch")
    return value


def _read_unread_records(path: Path, start: int) -> tuple[list[bytes], int, int]:
    logical_size = reader.logical_file_size(path)
    if start < 0 or start > logical_size:
        raise RecoveryError("source_offset_regressed")
    qualified: list[bytes] = []
    unqualified_count = 0
    opener = gzip.open if path.suffix == ".gz" else Path.open
    with opener(path, "rb") as handle:
        handle.seek(start)
        while True:
            line = handle.readline(reader.MAX_LINE_BYTES + 1)
            if not line:
                break
            if len(line) > reader.MAX_LINE_BYTES:
                raise RecoveryError("source_line_too_large")
            if not line.endswith(b"\n"):
                raise RecoveryError("source_partial_record")
            try:
                raw = json.loads(line)
            except json.JSONDecodeError as exc:
                raise RecoveryError("source_json_invalid") from exc
            if not isinstance(raw, dict):
                raise RecoveryError("source_json_not_object")
            if reader.is_unqualified_access_record(raw):
                unqualified_count += 1
                continue
            try:
                reader.project_caddy_record(raw)
            except reader.ReaderError as exc:
                raise RecoveryError(f"qualified_record_invalid:{exc}") from exc
            qualified.append(line)
    return qualified, unqualified_count, logical_size


def build_plan(*, log_path: Path, state_path: Path, recovery_id: str) -> dict[str, Any]:
    if RECOVERY_ID_RE.fullmatch(recovery_id) is None:
        raise RecoveryError("recovery_id_invalid")
    state = _load_private_state(state_path)
    source_paths = reader.discover_logs(log_path)
    if not source_paths:
        raise RecoveryError("source_logs_missing")

    recovery_lines: list[bytes] = []
    unqualified_count = 0
    source_sizes: dict[str, int] = {}
    source_files: list[dict[str, Any]] = []
    for path in source_paths:
        file_id = reader.source_file_id(path)
        start = int(state["offsets"].get(file_id, 0))
        qualified, skipped, logical_size = _read_unread_records(path, start)
        recovery_lines.extend(qualified)
        unqualified_count += skipped
        source_sizes[file_id] = logical_size
        source_files.append(
            {
                "path": path,
                "fileId": file_id,
                "startOffset": start,
                "logicalSize": logical_size,
                "qualifiedCount": len(qualified),
                "unqualifiedCount": skipped,
            }
        )

    if unqualified_count == 0:
        raise RecoveryError("no_unqualified_records_found")
    recovery_bytes = b"".join(recovery_lines)
    return {
        "recoveryId": recovery_id,
        "state": state,
        "sourceFiles": source_files,
        "sourceSizes": source_sizes,
        "recoveryBytes": recovery_bytes,
        "summary": {
            "status": "recovery_plan_valid",
            "recovery_id": recovery_id,
            "source_file_count": len(source_files),
            "qualified_record_count": len(recovery_lines),
            "unqualified_record_count": unqualified_count,
            "recovery_bytes": len(recovery_bytes),
            "recovery_sha256": hashlib.sha256(recovery_bytes).hexdigest(),
        },
    }


def _write_private(path: Path, payload: bytes) -> None:
    descriptor = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    try:
        with os.fdopen(descriptor, "wb") as handle:
            handle.write(payload)
            handle.flush()
            os.fsync(handle.fileno())
    except Exception:
        path.unlink(missing_ok=True)
        raise


def apply_plan(
    *,
    plan: dict[str, Any],
    log_path: Path,
    state_path: Path,
    quarantine_dir: Path,
) -> dict[str, Any]:
    recovery_id = plan["recoveryId"]
    recovery_path = log_path.parent / f"{log_path.name}.recovered-{recovery_id}"
    recovery_tmp = log_path.parent / f".{log_path.name}.recovered-{recovery_id}.tmp"
    state_tmp = state_path.parent / f".{state_path.name}.{recovery_id}.tmp"
    if quarantine_dir.exists() or recovery_path.exists() or recovery_tmp.exists() or state_tmp.exists():
        raise RecoveryError("recovery_target_exists")
    if quarantine_dir.parent != log_path.parent:
        raise RecoveryError("quarantine_must_share_log_parent")

    source_snapshot = {
        item["path"]: (item["path"].stat().st_dev, item["path"].stat().st_ino, item["path"].stat().st_size)
        for item in plan["sourceFiles"]
    }
    time.sleep(1)
    for path, before in source_snapshot.items():
        stat = path.stat()
        if (stat.st_dev, stat.st_ino, stat.st_size) != before:
            raise RecoveryError("source_writer_not_stopped")

    state = json.loads(json.dumps(plan["state"]))
    for file_id, logical_size in plan["sourceSizes"].items():
        state["offsets"][file_id] = logical_size
    history = state.setdefault("recoveryHistory", [])
    if not isinstance(history, list):
        raise RecoveryError("state_recovery_history_invalid")
    history.append(
        {
            "recoveryId": recovery_id,
            "sourceFileCount": plan["summary"]["source_file_count"],
            "qualifiedRecordCount": plan["summary"]["qualified_record_count"],
            "unqualifiedRecordCount": plan["summary"]["unqualified_record_count"],
            "recoveryFileName": recovery_path.name,
            "recoverySha256": plan["summary"]["recovery_sha256"],
        }
    )

    moved: list[tuple[Path, Path]] = []
    state_backup = quarantine_dir / "state.json.before"
    try:
        quarantine_dir.mkdir(mode=0o700)
        os.chmod(quarantine_dir, 0o700)
        _write_private(state_backup, state_path.read_bytes())
        _write_private(recovery_tmp, plan["recoveryBytes"])
        _write_private(state_tmp, json.dumps(state, sort_keys=True, indent=2).encode("utf-8") + b"\n")

        for item in plan["sourceFiles"]:
            source = item["path"]
            target = quarantine_dir / source.name
            if target.exists():
                raise RecoveryError("quarantine_name_collision")
            os.replace(source, target)
            moved.append((source, target))
        os.replace(recovery_tmp, recovery_path)
        os.replace(state_tmp, state_path)
        os.chmod(state_path, 0o600)
        _fsync_directory(log_path.parent)
        _fsync_directory(state_path.parent)
    except Exception:
        if recovery_path.exists():
            recovery_path.unlink()
        recovery_tmp.unlink(missing_ok=True)
        state_tmp.unlink(missing_ok=True)
        if state_backup.exists():
            rollback_tmp = state_path.parent / f".{state_path.name}.{recovery_id}.rollback"
            rollback_tmp.write_bytes(state_backup.read_bytes())
            os.chmod(rollback_tmp, 0o600)
            os.replace(rollback_tmp, state_path)
        for source, target in reversed(moved):
            if target.exists() and not source.exists():
                os.replace(target, source)
        raise

    result = dict(plan["summary"])
    result.update(
        {
            "status": "recovery_applied",
            "recovery_file": recovery_path.name,
            "quarantine_directory": quarantine_dir.name,
            "rollback_state_file": state_backup.name,
        }
    )
    return result


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser()
    parser.add_argument("--log-path", default="/var/log/caddy/apk-delivery.json")
    parser.add_argument("--state-path", default="/var/lib/luta-apk-delivery-reader/state.json")
    parser.add_argument("--lock-path", default="/run/luta-apk-delivery-reader/reader.lock")
    parser.add_argument("--recovery-id", required=True)
    parser.add_argument("--quarantine-dir")
    parser.add_argument("--apply", action="store_true")
    return parser


def main() -> int:
    args = build_parser().parse_args()
    log_path = Path(args.log_path)
    state_path = Path(args.state_path)
    lock_path = Path(args.lock_path)
    lock_path.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
    try:
        with lock_path.open("a+", encoding="utf-8") as lock_handle:
            os.fchmod(lock_handle.fileno(), 0o600)
            try:
                fcntl.flock(lock_handle.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
            except BlockingIOError as exc:
                raise RecoveryError("reader_is_running") from exc
            plan = build_plan(log_path=log_path, state_path=state_path, recovery_id=args.recovery_id)
            if not args.apply:
                print(json.dumps(plan["summary"], sort_keys=True))
                return 0
            if not args.quarantine_dir:
                raise RecoveryError("quarantine_dir_required")
            result = apply_plan(
                plan=plan,
                log_path=log_path,
                state_path=state_path,
                quarantine_dir=Path(args.quarantine_dir),
            )
            print(json.dumps(result, sort_keys=True))
            return 0
    except (OSError, RecoveryError, reader.ReaderError) as exc:
        print(f"apk_delivery_recovery_failed reason={exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
