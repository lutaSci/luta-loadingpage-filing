import importlib.util
import json
import os
from pathlib import Path
import sys
import tempfile
import unittest


ROOT = Path(__file__).resolve().parents[1]
READER_PATH = ROOT / "ops" / "apk_delivery" / "apk_delivery_reader.py"
RECOVERY_PATH = ROOT / "ops" / "apk_delivery" / "recover_unqualified_access_logs.py"
sys.path.insert(0, str(READER_PATH.parent))

reader_spec = importlib.util.spec_from_file_location("apk_delivery_reader", READER_PATH)
READER = importlib.util.module_from_spec(reader_spec)
assert reader_spec.loader is not None
sys.modules["apk_delivery_reader"] = READER
reader_spec.loader.exec_module(READER)

recovery_spec = importlib.util.spec_from_file_location("recovery", RECOVERY_PATH)
RECOVERY = importlib.util.module_from_spec(recovery_spec)
assert recovery_spec.loader is not None
recovery_spec.loader.exec_module(RECOVERY)


def qualified_line(offset: int) -> bytes:
    value = {
        "ts": 1787900000 + offset,
        "download_id": "dl_" + "a" * 32,
        "artifact_id": "b" * 64,
        "artifact_size_bytes": 100,
        "app_version": "2.1.5",
        "build_number": 5200,
        "request_method": "GET",
        "http_status": 206,
        "bytes_written": 50,
        "response_content_range": "bytes 0-49/100",
        "known_bot": False,
        "traffic_purpose": "production",
    }
    return (json.dumps(value, separators=(",", ":")) + "\n").encode()


def unqualified_line() -> bytes:
    return b'{"ts":1787900001,"http_status":200,"bytes_written":42}\n'


class RecoveryTests(unittest.TestCase):
    def make_paths(self, root: Path):
        log_path = root / "logs" / "apk-delivery.json"
        state_path = root / "state" / "state.json"
        lock_path = root / "run" / "reader.lock"
        log_path.parent.mkdir()
        state_path.parent.mkdir()
        lock_path.parent.mkdir()
        return log_path, state_path, lock_path

    def write_state(self, state_path: Path, log_path: Path, offset: int) -> None:
        file_id = READER.source_file_id(log_path)
        value = {
            "version": 1,
            "sourceId": "c" * 64,
            "offsets": {file_id: offset},
            "observedSizes": {file_id: log_path.stat().st_size},
            "previousBatchId": "d" * 64,
            "sourceGap": False,
        }
        state_path.write_text(json.dumps(value))
        os.chmod(state_path, 0o600)

    def test_apply_compacts_only_unread_qualified_records_and_rebases_offsets(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            log_path, state_path, _ = self.make_paths(root)
            consumed = qualified_line(0)
            unread_one = qualified_line(2)
            unread_two = qualified_line(3)
            log_path.write_bytes(consumed + unqualified_line() + unread_one + unread_two)
            self.write_state(state_path, log_path, len(consumed))

            plan = RECOVERY.build_plan(log_path=log_path, state_path=state_path, recovery_id="test-recovery")
            self.assertEqual(plan["summary"]["qualified_record_count"], 2)
            self.assertEqual(plan["summary"]["unqualified_record_count"], 1)

            quarantine = log_path.parent / "quarantine-test-recovery"
            result = RECOVERY.apply_plan(
                plan=plan,
                log_path=log_path,
                state_path=state_path,
                quarantine_dir=quarantine,
            )
            recovered = log_path.parent / result["recovery_file"]
            self.assertEqual(recovered.read_bytes(), unread_one + unread_two)
            self.assertFalse(log_path.exists())
            self.assertTrue((quarantine / log_path.name).exists())
            self.assertEqual(recovered.stat().st_mode & 0o777, 0o600)
            self.assertEqual(quarantine.stat().st_mode & 0o777, 0o700)

            records = READER.read_records([recovered], {})
            self.assertEqual(len(records), 2)
            self.assertEqual(records[0].offset_start, 0)
            self.assertEqual(records[0].offset_end, len(unread_one))
            self.assertEqual(records[1].offset_start, len(unread_one))
            updated_state = json.loads(state_path.read_text())
            old_file_id = next(iter(plan["sourceSizes"]))
            self.assertEqual(updated_state["offsets"][old_file_id], plan["sourceSizes"][old_file_id])

    def test_plan_is_read_only(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            log_path, state_path, _ = self.make_paths(root)
            payload = unqualified_line() + qualified_line(1)
            log_path.write_bytes(payload)
            self.write_state(state_path, log_path, 0)
            before_state = state_path.read_bytes()
            before_log = log_path.read_bytes()

            RECOVERY.build_plan(log_path=log_path, state_path=state_path, recovery_id="dry-run")

            self.assertEqual(state_path.read_bytes(), before_state)
            self.assertEqual(log_path.read_bytes(), before_log)
            self.assertEqual(list(log_path.parent.iterdir()), [log_path])

    def test_partial_qualification_fails_closed_without_mutation(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            log_path, state_path, _ = self.make_paths(root)
            payload = b'{"download_id":"dl_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","http_status":200}\n'
            log_path.write_bytes(payload)
            self.write_state(state_path, log_path, 0)

            with self.assertRaisesRegex(RECOVERY.RecoveryError, "qualified_record_invalid"):
                RECOVERY.build_plan(log_path=log_path, state_path=state_path, recovery_id="partial-record")
            self.assertEqual(log_path.read_bytes(), payload)


if __name__ == "__main__":
    unittest.main()
