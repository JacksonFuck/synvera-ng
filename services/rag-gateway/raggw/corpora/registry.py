"""Registry de corpora médicos disponíveis para ingestão.

Mapeia nome do corpus → loader + metadados. Usado pelos scripts de download/ingest
e pela API de administração.

Fontes:
  - PubMed, Textbooks, Wikipedia → HuggingFace (MedRAG/*)
  - StatPearls → NCBI FTP (dataset HF vazio por política de privacidade)
"""

from __future__ import annotations

from .base import BaseCorpusLoader

# ---------------------------------------------------------------------------
# Registry
# ---------------------------------------------------------------------------

CORPUS_META: dict[str, dict] = {
    "pubmed": {
        "name": "PubMed",
        "loader": "pubmed.PubMedLoader",
        "size": "23.9M docs",
        "domain": "biomed",
        "description": "Abstracts biomédicos do NCBI PubMed (23.9M artigos)",
        "source": "HuggingFace (MedRAG/pubmed)",
        "download_size": "~15 GB",
        "disk_after_chunk": "~15 GB",
    },
    "statpearls": {
        "name": "StatPearls",
        "loader": "statpearls.StatPearlsLoader",
        "size": "301k snippets",
        "domain": "clinics",
        "description": "Artigos de decisão clínica do NCBI StatPearls (9.3k artigos)",
        "source": "NCBI FTP (HF dataset vazio — atualizações frequentes)",
        "download_size": "~500 MB",
        "disk_after_chunk": "~100 MB",
    },
    "textbooks": {
        "name": "Textbooks",
        "loader": "textbooks.TextbooksLoader",
        "size": "126k snippets",
        "domain": "medicine",
        "description": "Livros-texto médicos do repositório MedQA (18 livros)",
        "source": "HuggingFace (MedRAG/textbooks)",
        "download_size": "~200 MB",
        "disk_after_chunk": "~200 MB",
    },
    "wikipedia": {
        "name": "Wikipedia",
        "loader": "wikipedia.WikipediaLoader",
        "size": "29.9M snippets",
        "domain": "general",
        "description": "Artigos da Wikipedia em inglês (6.5M artigos)",
        "source": "HuggingFace (MedRAG/wikipedia)",
        "download_size": "~20 GB",
        "disk_after_chunk": "~20 GB",
    },
}

# Alias "medcorp" = todos os 4 corpora
CORPUS_META["medcorp"] = {
    "name": "MedCorp",
    "loader": None,
    "size": "54.2M snippets",
    "domain": "mixed",
    "description": "Combinação de PubMed + StatPearls + Textbooks + Wikipedia",
    "source": "Composto (todos acima)",
    "sub_corpora": ["pubmed", "statpearls", "textbooks", "wikipedia"],
}


def get_corpus_loader(name: str) -> BaseCorpusLoader:
    """Retorna uma instância do loader para o corpus especificado.

    Args:
        name: Nome do corpus ("pubmed", "statpearls", "textbooks", "wikipedia").

    Returns:
        Instância de BaseCorpusLoader.

    Raises:
        ValueError: Se o corpus não for encontrado.
    """
    if name not in CORPUS_META:
        raise ValueError(
            f"Corpus '{name}' não encontrado. "
            f"Disponíveis: {', '.join(sorted(CORPUS_META.keys()))}"
        )

    if name == "medcorp":
        raise ValueError(
            "medcorp é um alias composto. Use get_corpus_loader() para cada sub-corpus "
            "individualmente: " + ", ".join(CORPUS_META["medcorp"]["sub_corpora"])
        )

    meta = CORPUS_META[name]
    loader_path = meta["loader"]

    module_name, class_name = loader_path.rsplit(".", 1)
    import importlib

    mod = importlib.import_module(f".{module_name}", package="raggw.corpora")
    loader_cls = getattr(mod, class_name)
    return loader_cls()


def list_corpora() -> list[dict]:
    """Lista todos os corpora disponíveis com metadados."""
    return [
        {
            "key": key,
            "name": meta["name"],
            "size": meta["size"],
            "domain": meta["domain"],
            "description": meta["description"],
            "source": meta.get("source", "N/A"),
        }
        for key, meta in CORPUS_META.items()
    ]


# Alias para compatibilidade
CORPORA = {key: meta for key, meta in CORPUS_META.items()}
