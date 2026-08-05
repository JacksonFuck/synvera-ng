"""raggw.scripts.smoke.run_smoke: passes when every query returns hits, fails when
any query comes back empty. Fake embedder/reranker only — no BGE-M3 download."""
from __future__ import annotations

from raggw import db
from raggw.embedding import FakeEmbedder, encode_vector
from raggw.reranking import FakeReranker
from raggw.scripts.smoke import run_smoke

_EMB = FakeEmbedder(dim=8)
_RERANKER = FakeReranker()


def _seed_one_chunk(conn, text: str) -> None:
    doc_id = conn.execute(
        "INSERT INTO documents (source_path, content_hash, status) VALUES (?,?,?)",
        (f"/{text}.pdf", f"hash-{text}", "active"),
    ).lastrowid
    vec = encode_vector(_EMB.embed([text])[0])
    cid = conn.execute(
        """INSERT INTO document_chunks
             (document_id, chunk_index, chunk_text, contextual_text, section_path,
              page_start, page_end, token_count, citation_label, embedding)
           VALUES (?,0,?,?,?,1,1,?,?,?)""",
        (doc_id, text, text, "Secao", len(text.split()), "doc p. 1", vec),
    ).lastrowid
    conn.execute("INSERT INTO chunk_fts (rowid, chunk_text) VALUES (?,?)", (cid, text))
    conn.commit()


def test_run_smoke_passes_when_queries_have_hits(db_path):
    conn = db.open_db(db_path)
    _seed_one_chunk(conn, "sepse grave tratamento antibiotico precoce")

    result = run_smoke(conn, _EMB, _RERANKER, store=None,
                       queries=["sepse grave tratamento"])

    assert result.passed is True
    assert len(result.per_query) == 1
    assert result.per_query[0].ok is True
    assert result.per_query[0].hits >= 1


def test_run_smoke_fails_when_a_query_has_no_hits(db_path):
    conn = db.open_db(db_path)  # empty corpus: no documents/chunks at all

    result = run_smoke(conn, _EMB, _RERANKER, store=None,
                       queries=["sepse grave tratamento", "fratura tornozelo gesso"])

    assert result.passed is False
    assert all(r.hits == 0 and r.ok is False for r in result.per_query)


def test_run_smoke_defaults_to_the_three_builtin_queries(db_path):
    conn = db.open_db(db_path)  # empty corpus -> every default query should miss

    result = run_smoke(conn, _EMB, _RERANKER, store=None)

    assert len(result.per_query) == 3
    assert result.passed is False
