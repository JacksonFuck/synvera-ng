"""PubMed corpus loader — 23.9M biomedical abstracts.

Fonte: HuggingFace (MedRAG/pubmed) — dataset pré-chunkido
Formato: cada entrada = 1 snippet (id, title, content, contents)
"""

from __future__ import annotations

import json
import logging
from pathlib import Path

from .base import BaseCorpusLoader, CorpusStats

logger = logging.getLogger(__name__)

HF_REPO = "MedRAG/pubmed"


class PubMedLoader(BaseCorpusLoader):
    """Carregador de abstracts do PubMed via HuggingFace MedRAG.

    Dataset: MedRAG/pubmed
    Chunks: ~23.9M (1 chunk = 1 artigo com abstract)
    Tamanho médio do chunk: ~296 caracteres
    """

    def __init__(self):
        super().__init__(name="pubmed", domain="biomed")

    def download(self, target_dir: Path) -> Path:
        """Baixa o dataset PubMed do HuggingFace."""
        raw_dir = target_dir / "pubmed"
        raw_dir.mkdir(parents=True, exist_ok=True)

        from datasets import load_dataset

        logger.info("Baixando %s do HuggingFace...", HF_REPO)
        dataset = load_dataset(HF_REPO, split="train", cache_dir=str(raw_dir / "hf_cache"))
        logger.info("PubMed: %d snippets baixados", len(dataset))

        return raw_dir

    def extract_chunks(self, raw_dir: Path, output_dir: Path) -> list[Path]:
        """Converte dataset HuggingFace para JSONL local.

        O dataset já vem chunkificado; apenas salvamos em JSONL para ingestão no SQLite.
        """
        chunk_dir = output_dir / "pubmed" / "chunk"
        chunk_dir.mkdir(parents=True, exist_ok=True)

        from datasets import load_dataset

        logger.info("Carregando %s para chunkificação...", HF_REPO)
        dataset = load_dataset(HF_REPO, split="train", cache_dir=str(raw_dir / "hf_cache"))

        batch_size = 500_000
        generated = []
        batch_lines: list[str] = []

        for i, item in enumerate(dataset):
            chunk_json = json.dumps(
                {
                    "id": item["id"],
                    "title": item.get("title", ""),
                    "content": item.get("content", ""),
                    "contents": item.get("contents", ""),
                    "source": "pubmed",
                },
                ensure_ascii=False,
            )
            batch_lines.append(chunk_json)

            if (i + 1) % batch_size == 0:
                batch_file = chunk_dir / f"pubmed_{i // batch_size:04d}.jsonl"
                with open(batch_file, "w") as f:
                    f.write("\n".join(batch_lines) + "\n")
                generated.append(batch_file)
                logger.info("PubMed batch %d: %d chunks salvos", i // batch_size, len(batch_lines))
                batch_lines = []

        if batch_lines:
            batch_file = chunk_dir / f"pubmed_{len(generated):04d}.jsonl"
            with open(batch_file, "w") as f:
                f.write("\n".join(batch_lines) + "\n")
            generated.append(batch_file)

        logger.info("PubMed: %d JSONLs gerados", len(generated))
        return generated

    def get_stats(self, output_dir: Path) -> CorpusStats:
        chunk_dir = output_dir / "pubmed" / "chunk"
        num_chunks, total_len, avg_len = self._count_jsonl(chunk_dir)
        total_size = sum(
            f.stat().st_size for f in chunk_dir.glob("*.jsonl") if f.is_file()
        )
        return CorpusStats(
            name=self.name,
            num_documents=num_chunks,
            num_chunks=num_chunks,
            avg_chunk_length=avg_len,
            total_size_bytes=total_size,
            domain=self.domain,
        )
