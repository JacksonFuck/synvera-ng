"""Constrói o índice ANN do LanceDB sobre a tabela de chunks.

Sem esse índice cada busca é flat scan sobre ~625k vetores de 1024 dims — foi a
causa medida dos 204s/query. IVF_FLAT (e não IVF_PQ) porque os 2.4GB cabem em
disco/RAM sem problema e PQ trocaria recall por espaço que não falta.

Uso:
    .venv/bin/python scripts/build_ann_index.py [--partitions N] [--cpu]

Idempotente: `replace=True` reconstrói o índice se já existir.
"""
from __future__ import annotations

import argparse
import math
import os
import sqlite3
import sys
import time
from pathlib import Path

import lancedb


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--uri", default=os.environ.get("RAG_LANCEDB_URI", "data/lancedb_corpus"))
    ap.add_argument("--table", default="chunks")
    ap.add_argument("--partitions", type=int, default=0, help="0 = auto (~sqrt(n))")
    ap.add_argument("--cpu", action="store_true", help="força k-means na CPU")
    args = ap.parse_args()

    db = lancedb.connect(args.uri)
    tbl = db.open_table(args.table)
    n = tbl.count_rows()

    # ~sqrt(n) é a heurística padrão para IVF; potência de 2 mais próxima acima.
    partitions = args.partitions or 1 << max(1, round(math.log2(math.sqrt(n))))

    existing = tbl.list_indices()
    print(f"tabela   : {args.uri}/{args.table}")
    print(f"linhas   : {n:,}")
    print(f"índices  : {existing or 'NENHUM (flat scan hoje)'}")
    print(f"partições: {partitions}")

    accelerator = None if args.cpu else "cuda"
    t0 = time.time()
    try:
        tbl.create_index(
            metric="cosine",
            index_type="IVF_FLAT",
            num_partitions=partitions,
            accelerator=accelerator,
            replace=True,
        )
    except Exception as exc:  # OOM na GPU / acelerador indisponível → CPU
        if accelerator is None:
            raise
        print(f"\n!! k-means na GPU falhou ({type(exc).__name__}: {exc})")
        print("!! refazendo na CPU (mais lento, mesmo resultado)\n", flush=True)
        tbl.create_index(
            metric="cosine",
            index_type="IVF_FLAT",
            num_partitions=partitions,
            accelerator=None,
            replace=True,
        )
    dt = time.time() - t0

    print(f"\nOK em {dt:.1f}s")
    print(f"índices agora: {tbl.list_indices()}")

    # ANALYZE no SQLite — sem sqlite_stat1 o planner dirige o JOIN de _load_chunks por
    # `documents WHERE status='active'` (que casa com TODAS as linhas) e sonda os chunks
    # uma a uma: medido 9.6s por query. Com estatísticas ele vai por INTEGER PRIMARY KEY:
    # 0.001s. Roda aqui porque toda reingestão que justifica reindexar também invalida
    # as estatísticas.
    db_path = Path(os.environ.get("RAG_DB_PATH", "data/rag_corpus.db"))
    if db_path.exists():
        t0 = time.time()
        conn = sqlite3.connect(str(db_path))
        conn.execute("ANALYZE")
        conn.commit()
        conn.close()
        print(f"ANALYZE ({db_path}) em {time.time() - t0:.1f}s")
    else:
        print(f"!! {db_path} não encontrado — rode ANALYZE manualmente")
    return 0


if __name__ == "__main__":
    sys.exit(main())
