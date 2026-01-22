import json
from pathlib import Path

from .database import HistoryDatabase


def migrate_jsonl_to_sqlite(jsonl_path: Path, db: HistoryDatabase) -> int:
    if not jsonl_path.exists():
        return 0

    migrated = 0
    with open(jsonl_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                entry = json.loads(line)
                db.log(
                    text=entry.get("text", ""),
                    duration_seconds=entry.get("duration_seconds", 0),
                    model_used=entry.get("model_used", "base.en"),
                    language=entry.get("language", "en"),
                )
                migrated += 1
            except (json.JSONDecodeError, KeyError):
                continue

    # Rename the old file so migration doesn't run again
    backup_path = jsonl_path.with_suffix(".jsonl.migrated")
    jsonl_path.rename(backup_path)
    print(f"Migrated {migrated} entries from JSONL to SQLite. Old file renamed to {backup_path.name}")
    return migrated
