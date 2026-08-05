"""Job queue + worker backed by ingestion_jobs. Long batch ingestion runs off the
live LLMs (doesn't contend for VRAM). Worker uses its own SQLite connection per thread."""
from __future__ import annotations

import json
import sqlite3
import threading
import time
from pathlib import Path

from . import db
from .config import Settings
from .embedding import Embedder
from .ingest import ingest_file
from .vectorstore import VectorStore


def enqueue(conn: sqlite3.Connection, file_ref: str | Path,
            metadata: dict | None = None) -> int:
    cur = conn.execute(
        "INSERT INTO ingestion_jobs (file_ref, status, metadata) VALUES (?, 'queued', ?)",
        (str(file_ref), json.dumps(metadata) if metadata else None))
    conn.commit()
    return cur.lastrowid


def _update(conn: sqlite3.Connection, job_id: int, **fields) -> None:
    cols = ", ".join(f"{k}=?" for k in fields)
    conn.execute(
        f"UPDATE ingestion_jobs SET {cols}, updated_at=datetime('now') WHERE id=?",
        (*fields.values(), job_id))
    conn.commit()


def process_next(conn: sqlite3.Connection, *, embedder: Embedder,
                 settings: Settings,
                 vector_store: VectorStore | None = None) -> sqlite3.Row | None:
    row = conn.execute(
        "SELECT * FROM ingestion_jobs WHERE status='queued' ORDER BY id LIMIT 1").fetchone()
    if row is None:
        return None
    job_id = row["id"]
    metadata = json.loads(row["metadata"]) if row["metadata"] else None
    _update(conn, job_id, status="processing", progress=0.1)
    try:
        res = ingest_file(conn, row["file_ref"], embedder=embedder, settings=settings,
                          metadata=metadata, vector_store=vector_store)
        _update(conn, job_id, status="done", progress=1.0, document_id=res.document_id)
    except Exception as exc:  # noqa: BLE001 — surface any failure to the job row
        _update(conn, job_id, status="failed", error=str(exc)[:500])
    return conn.execute("SELECT * FROM ingestion_jobs WHERE id=?", (job_id,)).fetchone()


class Worker(threading.Thread):
    """Background drain loop for the API. Daemon; opens its own connection."""

    def __init__(self, db_path, *, embedder: Embedder, settings: Settings,
                 vector_store: VectorStore | None = None,
                 poll_seconds: float = 0.25) -> None:
        super().__init__(daemon=True)
        self._db_path = db_path
        self._embedder = embedder
        self._settings = settings
        self._vector_store = vector_store
        self._poll = poll_seconds
        self._stop = threading.Event()

    def run(self) -> None:
        conn = db.connect(self._db_path)
        try:
            while not self._stop.is_set():
                processed = process_next(conn, embedder=self._embedder,
                                         settings=self._settings,
                                         vector_store=self._vector_store)
                if processed is None:
                    time.sleep(self._poll)
        finally:
            conn.close()

    def stop(self) -> None:
        self._stop.set()
