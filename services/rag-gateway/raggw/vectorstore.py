"""VectorStore port + adapters para o estágio denso.

- BruteForceStore: cosseno exato sobre os BLOBs do SQLite (fonte canônica). Default seguro,
  zero-dependência. Correto em qualquer escala, mas O(N) por query.
- LanceDbStore: ANN (LanceDB). Acelera o denso quando o corpus cresce (~>50k chunks); os
  vetores espelham os BLOBs do SQLite, filtro status/specialty via where().

Os BLOBs do SQLite continuam canônicos → trocar/recriar o índice ANN é sempre reversível.
"""
from __future__ import annotations

import math
import os
import sqlite3
from typing import Protocol, runtime_checkable

from .config import Settings
from .embedding import decode_vector

# Calibração do IVF. Defaults para ~1024 partições (≈sqrt(625k chunks)): 20 partições
# varridas ≈ 2% do corpus, com re-scoring exato do topo. Ajustável sem editar código.
_NPROBES = int(os.environ.get("RAG_ANN_NPROBES", "20"))
_REFINE_FACTOR = int(os.environ.get("RAG_ANN_REFINE_FACTOR", "10"))


@runtime_checkable
class VectorStore(Protocol):
    def add(self, items: list[dict]) -> None: ...
    def search(self, query_vec: list[float], top_n: int, *,
               specialties: list[str] | None = None) -> list[int]: ...


def _cosine(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(y * y for y in b))
    return dot / (na * nb) if na and nb else 0.0


class BruteForceStore:
    """Cosseno exato sobre document_chunks.embedding (SQLite). Default seguro/dep-free."""

    def __init__(self, conn: sqlite3.Connection) -> None:
        self._conn = conn

    def add(self, items: list[dict]) -> None:
        return  # no-op: os embeddings já vivem em document_chunks.embedding (canônico)

    def search(self, query_vec: list[float], top_n: int, *,
               specialties: list[str] | None = None) -> list[int]:
        sql = ("SELECT dc.id, dc.embedding FROM document_chunks dc "
               "JOIN documents d ON d.id = dc.document_id "
               "WHERE d.status = 'active' AND dc.embedding IS NOT NULL")
        params: list = []
        if specialties:
            sql += f" AND dc.specialty IN ({','.join('?' * len(specialties))})"
            params += list(specialties)
        scored = [(_cosine(query_vec, decode_vector(r["embedding"])), r["id"])
                  for r in self._conn.execute(sql, params)]
        scored.sort(reverse=True)
        return [cid for _, cid in scored[:top_n]]


class LanceDbStore:
    """ANN via LanceDB (cosine). Vetores espelham os BLOBs do SQLite."""

    def __init__(self, uri: str, dim: int, table: str = "chunks") -> None:
        import lancedb
        self._db = lancedb.connect(uri)
        self._dim = dim
        self._table = table

    def add(self, items: list[dict]) -> None:
        rows = [{
            "id": int(it["id"]),
            "vector": [float(x) for x in it["vector"]],
            "specialty": it.get("specialty") or "",
            "status": it.get("status") or "active",
        } for it in items]
        if not rows:
            return
        try:
            self._db.open_table(self._table).add(rows)
        except Exception:
            self._db.create_table(self._table, data=rows)

    def search(self, query_vec: list[float], top_n: int, *,
               specialties: list[str] | None = None) -> list[int]:
        try:
            tbl = self._db.open_table(self._table)
        except Exception:
            return []
        conds = ["status = 'active'"]
        if specialties:
            inlist = ",".join("'" + s.replace("'", "''") + "'" for s in specialties)
            conds.append(f"specialty IN ({inlist})")
        # nprobes/refine_factor são o botão de calibração recall↔latência do IVF: nprobes
        # partições varridas de num_partitions, depois refine_factor*top_n candidatos
        # re-pontuados com distância exata. Sem índice ANN ambos são ignorados (flat scan),
        # então isto é seguro antes de scripts/build_ann_index.py rodar.
        res = (tbl.search([float(x) for x in query_vec]).metric("cosine")
               .nprobes(_NPROBES).refine_factor(_REFINE_FACTOR)
               .where(" AND ".join(conds)).limit(top_n).to_list())
        return [int(r["id"]) for r in res]


def make_vector_store(settings: Settings) -> VectorStore | None:
    """LanceDbStore quando RAG_VECTOR_STORE=lancedb (+ RAG_LANCEDB_URI); senão None
    (= estágio denso brute-force sobre o SQLite). Trocar é só uma env var."""
    if os.environ.get("RAG_VECTOR_STORE", "").lower() == "lancedb":
        uri = os.environ.get("RAG_LANCEDB_URI", "data/lancedb")
        return LanceDbStore(uri, dim=settings.embed_dim)
    return None
