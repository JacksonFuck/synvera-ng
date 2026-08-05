"""(Re)constrói o GraphStore (tabelas graph_*) a partir dos chunks ativos.

Sem isso o 3º sinal de retrieval é morto: /rag/search reporta
`graph_required=True, graph_candidates=0` em toda query — que era o estado medido aqui.

Uso:
    .venv/bin/python scripts/build_graph.py

Idempotente (build_from_chunks limpa e reinsere). Determinístico, sem LLM.
"""
from __future__ import annotations

import os
import sqlite3
import sys
import time
from pathlib import Path

from raggw.graph.store import build_graph_index


def main() -> int:
    db_path = Path(os.environ.get("RAG_DB_PATH", "data/rag_corpus.db"))
    if not db_path.exists():
        print(f"ERRO: {db_path} não existe")
        return 1

    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row

    n = conn.execute(
        "SELECT count(*) FROM document_chunks dc JOIN documents d ON d.id = dc.document_id "
        "WHERE d.status = 'active'").fetchone()[0]
    print(f"banco  : {db_path}")
    print(f"chunks : {n:,} ativos")
    print("construindo (detect por chunk sobre o léxico curado)…", flush=True)

    t0 = time.time()
    stats = build_graph_index(conn)
    dt = time.time() - t0

    print(f"\nOK em {dt:.1f}s -> {stats}")
    for tbl in ("graph_nodes", "graph_edges", "graph_chunk_entities"):
        try:
            c = conn.execute(f"SELECT count(*) FROM {tbl}").fetchone()[0]
            print(f"  {tbl:22s} {c:,}")
        except sqlite3.OperationalError:
            print(f"  {tbl:22s} (ausente)")

    cov = conn.execute("SELECT count(DISTINCT chunk_id) FROM graph_chunk_entities").fetchone()[0]
    print(f"  cobertura              {cov:,}/{n:,} chunks ({cov / n * 100:.1f}%)" if n else "")

    # As tabelas novas mudam as estatísticas do planner; sem isto os JOINs do expand()
    # podem escolher o plano ruim (mesma armadilha que custava 9.6s em _load_chunks).
    print("\nANALYZE…", flush=True)
    t0 = time.time()
    conn.execute("ANALYZE")
    conn.commit()
    print(f"ANALYZE em {time.time() - t0:.1f}s")
    conn.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
