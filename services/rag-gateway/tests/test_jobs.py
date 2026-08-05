"""Job queue + worker: enqueue -> processing -> done|failed, tracked in ingestion_jobs."""
from __future__ import annotations

from raggw import db, jobs
from raggw.config import get_settings
from raggw.embedding import FakeEmbedder


def test_enqueue_creates_queued_job(db_path):
    conn = db.open_db(db_path)
    jid = jobs.enqueue(conn, "/some/file.pdf")
    row = conn.execute("SELECT * FROM ingestion_jobs WHERE id=?", (jid,)).fetchone()
    assert row["status"] == "queued"
    assert row["file_ref"] == "/some/file.pdf"


def test_process_next_ingests_and_marks_done(db_path, sample_pdf):
    conn = db.open_db(db_path)
    jid = jobs.enqueue(conn, str(sample_pdf))
    job = jobs.process_next(conn, embedder=FakeEmbedder(dim=8), settings=get_settings())
    assert job["id"] == jid
    assert job["status"] == "done"
    assert job["document_id"] is not None
    assert job["progress"] == 1.0
    n = conn.execute("SELECT COUNT(*) c FROM document_chunks WHERE document_id=?",
                     (job["document_id"],)).fetchone()["c"]
    assert n >= 1


def test_process_next_marks_failed_on_bad_file(db_path, tmp_path):
    conn = db.open_db(db_path)
    jobs.enqueue(conn, str(tmp_path / "does_not_exist.pdf"))
    job = jobs.process_next(conn, embedder=FakeEmbedder(dim=8), settings=get_settings())
    assert job["status"] == "failed"
    assert job["error"]


def test_process_next_returns_none_when_queue_empty(db_path):
    conn = db.open_db(db_path)
    assert jobs.process_next(conn, embedder=FakeEmbedder(dim=8),
                             settings=get_settings()) is None


def test_metadata_flows_from_job_to_document(db_path, sample_pdf):
    conn = db.open_db(db_path)
    jobs.enqueue(conn, str(sample_pdf),
                 {"specialty": "intensiva", "evidence_level": "guideline"})
    job = jobs.process_next(conn, embedder=FakeEmbedder(dim=8), settings=get_settings())
    d = conn.execute("SELECT specialty, evidence_level FROM documents WHERE id=?",
                     (job["document_id"],)).fetchone()
    assert d["specialty"] == "intensiva"
    assert d["evidence_level"] == "guideline"
