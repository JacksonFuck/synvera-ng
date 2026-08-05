"""CLI scripts: parse_file (folder -> markdown) + seed_corpus (auto-ingest folder)."""
from __future__ import annotations

from raggw import db
from raggw.config import get_settings
from raggw.embedding import FakeEmbedder
from raggw.parsing.pdftotext_parser import PdftotextParser
from raggw.scripts import parse_file as pf
from raggw.scripts import seed_corpus as sc


def test_discover_filters_to_supported_files(tmp_path, sample_pdf):
    folder = tmp_path / "docs"
    (folder / "sub").mkdir(parents=True)
    (folder / "a.pdf").write_bytes(sample_pdf.read_bytes())
    (folder / "sub" / "b.pdf").write_bytes(sample_pdf.read_bytes())
    (folder / "ignore.zzz").write_text("x")
    found = pf.discover(folder)
    assert len(found) == 2
    assert all(p.suffix == ".pdf" for p in found)


def test_parse_run_writes_markdown(tmp_path, sample_pdf):
    written = pf.run(sample_pdf, tmp_path / "md")
    assert len(written) == 1
    text = written[0].read_text("utf-8").lower()
    assert "alpha" in text or "beta" in text


def test_seed_ingests_folder_and_is_idempotent(tmp_path, sample_pdf):
    folder = tmp_path / "corpus"
    folder.mkdir()
    (folder / "doc1.pdf").write_bytes(sample_pdf.read_bytes())
    db_path = str(tmp_path / "seed.db")
    emb, settings = FakeEmbedder(dim=8), get_settings()

    first = sc.seed(folder, db_path=db_path, embedder=emb, settings=settings)
    assert first["files"] == 1 and first["ingested"] == 1 and first["chunks"] >= 1

    second = sc.seed(folder, db_path=db_path, embedder=emb, settings=settings)
    assert second["skipped"] == 1 and second["ingested"] == 0

    conn = db.open_db(db_path)
    assert conn.execute("SELECT COUNT(*) c FROM documents").fetchone()["c"] == 1


def test_seed_summary_reports_degraded_count(tmp_path, sample_pdf):
    folder = tmp_path / "corpus"
    folder.mkdir()
    (folder / "doc1.pdf").write_bytes(sample_pdf.read_bytes())
    db_path = str(tmp_path / "seed.db")
    emb, settings = FakeEmbedder(dim=8), get_settings()

    def forced_fallback_parse(path):
        # Simulate a mineru/liteparse tier raising and the router falling back to
        # pdftotext, without invoking any real heavy parser.
        doc = PdftotextParser().parse(path)
        doc.fallback_from = "mineru"
        return doc

    summary = sc.seed(folder, db_path=db_path, embedder=emb, settings=settings,
                      parse=forced_fallback_parse)

    assert summary["ingested"] == 1
    assert summary["degraded"] == 1
