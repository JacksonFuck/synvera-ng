"""Store de candidatos OpenIE (#18) — fora do grafo de produção.

Candidatos ficam em `pending` até gate manual (#20). Nunca escrevem `graph_edges`
nem `typed_edges` de produção. Schema fechado + source_chunk_id obrigatório.
"""
from __future__ import annotations

import sqlite3
from typing import Any

# Espelho do Clinical GraphRAG (Fase 1–3).
TYPED_PREDICATES = frozenset({
    "trata", "tratado_por", "dd", "interage", "contraindicado",
})

_STATUSES = frozenset({"pending", "promoted", "rejected"})

_SCHEMA = """
CREATE TABLE IF NOT EXISTS openie_candidates (
    id              INTEGER PRIMARY KEY,
    source          TEXT NOT NULL,
    predicate       TEXT NOT NULL,
    target          TEXT NOT NULL,
    source_chunk_id INTEGER NOT NULL,
    status          TEXT NOT NULL DEFAULT 'pending',
    citation_label  TEXT,
    page_start      INTEGER,
    page_end        INTEGER,
    document_id     INTEGER,
    note            TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_openie_status ON openie_candidates(status);
CREATE INDEX IF NOT EXISTS idx_openie_chunk ON openie_candidates(source_chunk_id);
"""


class CandidateError(ValueError):
    """Candidato inválido (schema, chunk ou endpoints)."""


def ensure_schema(conn: sqlite3.Connection) -> None:
    conn.executescript(_SCHEMA)
    conn.commit()


def _row_to_dict(row: sqlite3.Row | None) -> dict[str, Any] | None:
    if row is None:
        return None
    return {k: row[k] for k in row.keys()}


def _resolve_chunk(conn: sqlite3.Connection, chunk_id: int) -> dict[str, Any]:
    """Chunk ativo com citation resolvível; senão CandidateError."""
    row = conn.execute(
        "SELECT dc.id AS chunk_id, dc.document_id, dc.citation_label, "
        "dc.page_start, dc.page_end "
        "FROM document_chunks dc "
        "JOIN documents d ON d.id = dc.document_id "
        "WHERE dc.id=? AND d.status='active'",
        (int(chunk_id),),
    ).fetchone()
    if row is None:
        raise CandidateError(
            f"chunk fonte inexistente ou inativo: source_chunk_id={chunk_id}"
        )
    cite = (row["citation_label"] or "").strip()
    if not cite:
        raise CandidateError(
            f"chunk fonte sem citation_label: source_chunk_id={chunk_id}"
        )
    return {
        "chunk_id": int(row["chunk_id"]),
        "document_id": int(row["document_id"]),
        "citation_label": cite,
        "page_start": row["page_start"],
        "page_end": row["page_end"],
    }


def insert_candidate(
    conn: sqlite3.Connection,
    *,
    source: str,
    predicate: str,
    target: str,
    source_chunk_id: int,
    note: str | None = None,
    status: str = "pending",
) -> int:
    """Insere candidato. Default `pending`. Não toca graph_edges de produção."""
    ensure_schema(conn)
    src = (source or "").strip()
    tgt = (target or "").strip()
    pred = (predicate or "").strip()
    st = (status or "pending").strip()
    if not src or not tgt:
        raise CandidateError("source e target são obrigatórios")
    if src == tgt:
        raise CandidateError("source e target devem ser distintos")
    if pred not in TYPED_PREDICATES:
        raise CandidateError(f"predicado fora do schema fechado: {pred!r}")
    if st not in _STATUSES:
        raise CandidateError(f"status inválido: {st!r}")
    # #18: só pending na escrita normal; promoted/rejected vêm do gate (#20)
    if st != "pending":
        raise CandidateError(
            "insert_candidate só aceita status=pending; use o gate para promover/rejeitar"
        )

    meta = _resolve_chunk(conn, source_chunk_id)
    cur = conn.execute(
        "INSERT INTO openie_candidates "
        "(source, predicate, target, source_chunk_id, status, citation_label, "
        " page_start, page_end, document_id, note) "
        "VALUES (?,?,?,?,?,?,?,?,?,?)",
        (
            src, pred, tgt, meta["chunk_id"], "pending",
            meta["citation_label"], meta["page_start"], meta["page_end"],
            meta["document_id"], note,
        ),
    )
    conn.commit()
    return int(cur.lastrowid)


