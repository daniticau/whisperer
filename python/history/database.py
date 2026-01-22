import sqlite3
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

from ..config import CONFIG_DIR

DB_PATH = CONFIG_DIR / "history.db"

SCHEMA = """
CREATE TABLE IF NOT EXISTS transcriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    duration_seconds REAL NOT NULL,
    text TEXT NOT NULL,
    char_count INTEGER NOT NULL,
    word_count INTEGER NOT NULL,
    model_used TEXT,
    language TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_timestamp ON transcriptions(timestamp);
"""

FTS_SCHEMA = """
CREATE VIRTUAL TABLE IF NOT EXISTS transcriptions_fts USING fts5(
    text,
    content=transcriptions,
    content_rowid=id
);

CREATE TRIGGER IF NOT EXISTS transcriptions_ai AFTER INSERT ON transcriptions BEGIN
    INSERT INTO transcriptions_fts(rowid, text) VALUES (new.id, new.text);
END;

CREATE TRIGGER IF NOT EXISTS transcriptions_ad AFTER DELETE ON transcriptions BEGIN
    INSERT INTO transcriptions_fts(transcriptions_fts, rowid, text) VALUES('delete', old.id, old.text);
END;

CREATE TRIGGER IF NOT EXISTS transcriptions_au AFTER UPDATE ON transcriptions BEGIN
    INSERT INTO transcriptions_fts(transcriptions_fts, rowid, text) VALUES('delete', old.id, old.text);
    INSERT INTO transcriptions_fts(rowid, text) VALUES (new.id, new.text);
END;
"""


class HistoryDatabase:
    def __init__(self, db_path: Optional[Path] = None):
        self.db_path = db_path or DB_PATH
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    def _init_db(self):
        conn = sqlite3.connect(str(self.db_path))
        conn.executescript(SCHEMA)
        conn.executescript(FTS_SCHEMA)
        conn.close()

    def _get_conn(self) -> sqlite3.Connection:
        conn = sqlite3.connect(str(self.db_path))
        conn.row_factory = sqlite3.Row
        return conn

    def log(self, text: str, duration_seconds: float, model_used: str = "", language: str = "en"):
        conn = self._get_conn()
        try:
            conn.execute(
                """INSERT INTO transcriptions (timestamp, duration_seconds, text, char_count, word_count, model_used, language)
                   VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (
                    datetime.now().isoformat(),
                    round(duration_seconds, 2),
                    text,
                    len(text),
                    len(text.split()) if text else 0,
                    model_used,
                    language,
                ),
            )
            conn.commit()
        finally:
            conn.close()

    def get_history(self, page: int = 1, limit: int = 50, search: str = "",
                    sort: str = "desc", date_from: str = "", date_to: str = "") -> dict:
        conn = self._get_conn()
        try:
            offset = (page - 1) * limit
            params = []

            if search:
                base_query = """
                    SELECT t.* FROM transcriptions t
                    JOIN transcriptions_fts fts ON t.id = fts.rowid
                    WHERE fts.text MATCH ?
                """
                count_query = """
                    SELECT COUNT(*) FROM transcriptions t
                    JOIN transcriptions_fts fts ON t.id = fts.rowid
                    WHERE fts.text MATCH ?
                """
                params.append(search)
            else:
                base_query = "SELECT * FROM transcriptions WHERE 1=1"
                count_query = "SELECT COUNT(*) FROM transcriptions WHERE 1=1"

            if date_from:
                base_query += " AND timestamp >= ?"
                count_query += " AND timestamp >= ?"
                params.append(date_from)
            if date_to:
                base_query += " AND timestamp <= ?"
                count_query += " AND timestamp <= ?"
                params.append(date_to)

            total = conn.execute(count_query, params).fetchone()[0]

            order = "DESC" if sort == "desc" else "ASC"
            base_query += f" ORDER BY timestamp {order} LIMIT ? OFFSET ?"
            params.extend([limit, offset])

            rows = conn.execute(base_query, params).fetchall()
            items = [dict(r) for r in rows]

            return {"items": items, "total": total, "page": page, "limit": limit}
        finally:
            conn.close()

    def get_stats(self) -> dict:
        conn = self._get_conn()
        try:
            today = datetime.now().date().isoformat()
            today_row = conn.execute(
                "SELECT COALESCE(SUM(word_count),0) as words, COUNT(*) as count FROM transcriptions WHERE timestamp >= ?",
                (today,),
            ).fetchone()

            total_row = conn.execute(
                "SELECT COALESCE(SUM(word_count),0) as words, COUNT(*) as count, COALESCE(SUM(duration_seconds),0) as duration FROM transcriptions"
            ).fetchone()

            avg_words = 0
            if total_row["count"] > 0:
                avg_words = round(total_row["words"] / total_row["count"], 1)

            # Estimate time saved: avg typing 100 WPM, dictation is ~4x faster
            time_saved_minutes = round(total_row["words"] / 100 * 0.75, 1)

            return {
                "words_today": today_row["words"],
                "dictations_today": today_row["count"],
                "words_total": total_row["words"],
                "dictations_total": total_row["count"],
                "total_duration_seconds": round(total_row["duration"], 1),
                "avg_words_per_dictation": avg_words,
                "time_saved_minutes": time_saved_minutes,
            }
        finally:
            conn.close()

    def get_daily_stats(self, days: int = 30) -> list[dict]:
        conn = self._get_conn()
        try:
            since = (datetime.now() - timedelta(days=days)).isoformat()
            rows = conn.execute(
                """SELECT DATE(timestamp) as date, SUM(word_count) as words, COUNT(*) as count
                   FROM transcriptions WHERE timestamp >= ?
                   GROUP BY DATE(timestamp) ORDER BY date""",
                (since,),
            ).fetchall()
            return [dict(r) for r in rows]
        finally:
            conn.close()

    def delete_entry(self, entry_id: int):
        conn = self._get_conn()
        try:
            conn.execute("DELETE FROM transcriptions WHERE id = ?", (entry_id,))
            conn.commit()
        finally:
            conn.close()
