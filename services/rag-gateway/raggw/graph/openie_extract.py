"""Extração offline de candidatos OpenIE (#19).

Nunca grava produção — só `insert_candidate` → pending. Path de query do Super-RAG
não chama isto. LLM: Gemma-4 local (ou `extract_fn` injetável nos testes).
"""
from __future__ import annotations

import sqlite3
from typing import Any, Callable

from .candidates import TYPED_PREDICATES, ensure_schema, insert_candidate
from .gemma_index import extract_relation_candidates
from .lexicon import Lexicon

ExtractFn = Callable[..., list[dict[str, str]]]


def _already_exists(
    conn: sqlite3.Connection,
    source: str,
    predicate: str,
    target: str,
    chunk_id: int,
) -> bool:
    row = conn.execute(
        "SELECT 1 FROM openie_candidates "
        "WHERE source=? AND predicate=? AND target=? AND source_chunk_id=? LIMIT 1",
        (source, predicate, target, chunk_id),
    ).fetchone()
    return row is not None


def _normalize_endpoints(
    raw_src: str,
    raw_tgt: str,
    eid_a: str,
    eid_b: str,
    lexicon: Lexicon,
) -> tuple[str, str] | None:
    """Mapeia resposta do LLM para ids das entidades do par."""
    def resolve(tok: str) -> str | None:
        t = (tok or "").strip()
        if not t:
            return None
        if t in (eid_a, eid_b):
            return t
        if t.upper() == "A":
            return eid_a
        if t.upper() == "B":
            return eid_b
        ea, eb = lexicon.get(eid_a), lexicon.get(eid_b)
        if ea and t.lower() == (ea.label or "").lower():
            return eid_a
        if eb and t.lower() == (eb.label or "").lower():
            return eid_b
        # surfaces
        for eid, ent in ((eid_a, ea), (eid_b, eb)):
            if ent is None:
                continue
            for s in ent.surfaces:
                if t.lower() == s.lower():
                    return eid
        return None

    s, t = resolve(raw_src), resolve(raw_tgt)
    if not s or not t or s == t:
        return None
    if {s, t} != {eid_a, eid_b}:
        # só aceita o par sob inspeção (não inventa 3ª entidade)
        return None
    return s, t


def extract_from_chunk(
    conn: sqlite3.Connection,
    lexicon: Lexicon,
    chunk_id: int,
    chunk_text: str,
    *,
    extract_fn: ExtractFn | None = None,
    max_pairs: int = 12,
) -> int:
    """Extrai candidatos para um chunk; grava pending. Retorna quantos inseriu.

    Sem ≥2 entidades detectadas → 0 (não inventa).
    """
    ensure_schema(conn)
    ents = sorted(lexicon.detect(chunk_text or ""))
    if len(ents) < 2:
        return 0
    fn = extract_fn or (
        lambda text, a, b, **kw: extract_relation_candidates(text, a, b)
    )
    inserted = 0
    n_pairs = 0
    for i in range(len(ents)):
        for j in range(i + 1, len(ents)):
            if n_pairs >= max_pairs:
                return inserted
            n_pairs += 1
            eid_a, eid_b = ents[i], ents[j]
            try:
                raw_list = fn(chunk_text, eid_a, eid_b)
            except Exception:
                continue
            for raw in raw_list or []:
                if not isinstance(raw, dict):
                    continue
                pred = str(raw.get("predicate") or "").strip()
                if pred not in TYPED_PREDICATES:
                    continue
                ends = _normalize_endpoints(
                    str(raw.get("source") or ""),
                    str(raw.get("target") or ""),
                    eid_a, eid_b, lexicon,
                )
                if ends is None:
                    continue
                src, tgt = ends
                if _already_exists(conn, src, pred, tgt, chunk_id):
                    continue
                try:
                    insert_candidate(
                        conn,
                        source=src,
                        predicate=pred,
                        target=tgt,
                        source_chunk_id=chunk_id,
                        note="openie-extract",
                    )
                    inserted += 1
                except Exception:
                    continue
    return inserted


def run_extract_batch(
    conn: sqlite3.Connection,
    lexicon: Lexicon,
    *,
    limit: int = 50,
    after_chunk_id: int = 0,
    extract_fn: ExtractFn | None = None,
    max_pairs: int = 12,
) -> dict[str, Any]:
    """Batch retomável sobre chunks ativos (ORDER BY id). Offline only."""
    lim = max(1, min(int(limit), 5000))
    after = max(0, int(after_chunk_id))
    rows = conn.execute(
        "SELECT dc.id, dc.chunk_text FROM document_chunks dc "
        "JOIN documents d ON d.id = dc.document_id "
        "WHERE d.status='active' AND dc.id > ? "
        "ORDER BY dc.id ASC LIMIT ?",
        (after, lim),
    ).fetchall()
    seen = 0
    inserted = 0
    last_id = after
    for r in rows:
        cid = int(r["id"] if hasattr(r, "keys") else r[0])
        text = r["chunk_text"] if hasattr(r, "keys") else r[1]
        last_id = cid
        seen += 1
        inserted += extract_from_chunk(
            conn, lexicon, cid, text or "",
            extract_fn=extract_fn, max_pairs=max_pairs,
        )
    return {
        "chunks_seen": seen,
        "candidates_inserted": inserted,
        "last_chunk_id": last_id,
        "after_chunk_id": after,
        "limit": lim,
    }
