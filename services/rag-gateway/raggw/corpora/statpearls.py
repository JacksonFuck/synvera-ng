"""StatPearls corpus loader — 301k clinical decision-support snippets.

Fonte primária: NCBI Bookshelf FTP (https://ftp.ncbi.nlm.nih.gov/pub/litarch/3d/12/)
Formato: NXML (NCBI XML)
Extração: title + sections/sub-sections/paragraphs com chunking inteligente (~1000 chars)

Nota: O dataset HuggingFace (MedRAG/statpearls) existe mas está vazio porque o StatPearls
tem atualizações frequentes e restrições de privacidade. Usamos FTP direto como fallback.
"""

from __future__ import annotations

import json
import logging
import os
import subprocess
import xml.etree.ElementTree as ET
from pathlib import Path

from .base import BaseCorpusLoader, CorpusChunk, CorpusStats

logger = logging.getLogger(__name__)

STATPEARLS_FTP = "https://ftp.ncbi.nlm.nih.gov/pub/litarch/3d/12/"
HF_REPO = "MedRAG/statpearls"


class StatPearlsLoader(BaseCorpusLoader):
    """Carregador de artigos clínicos do StatPearls.

    Estratégia:
    1. Tenta HuggingFace (MedRAG/statpearls) — pode estar vazio
    2. Fallback: NCBI FTP + NXML parser

    Download: ~500 MB (9.3k arquivos .nxml)
    Chunks: ~301k (chunk_size ~1000 chars)
    Tamanho médio do chunk: ~119 caracteres
    """

    def __init__(self):
        super().__init__(name="statpearls", domain="clinics")

    def download(self, target_dir: Path) -> Path:
        """Baixa StatPearls — tenta HuggingFace primeiro, fallback para FTP."""
        raw_dir = target_dir / "statpearls"

        # Tenta HuggingFace
        try:
            from datasets import load_dataset

            logger.info("Tentando %s do HuggingFace...", HF_REPO)
            dataset = load_dataset(HF_REPO, split="train", cache_dir=str(raw_dir / "hf_cache"))
            if len(dataset) > 0:
                logger.info("StatPearls HF: %d snippets baixados", len(dataset))
                return raw_dir
            logger.info("Dataset StatPearls HF está vazio, usando FTP...")
        except Exception as exc:
            logger.info("HF indisponível (%s), usando FTP...", exc)

        # Fallback: FTP
        return self._download_ftp(raw_dir)

    def _download_ftp(self, raw_dir: Path) -> Path:
        """Baixa artigos StatPearls do NCBI Bookshelf FTP."""
        raw_dir.mkdir(parents=True, exist_ok=True)

        logger.info("Baixando StatPearls de %s para %s", STATPEARLS_FTP, raw_dir)

        ret = subprocess.run(
            [
                "wget", "--mirror", "--no-parent", "--no-directories",
                "--accept", "*.nxml",
                "--directory-prefix", str(raw_dir),
                "--tries=3", "--timeout=60",
                "--progress=dot:giga",
                STATPEARLS_FTP,
            ],
            capture_output=False,
        ).returncode
        if ret != 0:
            logger.warning("wget retornou código %d", ret)

        nxml_files = list(raw_dir.glob("*.nxml"))
        logger.info("StatPearls FTP: %d arquivos .nxml baixados", len(nxml_files))
        return raw_dir

    def extract_chunks(self, raw_dir: Path, output_dir: Path) -> list[Path]:
        """Extrai e chunkifica artigos StatPearls em JSONL.

        Se existirem arquivos .nxml, usa o parser NXML.
        Caso contrário, converte do dataset HF.
        """
        chunk_dir = output_dir / "statpearls" / "chunk"
        chunk_dir.mkdir(parents=True, exist_ok=True)

        nxml_files = list(raw_dir.glob("*.nxml"))

        if nxml_files:
            return self._extract_from_nxml(nxml_files, chunk_dir)
        return self._extract_from_hf(raw_dir, chunk_dir)

    def _extract_from_nxml(
        self, nxml_files: list[Path], chunk_dir: Path
    ) -> list[Path]:
        """Parser NXML (NCBI XML)."""
        logger.info("Processando %d arquivos StatPearls NXML...", len(nxml_files))

        generated = []
        for nxml_path in sorted(nxml_files):
            out_name = nxml_path.name.replace(".nxml", ".jsonl")
            out_path = chunk_dir / out_name

            if out_path.exists():
                generated.append(out_path)
                continue

            try:
                chunks = self._parse_nxml(nxml_path)
                if chunks:
                    with open(out_path, "w") as f:
                        for chunk in chunks:
                            f.write(chunk.to_jsonl() + "\n")
                    generated.append(out_path)
            except Exception as exc:
                logger.error("Erro ao processar %s: %s", nxml_path.name, exc)

        logger.info("StatPearls NXML: %d JSONLs gerados", len(generated))
        return generated

    def _extract_from_hf(self, raw_dir: Path, chunk_dir: Path) -> list[Path]:
        """Conversão do dataset HF para JSONL."""
        from datasets import load_dataset

        logger.info("Convertendo %s do HF para JSONL...", HF_REPO)
        dataset = load_dataset(HF_REPO, split="train", cache_dir=str(raw_dir / "hf_cache"))

        if len(dataset) == 0:
            logger.warning("Dataset StatPearls HF vazio — pulando")
            return []

        out_path = chunk_dir / "statpearls_hf.jsonl"
        with open(out_path, "w") as f:
            for item in dataset:
                chunk_json = json.dumps(
                    {
                        "id": item["id"],
                        "title": item.get("title", ""),
                        "content": item.get("content", ""),
                        "contents": item.get("contents", ""),
                        "source": "statpearls",
                    },
                    ensure_ascii=False,
                )
                f.write(chunk_json + "\n")

        logger.info("StatPearls HF: 1 JSONL gerado")
        return [out_path]

    def get_stats(self, output_dir: Path) -> CorpusStats:
        chunk_dir = output_dir / "statpearls" / "chunk"
        if not chunk_dir.exists():
            return CorpusStats(
                name=self.name,
                num_documents=0,
                num_chunks=0,
                avg_chunk_length=0,
                total_size_bytes=0,
                domain=self.domain,
            )
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

    # ------------------------------------------------------------------
    # Parsing NXML (NCBI XML)
    # ------------------------------------------------------------------

    def _parse_nxml(self, fpath: Path) -> list[CorpusChunk]:
        """Parseia um arquivo StatPearls NXML em chunks."""
        fname = fpath.stem
        tree = ET.parse(fpath)
        root = tree.getroot()

        title_elem = root.find(".//title")
        article_title = (
            title_elem.text.strip()
            if title_elem is not None and title_elem.text
            else fname
        )

        sections = root.findall(".//sec")
        if not sections:
            return []

        chunks: list[CorpusChunk] = []
        chunk_idx = 0

        for sec in sections:
            sec_title_elem = sec.find("./title")
            sec_title = (
                sec_title_elem.text.strip()
                if sec_title_elem is not None and sec_title_elem.text
                else ""
            )
            sub_title = ""
            prefix = " -- ".join(filter(None, [article_title, sec_title]))

            last_text: str | None = None
            last_json: dict | None = None
            last_node = None

            for child in sec:
                if self._is_subtitle(child):
                    last_text = None
                    last_json = None
                    sub_title = self._extract_text(child)
                    prefix = " -- ".join(
                        filter(None, [article_title, sec_title, sub_title])
                    )
                elif child.tag == "p":
                    curr_text = self._extract_text(child)
                    if (
                        last_text is not None
                        and last_json is not None
                        and len(curr_text) < 200
                        and len(last_text + curr_text) < 1000
                    ):
                        last_text = last_json["content"] + " " + curr_text
                        last_json["content"] = last_text
                        last_json["contents"] = self._concat_title_content(
                            last_json["title"], last_text
                        )
                        chunks[-1] = CorpusChunk(
                            chunk_id=last_json["id"],
                            title=last_json["title"],
                            content=last_json["content"],
                            contents=last_json["contents"],
                            source="statpearls",
                            metadata={"article": article_title, "section": sec_title},
                        )
                    else:
                        last_text = curr_text
                        chunk_id = f"{fname}_{chunk_idx}"
                        last_json = {
                            "id": chunk_id,
                            "title": prefix,
                            "content": curr_text,
                            "contents": self._concat_title_content(prefix, curr_text),
                        }
                        chunks.append(
                            CorpusChunk(
                                chunk_id=chunk_id,
                                title=prefix,
                                content=curr_text,
                                contents=self._concat_title_content(prefix, curr_text),
                                source="statpearls",
                                metadata={"article": article_title, "section": sec_title},
                            )
                        )
                        chunk_idx += 1

                elif child.tag == "list":
                    list_items = [self._extract_text(li) for li in child]
                    list_text = " ".join(list_items)

                    if last_text is not None and len(list_text + (last_text or "")) < 1000:
                        if last_json:
                            last_text = last_json["content"] + " " + list_text
                            last_json["content"] = last_text
                            last_json["contents"] = self._concat_title_content(
                                last_json["title"], last_text
                            )
                            chunks[-1] = CorpusChunk(
                                chunk_id=last_json["id"],
                                title=last_json["title"],
                                content=last_json["content"],
                                contents=last_json["contents"],
                                source="statpearls",
                                metadata={"article": article_title, "section": sec_title},
                            )
                    elif len(list_text) < 1000:
                        last_text = list_text
                        chunk_id = f"{fname}_{chunk_idx}"
                        chunks.append(
                            CorpusChunk(
                                chunk_id=chunk_id,
                                title=prefix,
                                content=list_text,
                                contents=self._concat_title_content(prefix, list_text),
                                source="statpearls",
                                metadata={"article": article_title, "section": sec_title},
                            )
                        )
                        chunk_idx += 1
                    else:
                        last_text = None
                        last_json = None
                        for item_text in list_items:
                            chunk_id = f"{fname}_{chunk_idx}"
                            chunks.append(
                                CorpusChunk(
                                    chunk_id=chunk_id,
                                    title=prefix,
                                    content=item_text,
                                    contents=self._concat_title_content(prefix, item_text),
                                    source="statpearls",
                                    metadata={"article": article_title, "section": sec_title},
                                )
                            )
                            chunk_idx += 1

                if last_node is not None and self._is_subtitle(last_node):
                    sub_title = ""
                    prefix = " -- ".join(filter(None, [article_title, sec_title]))

                last_node = child

        return chunks

    @staticmethod
    def _extract_text(element: ET.Element) -> str:
        text = (element.text or "").strip()
        for child in element:
            text += (" " if text else "") + StatPearlsLoader._extract_text(child)
            if child.tail and child.tail.strip():
                text += (" " if text else "") + child.tail.strip()
        return text.strip()

    @staticmethod
    def _is_subtitle(element: ET.Element) -> bool:
        if element.tag != "p":
            return False
        children = list(element)
        if len(children) != 1:
            return False
        if children[0].tag != "bold":
            return False
        if children[0].tail and children[0].tail.strip():
            return False
        return True
