"""
Migration runner for the BESS layout tool.
Applies numbered SQL files from backend/src/migrations/ in order.
Each migration runs exactly once, tracked in the schema_migrations table.
"""
import os
import sqlite3
import glob
import logging

logger = logging.getLogger(__name__)

MIGRATIONS_DIR = os.path.join(os.path.dirname(__file__), "..", "src", "migrations")
DB_PATH = os.getenv("SQLITE_DB_PATH", "./data/bess.db")


def get_connection() -> sqlite3.Connection:
    os.makedirs(os.path.dirname(DB_PATH) if os.path.dirname(DB_PATH) else ".", exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA foreign_keys = ON")
    conn.row_factory = sqlite3.Row
    return conn


def run_migrations() -> None:
    conn = get_connection()
    try:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS schema_migrations (
                filename TEXT PRIMARY KEY,
                applied_at TEXT NOT NULL DEFAULT (datetime('now'))
            )
        """)
        conn.commit()

        applied = {row["filename"] for row in conn.execute("SELECT filename FROM schema_migrations")}

        sql_files = sorted(glob.glob(os.path.join(MIGRATIONS_DIR, "*.sql")))
        for path in sql_files:
            filename = os.path.basename(path)
            if filename in applied:
                continue
            logger.info("Applying migration: %s", filename)
            with open(path, "r", encoding="utf-8") as f:
                sql = f.read()
            conn.executescript(sql)
            conn.execute("INSERT INTO schema_migrations (filename) VALUES (?)", (filename,))
            conn.commit()
            logger.info("Applied: %s", filename)
    finally:
        conn.close()
