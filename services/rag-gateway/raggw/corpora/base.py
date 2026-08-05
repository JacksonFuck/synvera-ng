"""Interface base para carregadores de corpora médicos.

Cada corpus (PubMed, StatPearls, Textbooks, Wikipedia) implementa esta interface
com três métodos: download, extract_chunks, e get_stats.

O pipeline típico é:
    1. download()  -> raw_dir com arquivos brutos
    2. extract_chunks() -> output_dir com arquivos JSONL
    3. Ingestão via scripts/ingest_corpora.py -> SQLite do SYNVERA
"""

from __future__ import annotations

import json
import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from pathlib import Path

logger = logging.getLogger(__name__)


@dataclass
class CorpusChunk:
    """Um chunk individual de corpus médico."""

    chunk_id: str
    title: str
    content: str
    contents: str  # title + content concatenado
    source: str  # "pubmed" | "statpearls" | "textbooks" | "wikipedia"
    metadata: dict = field(default_factory=dict)

    def to_jsonl(self) -> str:
        return json.dumps(
            {
                "id": self.chunk_id,
                "title": self.title,
                "content": self.content,
                "contents": self.contents,
                "source": self.source,
                **self.metadata,
            },
            ensure_ascii=False,
        )


@dataclass
class CorpusStats:
    """Estatísticas de um corpus."""

    name: str
    num_documents: int
    num_chunks: int
    avg_chunk_length: int
    total_size_bytes: int
    domain: str  # "biomed" | "clinics" | "medicine" | "general" | "mixed"


class BaseCorpusLoader(ABC):
    """Interface base para carregadores de corpora."""

    def __init__(self, name: str, domain: str):
        self.name = name
        self.domain = domain

    @abstractmethod
    def download(self, target_dir: Path) -> Path:
        """Baixa o corpus bruto. Retorna path do diretório com arquivos brutos."""
        ...

    @abstractmethod
    def extract_chunks(self, raw_dir: Path, output_dir: Path) -> list[Path]:
        """Extrai e chunkifica o corpus. Retorna lista de JSONL gerados."""
        ...

    def get_stats(self, output_dir: Path) -> CorpusStats:
        """Retorna estatísticas do corpus chunkificado."""
        num_chunks, total_len, avg_len = self._count_jsonl(output_dir)
        total_size = sum(
            f.stat().st_size for f in output_dir.glob("*.jsonl") if f.is_file()
        )
        return CorpusStats(
            name=self.name,
            num_documents=num_chunks,
            num_chunks=num_chunks,
            avg_chunk_length=avg_len,
            total_size_bytes=total_size,
            domain=self.domain,
        )

    def _count_jsonl(self, jsonl_dir: Path, *, sample_size: int = 10000) -> tuple[int, int, int]:
        """Conta chunks, soma tamanhos, calcula média (otimizado para corpora grandes).

        Para corpora grandes (ex.: PubMed 23.9M linhas), usa `wc -l` para contagem
        rápida de linhas + amostragem para estimar avg_chunk_length.

        Args:
            jsonl_dir: Diretório com arquivos JSONL
            sample_size: Número de linhas para amostrar para média (default: 10000)

        Returns:
            (num_chunks, total_content_len, avg_chunk_len)
        """
        import subprocess
        import random

        jsonl_files = sorted(jsonl_dir.glob("*.jsonl"))
        if not jsonl_files:
            return 0, 0, 0

        # 1. Contagem rápida de linhas usando wc -l (muito mais rápido que Python line-by-line)
        try:
            result = subprocess.run(
                ["wc", "-l", *[str(f) for f in jsonl_files]],
                capture_output=True,
                text=True,
                check=True,
            )
            # wc -l output: "   1234 file1.jsonl\n   5678 file2.jsonl\n   6912 total"
            lines = result.stdout.strip().split("\n")
            total = int(lines[-1].split()[0]) if lines else 0
        except (subprocess.CalledProcessError, ValueError, IndexError):
            # Fallback: contagem em Python se wc falhar
            total = 0
            for fpath in jsonl_files:
                with open(fpath) as f:
                    total += sum(1 for _ in f if _.strip())

        if total == 0:
            return 0, 0, 0

        # 2. Amostragem para estimar avg_chunk_length (muito mais rápido que ler tudo)
        sample_size = min(sample_size, total)
        sampled_lines = 0
        sampled_len = 0

        if sample_size > 0:
            # Reservoir sampling: amostra aleatória uniforme de linhas
            # Para eficiência, amostramos arquivos proporcionalmente ao tamanho
            total_file_sizes = sum(f.stat().st_size for f in jsonl_files)
            for fpath in jsonl_files:
                file_size = fpath.stat().st_size
                if total_file_sizes > 0:
                    file_sample = max(1, int(sample_size * file_size / total_file_sizes))
                else:
                    file_sample = sample_size // len(jsonl_files)
                file_sample = min(file_sample, sample_size - sampled_lines)

                if file_sample <= 0:
                    continue

                # Reservoir sampling neste arquivo
                reservoir = []
                with open(fpath, "r") as f:
                    for i, line in enumerate(f):
                        if not line.strip():
                            continue
                        if i < file_sample:
                            reservoir.append(line)
                        else:
                            j = random.randint(0, i)
                            if j < file_sample:
                                reservoir[j] = line
                        if sampled_lines + i + 1 >= sample_size:
                            break

                for line in reservoir:
                    try:
                        chunk = json.loads(line)
                        sampled_len += len(chunk.get("content", ""))
                        sampled_lines += 1
                    except json.JSONDecodeError:
                        continue

        avg = sampled_len // sampled_lines if sampled_lines > 0 else 0
        # Estimar total_len extrapolando da amostra
        total_len = avg * total if total > 0 else 0

        return total, total_len, avg

    @staticmethod
    def _ends_with_punctuation(s: str) -> bool:
        return any(s.rstrip().endswith(char) for char in (".", "?", "!"))

    @staticmethod
    def _concat_title_content(title: str, content: str) -> str:
        title = title.strip()
        content = content.strip()
        if BaseCorpusLoader._ends_with_punctuation(title):
            return f"{title} {content}"
        return f"{title}. {content}"