def get_candidate(conn: sqlite3.Connection, candidate_id: int) -> dict[str, Any] | None:
    ensure_schema(conn)
    row = conn.execute(
        "SELECT * FROM openie_candidates WHERE id=?", (int(candidate_id),)
    ).fetchone()
    return _row_to_dict(row)


def list_candidates(
    conn: sqlite3.Connection,
    *,
    status: str | None = None,
    limit: int = 500,
) -> list[dict[str, Any]]:
    """Lista candidatos; `status` filtra (ex. pending)."""
    ensure_schema(conn)
    lim = max(1, min(int(limit), 5000))
    if status is not None:
        st = status.strip()
        if st not in _STATUSES:
            raise CandidateError(f"status inválido: {st!r}")
        rows = conn.execute(
            "SELECT * FROM openie_candidates WHERE status=? "
            "ORDER BY id ASC LIMIT ?",
            (st, lim),
        ).fetchall()
    else:
        rows = conn.execute(
            "SELECT * FROM openie_candidates ORDER BY id ASC LIMIT ?",
            (lim,),
        ).fetchall()
    return [_row_to_dict(r) for r in rows]  # type: ignore[misc]


def _ensure_graph_schema(conn: sqlite3.Connection) -> None:
    """Tabelas de produção do GraphStore (sem rebuild)."""
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS graph_nodes (
            entity_id TEXT PRIMARY KEY,
            label     TEXT,
            kind      TEXT
        );
        CREATE TABLE IF NOT EXISTS graph_edges (
            a      TEXT NOT NULL,
            b      TEXT NOT NULL,
            rel    TEXT NOT NULL DEFAULT 'cooc',
            weight REAL NOT NULL DEFAULT 0,
            PRIMARY KEY (a, b, rel)
        );
        """
    )


def promote_candidate(
    conn: sqlite3.Connection,
    candidate_id: int,
    *,
    note: str | None = None,
) -> dict[str, Any]:
    """Gate manual (#20): pending → aresta tipada de produção + status promoted.

    Revalida chunk ativo + citation e predicado fechado. Não promove em silêncio.
    """
    ensure_schema(conn)
    row = get_candidate(conn, candidate_id)
    if row is None:
        raise CandidateError(f"candidato inexistente: id={candidate_id}")
    if row["status"] != "pending":
        raise CandidateError(
            f"só candidatos pending podem ser promovidos (status={row['status']!r})"
        )
    pred = row["predicate"]
    if pred not in TYPED_PREDICATES:
        raise CandidateError(f"predicado fora do schema fechado: {pred!r}")
    # revalida âncora no momento do promote (chunk pode ter sido invalidado)
    meta = _resolve_chunk(conn, int(row["source_chunk_id"]))
    src, tgt = row["source"], row["target"]

    _ensure_graph_schema(conn)
    for eid, label in ((src, src), (tgt, tgt)):
        conn.execute(
            "INSERT OR IGNORE INTO graph_nodes (entity_id, label, kind) VALUES (?,?,?)",
            (eid, label, None),
        )
    # peso alinhado às typed_edges curadas no build_from_chunks
    conn.execute(
        "INSERT OR REPLACE INTO graph_edges (a, b, rel, weight) VALUES (?,?,?,?)",
        (src, tgt, pred, 5.0),
    )
    conn.execute(
        "UPDATE openie_candidates SET status='promoted', "
        "citation_label=?, page_start=?, page_end=?, document_id=?, "
        "note=COALESCE(?, note), updated_at=datetime('now') WHERE id=?",
        (
            meta["citation_label"], meta["page_start"], meta["page_end"],
            meta["document_id"], note, int(candidate_id),
        ),
    )
    conn.commit()
    out = get_candidate(conn, candidate_id)
    assert out is not None
    return out


def reject_candidate(
    conn: sqlite3.Connection,
    candidate_id: int,
    *,
    note: str | None = None,
) -> dict[str, Any]:
    """Gate manual (#20): pending → rejected; não escreve produção."""
    ensure_schema(conn)
    row = get_candidate(conn, candidate_id)
    if row is None:
        raise CandidateError(f"candidato inexistente: id={candidate_id}")
    if row["status"] != "pending":
        raise CandidateError(
            f"só candidatos pending podem ser rejeitados (status={row['status']!r})"
        )
    conn.execute(
        "UPDATE openie_candidates SET status='rejected', "
        "note=COALESCE(?, note), updated_at=datetime('now') WHERE id=?",
        (note, int(candidate_id)),
    )
    conn.commit()
    out = get_candidate(conn, candidate_id)
    assert out is not None
    return out
