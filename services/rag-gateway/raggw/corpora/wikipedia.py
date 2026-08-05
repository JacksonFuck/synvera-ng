"""Wikipedia corpus loader — 29.9M general-knowledge snippets.

Fonte: HuggingFace (MedRAG/wikipedia) — dataset pré-chunkido
"""

from __future__ import annotations

import json
import logging
from pathlib import Path

from .base import BaseCorpusLoader, CorpusStats

logger = logging.getLogger(__name__)

HF_REPO = "MedRAG/wikipedia"


class WikipediaLoader(BaseCorpusLoader):
    """Carregador de artigos da Wikipedia via HuggingFace MedRAG.

    Dataset: MedRAG/wikipedia
    Chunks: ~29.9M
    Tamanho médio do chunk: ~162 caracteres
    """

    def __init__(self):
        super().__init__(name="wikipedia", domain="general")

    def download(self, target_dir: Path) -> Path:
        raw_dir = target_dir / "wikipedia"
        raw_dir.mkdir(parents=True, exist_ok=True)

        from datasets import load_dataset

        logger.info("Baixando %s do HuggingFace...", HF_REPO)
        dataset = load_dataset(HF_REPO, split="train", cache_dir=str(raw_dir / "hf_cache"))
        logger.info("Wikipedia: %d snippets baixados", len(dataset))
        return raw_dir

    def extract_chunks(self, raw_dir: Path, output_dir: Path) -> list[Path]:
        chunk_dir = output_dir / "wikipedia" / "chunk"
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
                    "source": "wikipedia",
                },
                ensure_ascii=False,
            )
            batch_lines.append(chunk_json)

            if (i + 1) % batch_size == 0:
                batch_file = chunk_dir / f"wiki_{i // batch_size:04d}.jsonl"
                with open(batch_file, "w") as f:
                    f.write("\n".join(batch_lines) + "\n")
                generated.append(batch_file)
                logger.info("Wikipedia batch %d: %d chunks", i // batch_size, len(batch_lines))
                batch_lines = []

        if batch_lines:
            batch_file = chunk_dir / f"wiki_{len(generated):04d}.jsonl"
            with open(batch_file, "w") as f:
                f.write("\n".join(batch_lines) + "\n")
            generated.append(batch_file)

        logger.info("Wikipedia: %d JSONLs gerados", len(generated))
        return generated

    def get_stats(self, output_dir: Path) -> CorpusStats:
        chunk_dir = output_dir / "wikipedia" / "chunk"
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
