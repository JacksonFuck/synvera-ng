#!/usr/bin/env python3
"""Download de corpora médicos para o Simvera 2.0.

Uso:
    python scripts/download_corpora.py --corpus pubmed --output /data/corpora
    python scripts/download_corpora.py --corpus all --output /data/corpora
    python scripts/download_corpora.py --list
"""

from __future__ import annotations

import argparse
import logging
import sys
from pathlib import Path

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("download_corpora")

# Adicionar raggw ao path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from raggw.corpora import get_corpus_loader
from raggw.corpora.registry import CORPUS_META


def main():
    parser = argparse.ArgumentParser(
        description="Download de corpora médicos para Simvera 2.0"
    )
    parser.add_argument(
        "--corpus",
        type=str,
        default="textbooks",
        help="Corpus para baixar: pubmed, statpearls, textbooks, wikipedia, medcorp, all",
    )
    parser.add_argument(
        "--output",
        type=str,
        default="/data/corpora",
        help="Diretório de saída (default: /data/corpora)",
    )
    parser.add_argument(
        "--list",
        action="store_true",
        help="Listar corpora disponíveis e sair",
    )
    args = parser.parse_args()

    if args.list:
        print("\nCorpora disponíveis para download:\n")
        print(f"{'Key':<15} {'Nome':<15} {'Tamanho':<18} {'Domínio':<12} Download")
        print("-" * 90)
        for key, meta in CORPUS_META.items():
            dl = meta.get("download_size", "N/A")
            print(
                f"{key:<15} {meta['name']:<15} {meta['size']:<18} "
                f"{meta['domain']:<12} {dl}"
            )
        return

    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)

    # Determinar quais corpora baixar
    if args.corpus in ("all", "medcorp"):
        corpora = ["pubmed", "statpearls", "textbooks", "wikipedia"]
    else:
        corpora = [args.corpus]

    logger.info("Iniciando download de %d corpora para %s", len(corpora), output_dir)

    for corpus_name in corpora:
        try:
            logger.info("=" * 60)
            logger.info("Corpus: %s", corpus_name)
            logger.info("=" * 60)

            loader = get_corpus_loader(corpus_name)
            raw_dir = loader.download(output_dir)
            logger.info("✅ %s baixado em %s", corpus_name, raw_dir)

        except Exception as exc:
            logger.error("❌ Falha ao baixar %s: %s", corpus_name, exc)
            continue

    logger.info("Download concluído!")


if __name__ == "__main__":
    main()
