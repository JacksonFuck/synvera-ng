"""Multi-dense retrieval extension for Simvera 2.0.

Adiciona suporte a múltiplos retrievers densos (BgeM3 + MedCPT) no pipeline
de busca híbrida. A fusão RRF combina:
  1. BM25 lexical (FTS5)
  2. BgeM3 dense (1024-dim, general-domain)
  3. MedCPT dense (768-dim, biomedical-domain) — NOVO
  4. Graph expansion (Wikidata ontology)

O resultado é uma fusão rank-based onde cada retriever contribui
independentemente, sem necessidade de alinhar espaços vetoriais.
"""

from __future__ import annotations

import sqlite3

from .embedding import decode_vector
from .retrieval import _cosine


def dense_search_multiple(
    conn: sqlite3.Connection,
    query_vecs: dict[str, list[float]],
    top_n: int,
    *,
    specialty: str | None = None,
    specialties: list[str] | None = None,
) -> dict[str, list[int]]:
    """Busca densa com múltiplos embedders.

    Cada embedder tem seu próprio espaço vetorial (dimensões diferentes).
    Cada um faz sua busca independente e retorna seu ranking.

    Args:
        conn: SQLite connection
        query_vecs: Dict[embedder_name, query_vector]
        top_n: Número de candidatos por embedder
        specialty: Especialidade médica para filtrar
        specialties: Lista de especialidades

    Returns:
        Dict[embedder_name, list[chunk_ids]] — rankings por embedder
    """
    from .retrieval import _resolve_specs, _spec_clause

    specs = _resolve_specs(specialty, specialties)
    spec_clause = _spec_clause(specs)
    params_base: list = list(specs or [])

    # Mapeia modelo → coluna de embedding no SQLite
    EMBEDDING_COLUMN = {
        "bge-m3": "embedding",
        "medcpt": "embedding_medcpt",
        "contriever": "embedding_contriever",
    }

    # Para cada embedder, consulta a coluna correta e computa cosine similarity
    results: dict[str, list[int]] = {}
    for name, qvec in query_vecs.items():
        col = EMBEDDING_COLUMN.get(name, "embedding")
        sql = (
            f"SELECT dc.id, dc.{col} FROM document_chunks dc "
            "JOIN documents d ON d.id = dc.document_id "
            f"WHERE d.status = 'active' AND dc.{col} IS NOT NULL" + spec_clause
        )
        rows = conn.execute(sql, params_base).fetchall()
        if not rows:
            results[name] = []
            continue

        scored = [
            (_cosine(qvec, decode_vector(r[col])), r["id"])
            for r in rows
        ]
        scored.sort(reverse=True)
        results[name] = [cid for _, cid in scored[:top_n]]

    return results
