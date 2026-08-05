"""Acceptance: ingest 1 real PDF -> N citable chunks with page + section, dedup, curation."""
from __future__ import annotations

from raggw import db
from raggw.config import get_settings
from raggw.embedding import FakeEmbedder
from raggw.ingest import ingest_file
from raggw.models import Block, ParsedDoc


def test_ingest_pdf_produces_citable_chunks(db_path, sample_pdf):
    conn = db.open_db(db_path)
    res = ingest_file(conn, sample_pdf, embedder=FakeEmbedder(dim=8), settings=get_settings())

    assert res.skipped is False
    assert res.n_chunks >= 1
    rows = conn.execute(
        "SELECT * FROM document_chunks WHERE document_id=? ORDER BY chunk_index",
        (res.document_id,)).fetchall()
    assert len(rows) == res.n_chunks
    for r in rows:
        assert r["page_start"] >= 1 and r["page_end"] >= r["page_start"]
        assert r["citation_label"]
        assert r["embedding"] is not None
    assert any(r["section_path"] for r in rows), "at least one chunk must carry a section_path"


def test_ingested_chunks_are_fts_searchable(db_path, sample_pdf):
    conn = db.open_db(db_path)
    ingest_file(conn, sample_pdf, embedder=FakeEmbedder(dim=8), settings=get_settings())
    hits = conn.execute(
        "SELECT rowid FROM chunk_fts WHERE chunk_fts MATCH 'sepse'").fetchall()
    assert hits, "lexical index should find ingested content"


def test_ingest_is_idempotent_by_content_hash(db_path, sample_pdf):
    conn = db.open_db(db_path)
    s = get_settings()
    r1 = ingest_file(conn, sample_pdf, embedder=FakeEmbedder(dim=8), settings=s)
    r2 = ingest_file(conn, sample_pdf, embedder=FakeEmbedder(dim=8), settings=s)
    assert r2.skipped is True
    assert r2.document_id == r1.document_id
    assert conn.execute("SELECT COUNT(*) c FROM documents").fetchone()["c"] == 1


def test_ingest_persists_curation_metadata(db_path, sample_pdf):
    conn = db.open_db(db_path)
    res = ingest_file(
        conn, sample_pdf, embedder=FakeEmbedder(dim=8), settings=get_settings(),
        metadata={"specialty": "intensiva", "evidence_level": "guideline",
                  "publication_year": 2025, "source_type": "guideline",
                  "title": "Surviving Sepsis 2025"})
    d = conn.execute("SELECT * FROM documents WHERE id=?", (res.document_id,)).fetchone()
    assert d["specialty"] == "intensiva"
    assert d["evidence_level"] == "guideline"
    assert d["publication_year"] == 2025
    assert d["title"] == "Surviving Sepsis 2025"
    assert d["ingestion_status"] == "done"


def test_ingest_persists_parser_and_markdown_artifact(db_path, tmp_path, sample_pdf, monkeypatch):
    monkeypatch.setenv("RAG_MARKDOWN_DIR", str(tmp_path / "markdown"))
    conn = db.open_db(db_path)

    def parse(_path):
        return ParsedDoc(
            markdown="# Titulo\n\nconteudo estruturado",
            blocks=[Block("Titulo", 1, "Titulo", "heading"),
                    Block("conteudo estruturado", 1, "Titulo", "text")],
            page_count=1,
            parser="unitparser",
            source_path=str(sample_pdf),
        )

    res = ingest_file(conn, sample_pdf, embedder=FakeEmbedder(dim=8),
                      settings=get_settings(), parse=parse)
    d = conn.execute("SELECT * FROM documents WHERE id=?", (res.document_id,)).fetchone()

    assert d["parser"] == "unitparser"
    assert d["page_count"] == 1
    assert d["markdown_path"]
    assert res.markdown_path == d["markdown_path"]
    assert "conteudo estruturado" in (tmp_path / "markdown").glob("*.md").__next__().read_text()


def test_ingest_surfaces_degraded_parser_when_fallback_triggered(db_path, sample_pdf):
    conn = db.open_db(db_path)

    def parse(_path):
        return ParsedDoc(
            markdown="# Titulo\n\nconteudo",
            blocks=[Block("Titulo", 1, "Titulo", "heading"),
                    Block("conteudo", 1, "Titulo", "text")],
            page_count=1,
            parser="pdftotext",
            source_path=str(sample_pdf),
            fallback_from="mineru",
        )

    res = ingest_file(conn, sample_pdf, embedder=FakeEmbedder(dim=8),
                      settings=get_settings(), parse=parse)

    assert res.parser == "pdftotext"
    assert res.degraded_parser == "mineru"


def test_ingest_leaves_degraded_parser_none_on_normal_path(db_path, sample_pdf):
    conn = db.open_db(db_path)
    res = ingest_file(conn, sample_pdf, embedder=FakeEmbedder(dim=8), settings=get_settings())
    assert res.degraded_parser is None


def test_ingest_quarantines_low_quality_doc_with_reason(db_path, sample_pdf):
    conn = db.open_db(db_path)

    def parse(_path):
        return ParsedDoc(markdown="", blocks=[], page_count=1, parser="x")

    res = ingest_file(conn, sample_pdf, embedder=FakeEmbedder(dim=8),
                      settings=get_settings(), parse=parse)

    assert res.quarantined is True
    assert res.quarantine_reason == "no_extractable_text"
    assert res.n_chunks == 0

    d = conn.execute("SELECT * FROM documents WHERE id=?", (res.document_id,)).fetchone()
    assert d["ingestion_status"] == "quarantined"
    assert d["quarantine_reason"] == "no_extractable_text"

    n_chunks = conn.execute(
        "SELECT COUNT(*) c FROM document_chunks WHERE document_id=?",
        (res.document_id,)).fetchone()["c"]
    assert n_chunks == 0


def test_quarantined_doc_produces_no_citable_chunks(db_path, sample_pdf):
    conn = db.open_db(db_path)

    def parse(_path):
        return ParsedDoc(markdown="", blocks=[], page_count=1, parser="x")

    res = ingest_file(conn, sample_pdf, embedder=FakeEmbedder(dim=8),
                      settings=get_settings(), parse=parse)

    chunk_ids = [r["id"] for r in conn.execute(
        "SELECT id FROM document_chunks WHERE document_id=?", (res.document_id,))]
    assert chunk_ids == []

    fts_count = conn.execute("SELECT COUNT(*) c FROM chunk_fts").fetchone()["c"]
    assert fts_count == 0  # quarantine wrote no chunks -> nothing to index lexically
