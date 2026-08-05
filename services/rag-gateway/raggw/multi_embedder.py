"""Multi-model embedder for biomedical RAG — MedCPT + BgeM3.

Simvera 2.0: suporte a múltiplos modelos de embedding simultâneos.
Cada embedder produz vetores em dimensões potencialmente diferentes;
a fusão acontece no nível RRF (rank-based), não no espaço vetorial.

Embeds:
  - BgeM3 (BAAI/bge-m3): 1024-dim, general-domain, já existente
  - MedCPT (ncbi/MedCPT-Query-Encoder): 768-dim, biomedical-domain, NOVO
"""

from __future__ import annotations

import os
import threading
from dataclasses import dataclass, field

from .embedding import BgeM3Embedder, Embedder, FakeEmbedder, make_embedder


@dataclass
class EmbedderInfo:
    name: str
    dim: int
    model_path: str
    domain: str  # "general" | "biomed"
    loaded: bool = False


class ContrieverEmbedder:
    """Facebook Contriever — general-domain dense embedder.

    Modelo: facebook/contriever (110M params, 768-dim)
    Treinamento: unsupervised contrastive learning sobre Wikipedia + CCNet
    Paper: https://arxiv.org/abs/2112.09118

    Útil como terceiro sinal denso no RRF, complementando BgeM3 (general)
    e MedCPT (biomedical). Usa sentence-transformers.
    """

    def __init__(
        self,
        model_name: str = "facebook/contriever",
        dim: int = 768,
        device: str = "cpu",
        batch_size: int = 32,
    ) -> None:
        self.dim = dim
        self._model_name = model_name
        self._device = device.strip().lower() or "cpu"
        self._batch_size = batch_size
        self._model = None
        self._lock = threading.Lock()

    def _load(self):
        if self._model is None:
            with self._lock:
                if self._model is None:
                    from sentence_transformers import SentenceTransformer
                    self._model = SentenceTransformer(
                        self._model_name,
                        device=self._device,
                    )
        return self._model

    def embed(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        model = self._load()
        vectors = model.encode(
            texts,
            batch_size=self._batch_size,
            normalize_embeddings=True,
        )
        return [[float(x) for x in v] for v in vectors]

    def info(self) -> dict:
        return {
            "model": self._model_name,
            "device": self._device,
            "batch_size": self._batch_size,
            "dim": self.dim,
        }


class MedCPTEmbedder:
    """NCBI MedCPT — biomedical-domain dense embedder.

    Modelo: ncbi/MedCPT-Query-Encoder (109M params, 768-dim)
    Treinamento: 255M pares query-artigo de clicks no PubMed
    Paper: https://arxiv.org/abs/2307.00589

    Usa sentence-transformers (não FlagEmbedding como BgeM3).
    Inner Product (IP) é a métrica de similaridade recomendada,
    mas normalizamos os vetores para usar cosine similarity.
    """

    def __init__(
        self,
        model_name: str = "ncbi/MedCPT-Query-Encoder",
        dim: int = 768,
        device: str = "cpu",
        batch_size: int = 32,
    ) -> None:
        self.dim = dim
        self._model_name = model_name
        self._device = device.strip().lower() or "cpu"
        self._batch_size = batch_size
        self._model = None
        self._lock = threading.Lock()

    def _load(self):
        if self._model is None:
            with self._lock:
                if self._model is None:
                    from sentence_transformers import SentenceTransformer

                    self._model = SentenceTransformer(
                        self._model_name,
                        device=self._device,
                    )
        return self._model

    def embed(self, texts: list[str]) -> list[list[float]]:
        """Embed texts → normalized vectors (cosine-ready)."""
        if not texts:
            return []
        model = self._load()
        # normalize_embeddings=True → unit vectors, compatível com cosine similarity
        vectors = model.encode(
            texts,
            batch_size=self._batch_size,
            normalize_embeddings=True,
        )
        return [[float(x) for x in v] for v in vectors]

    def info(self) -> dict:
        return {
            "model": self._model_name,
            "device": self._device,
            "batch_size": self._batch_size,
            "dim": self.dim,
        }


class MultiEmbedder:
    """Gerencia múltiplos embedders simultaneamente.

    Uso:
        me = MultiEmbedder(settings)
        # Embed com BgeM3 (default)
        vecs_bge = me.embed(["diabetes treatment"], model="bge-m3")
        # Embed com MedCPT
        vecs_cpt = me.embed(["diabetes treatment"], model="medcpt")
        # Embed com todos de uma vez
        all_vecs = me.embed_all(["diabetes treatment"])
    """

    def __init__(self, settings, models: list[str] | None = None):
        self._embedders: dict[str, Embedder] = {}
        self._infos: dict[str, EmbedderInfo] = {}
        self._settings = settings

        # Determina quais modelos carregar
        if models is None:
            models = self._default_models()

        for model_key in models:
            self._init_embedder(model_key)

    def _default_models(self) -> list[str]:
        """Modelos padrão via env RAG_RETRIEVERS.

        Env RAG_RETRIEVERS: comma-separated list, ex: "bge-m3,medcpt,contriever"
        Default: "bge-m3" (compatibilidade com SYNVERA 1.x)

        RRF-2 (leve): "bge-m3,medcpt"
        RRF-3 (balanceado): "bge-m3,medcpt,contriever"
        RRF-4 (máximo): "bge-m3,medcpt,contriever" (SPECTER não implementado)
        """
        env_retrievers = os.environ.get("RAG_RETRIEVERS", "").strip()
        if env_retrievers:
            return [m.strip() for m in env_retrievers.split(",") if m.strip()]

        # Default: BgeM3 sempre + MedCPT se disponível
        models = ["bge-m3"]
        if os.environ.get("RAG_REAL_MODELS", "").lower() in ("1", "true", "yes"):
            try:
                import sentence_transformers  # noqa: F401
                models.append("medcpt")
            except ImportError:
                pass
        return models

    def _init_embedder(self, key: str):
        if key == "bge-m3":
            emb = make_embedder(self._settings)
            info = EmbedderInfo(
                name="bge-m3",
                dim=emb.dim,
                model_path="BAAI/bge-m3",
                domain="general",
                loaded=isinstance(emb, BgeM3Embedder),
            )
        elif key == "medcpt":
            device = self._settings.embed_device if hasattr(self._settings, "embed_device") else "cpu"
            emb = MedCPTEmbedder(device=device)
            info = EmbedderInfo(
                name="medcpt",
                dim=emb.dim,
                model_path="ncbi/MedCPT-Query-Encoder",
                domain="biomed",
                loaded=True,
            )
        elif key == "contriever":
            device = self._settings.embed_device if hasattr(self._settings, "embed_device") else "cpu"
            emb = ContrieverEmbedder(device=device)
            info = EmbedderInfo(
                name="contriever",
                dim=emb.dim,
                model_path="facebook/contriever",
                domain="general",
                loaded=True,
            )
        elif key == "fake":
            emb = FakeEmbedder(self._settings.embed_dim)
            info = EmbedderInfo(
                name="fake",
                dim=emb.dim,
                model_path="fake",
                domain="test",
                loaded=True,
            )
        else:
            raise ValueError(f"Embedder desconhecido: {key}")

        self._embedders[key] = emb
        self._infos[key] = info

    def embed(self, texts: list[str], model: str = "bge-m3") -> list[list[float]]:
        """Embed texts com um modelo específico."""
        if model not in self._embedders:
            raise KeyError(
                f"Modelo '{model}' não carregado. Disponíveis: {list(self._embedders)}"
            )
        return self._embedders[model].embed(texts)

    def embed_all(self, texts: list[str]) -> dict[str, list[list[float]]]:
        """Embed texts com TODOS os modelos ativos.

        Returns:
            Dict[model_name, vectors]
        """
        return {
            name: emb.embed(texts)
            for name, emb in self._embedders.items()
        }

    @property
    def models(self) -> list[str]:
        return list(self._embedders.keys())

    def info(self) -> list[dict]:
        return [
            {
                "name": info.name,
                "dim": info.dim,
                "model_path": info.model_path,
                "domain": info.domain,
                "loaded": info.loaded,
            }
            for info in self._infos.values()
        ]

    def get(self, name: str) -> Embedder:
        if name not in self._embedders:
            raise KeyError(f"Modelo '{name}' não encontrado")
        return self._embedders[name]

    def __contains__(self, name: str) -> bool:
        return name in self._embedders


def make_multi_embedder(settings, models: list[str] | None = None) -> MultiEmbedder:
    """Factory function para criar MultiEmbedder a partir das settings."""
    return MultiEmbedder(settings, models=models)
