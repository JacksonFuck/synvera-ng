#!/usr/bin/env python3
"""Ingestão de corpora médicos no SQLite do SYNVERA.

Uso:
    python scripts/ingest_corpora.py --corpus textbooks --db /data/rag_corpus.db
    python scripts/ingest_corpora.py --corpus all --db /data/rag_corpus.db --parallel 4
    python scripts/ingest_corpora.py --corpus pubmed --db /data/rag_corpus.db --skip-download
"""

from __future__ import annotations

import argparse
import logging
import sys
import time
from pathlib import Path

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("ingest_corpora")

# Adicionar raggw ao path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from raggw.corpora import get_corpus_loader
from raggw.corpora.registry import CORPUS_META


def main():
    parser = argparse.ArgumentParser(
        description="Ingestão de corpora médicos no SQLite do SYNVERA"
    )
    parser.add_argument(
        "--corpus",
        type=str,
        default="textbooks",
        help="Corpus para ingerir: pubmed, statpearls, textbooks, wikipedia, medcorp, all",
    )
    parser.add_argument(
        "--db",
        type=str,
        default="/data/rag_corpus.db",
        help="Caminho para o banco SQLite (default: /data/rag_corpus.db)",
    )
    parser.add_argument(
        "--data-dir",
        type=str,
        default="/data/corpora",
        help="Diretório com dados brutos (default: /data/corpora)",
    )
    parser.add_argument(
        "--chunk-dir",
        type=str,
        default="/data/corpora",
        help="Diretório de saída para chunks JSONL (default: /data/corpora)",
    )
    parser.add_argument(
        "--skip-download",
        action="store_true",
        help="Pular download (usar dados já existentes)",
    )
    parser.add_argument(
        "--skip-chunk",
        action="store_true",
        help="Pular chunkificação (usar JSONL já existentes)",
    )
    parser.add_argument(
        "--parallel",
        type=int,
        default=1,
        help="Número de workers para ingestão paralela (default: 1)",
    )
    args = parser.parse_args()

    data_dir = Path(args.data_dir)
    chunk_dir = Path(args.chunk_dir)
    db_path = Path(args.db)

    # Verificar se o banco existe
    if not db_path.exists():
        logger.warning(
            "Banco %s não encontrado. Criando banco vazio...", db_path
        )
        import sqlite3
        conn = sqlite3.connect(str(db_path))
        conn.execute("CREATE TABLE IF NOT EXISTS documents (id INTEGER PRIMARY KEY)")
        conn.commit()
        conn.close()

    # Determinar corpora
    if args.corpus in ("all", "medcorp"):
        corpora = ["textbooks", "statpearls", "pubmed", "wikipedia"]
    else:
        corpora = [args.corpus]

    logger.info("Simvera 2.0 — Ingestão de corpora")
    logger.info("  Corpora: %s", ", ".join(corpora))
    logger.info("  Banco: %s", db_path)
    logger.info("  Dados: %s", data_dir)

    total_start = time.time()

    for corpus_name in corpora:
        try:
            logger.info("=" * 70)
            logger.info("📦 Processando corpus: %s", corpus_name)
            logger.info("=" * 70)

            loader = get_corpus_loader(corpus_name)

            # 1. Download (se necessário)
            raw_dir = data_dir
            if not args.skip_download:
                logger.info("⬇️  Download de %s...", corpus_name)
                raw_dir = loader.download(data_dir)
            else:
                logger.info("⏩ Pulando download de %s", corpus_name)

            # 2. Chunkificação
            if not args.skip_chunk:
                logger.info("✂️  Chunkificando %s...", corpus_name)
                jsonl_files = loader.extract_chunks(raw_dir, chunk_dir)
                logger.info("   %d arquivos JSONL gerados", len(jsonl_files))
            else:
                logger.info("⏩ Pulando chunkificação de %s", corpus_name)

            # 3. Stats
            stats = loader.get_stats(chunk_dir)
            logger.info("📊 Stats: %d chunks, avg %d chars, %d MB",
                        stats.num_chunks, stats.avg_chunk_length,
                        stats.total_size_bytes // (1024 * 1024))

            logger.info("✅ %s concluído!", corpus_name)

        except Exception as exc:
            logger.error("❌ Falha ao processar %s: %s", corpus_name, exc)
            continue

    elapsed = time.time() - total_start
    logger.info("🏁 Ingestão concluída em %.1f minutos", elapsed / 60)


if __name__ == "__main__":
    main()
