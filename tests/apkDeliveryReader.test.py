import importlib.util
import gzip
import json
import sys
import tempfile
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).parents[1] / "ops" / "apk_delivery" / "apk_delivery_reader.py"
SPEC = importlib.util.spec_from_file_location("apk_delivery_reader", MODULE_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


def valid_record(**overrides):
    value = {
        "ts": 1787836800.5,
        "download_id": "dl_" + "a" * 32,
        "artifact_id": "b" * 64,
        "artifact_size_bytes": "1000",
        "app_version": "2.1.4",
        "build_number": "5115",
        "request_method": "GET",
        "http_status": 206,
        "bytes_written": 500,
        "response_content_range": "bytes 0-499/1000",
        "known_bot": False,
        "traffic_purpose": "production",
        "request": {"remote_ip": "should-never-leave-reader"},
        "user_agent": "should-never-leave-reader",
    }
    value.update(overrides)
    return value


class ApkDeliveryReaderTest(unittest.TestCase):
    def test_projection_is_allowlisted_and_privacy_minimized(self):
        projected = MODULE.project_caddy_record(valid_record())
        serialized = json.dumps(projected)
        self.assertNotIn("remote_ip", serialized)
        self.assertNotIn("user_agent", serialized)
        self.assertEqual(projected["responseContentRange"], "bytes 0-499/1000")
        self.assertEqual(projected["artifactSizeBytes"], 1000)

    def test_invalid_content_range_is_bounded_not_forwarded(self):
        projected = MODULE.project_caddy_record(valid_record(response_content_range="private-unbounded-value"))
        self.assertEqual(projected["responseContentRange"], "invalid")

    def test_partial_final_line_is_retried(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "apk-delivery.json"
            first = json.dumps(valid_record()).encode() + b"\n"
            path.write_bytes(first + b'{"ts":')
            records = MODULE.read_records([path], {})
            self.assertEqual(len(records), 1)
            self.assertEqual(records[0].offset_end, len(first))

    def test_unqualified_site_access_advances_without_becoming_an_event(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "apk-delivery.json"
            raw = {"ts": 1787836800.5, "http_status": 200, "bytes_written": 90112}
            line = json.dumps(raw).encode() + b"\n"
            path.write_bytes(line)
            records = MODULE.read_records([path], {})
            self.assertEqual(len(records), 1)
            self.assertIsNone(records[0].projected)
            self.assertEqual(records[0].offset_end, len(line))
            batch = MODULE.build_batch(
                source_id="d" * 64,
                previous_batch_id=None,
                records=records,
                coverage_through=None,
            )
            self.assertEqual(batch["events"], [])
            self.assertEqual(
                batch["sourceRecords"],
                [
                    {
                        "sourceFileId": records[0].file_id,
                        "sourceOffsetStart": 0,
                        "sourceOffsetEnd": len(line),
                        "eventIncluded": False,
                    }
                ],
            )

    def test_partial_delivery_envelope_still_fails_closed(self):
        raw = valid_record()
        raw.pop("artifact_size_bytes")
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "apk-delivery.json"
            path.write_text(json.dumps(raw) + "\n")
            with self.assertRaisesRegex(MODULE.ReaderError, "invalid_numeric_field"):
                MODULE.read_records([path], {})

    def test_legacy_gzip_rotation_is_read_with_stable_logical_offsets(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "apk-delivery.json-legacy.gz"
            first = json.dumps(valid_record()).encode() + b"\n"
            with gzip.open(path, "wb") as handle:
                handle.write(first)
            records = MODULE.read_records([path], {})
            self.assertEqual(len(records), 1)
            self.assertEqual(records[0].offset_start, 0)
            self.assertEqual(records[0].offset_end, len(first))

    def test_batch_id_is_stable_and_source_offsets_are_explicit(self):
        record = MODULE.SourceRecord("c" * 64, 10, 20, MODULE.project_caddy_record(valid_record()))
        one = MODULE.build_batch(source_id="d" * 64, previous_batch_id=None, records=[record], coverage_through=None)
        two = MODULE.build_batch(source_id="d" * 64, previous_batch_id=None, records=[record], coverage_through=None)
        self.assertEqual(one["batchId"], two["batchId"])
        self.assertEqual(one["events"][0]["sourceOffsetStart"], 10)
        self.assertEqual(one["events"][0]["sourceOffsetEnd"], 20)
        self.assertEqual(
            one["sourceRecords"],
            [
                {
                    "sourceFileId": "c" * 64,
                    "sourceOffsetStart": 10,
                    "sourceOffsetEnd": 20,
                    "eventIncluded": True,
                }
            ],
        )

    def test_interleaved_unqualified_and_qualified_records_keep_full_source_continuity(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "apk-delivery.json"
            unqualified = (
                json.dumps({"ts": 1787836800.5, "http_status": 200, "bytes_written": 42}).encode()
                + b"\n"
            )
            qualified = json.dumps(valid_record()).encode() + b"\n"
            path.write_bytes(unqualified + qualified)

            records = MODULE.read_records([path], {})
            batch = MODULE.build_batch(
                source_id="d" * 64,
                previous_batch_id=None,
                records=records,
                coverage_through=None,
            )

            self.assertEqual(len(batch["events"]), 1)
            self.assertEqual(
                [
                    (item["sourceOffsetStart"], item["sourceOffsetEnd"], item["eventIncluded"])
                    for item in batch["sourceRecords"]
                ],
                [(0, len(unqualified), False), (len(unqualified), len(unqualified) + len(qualified), True)],
            )

    def test_source_gap_is_part_of_the_signed_batch_contract(self):
        batch = MODULE.build_batch(
            source_id="d" * 64,
            previous_batch_id=None,
            records=[],
            coverage_through=None,
            source_gap=True,
        )
        self.assertTrue(batch["sourceGap"])


if __name__ == "__main__":
    unittest.main()
