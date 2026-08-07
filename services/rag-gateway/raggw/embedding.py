"""Embedder port + FakeEmbedder. Real BgeM3Embedder is wired behind the same
interface (FlagEmbedding). Vectors stored as float32 BLOBs in document_chunks."""
from __future__ import annotations

import hashlib
import os
import struct
import threading
from typing import Protocol, runtime_checkable


@runtime_checkable
class Embedder(Protocol):
    dim: int

    def embed(self, texts: list[str]) -> list[list[float]]: ...


class FakeEmbedder:
    """Deterministic, dependency-free embeddings for tests. NOT semantic — only
    stable and well-formed, so the pipeline can be exercised without downloading bge-m3."""

    def __init__(self, dim: int = 1024) -> None:
        self.dim = dim

    def embed(self, texts: list[str]) -> list[list[float]]:
        return [self._one(t) for t in texts]

    def _one(self, text: str) -> list[float]:
        out: list[float] = []
        block = 0
        while len(out) < self.dim:
            digest = hashlib.sha256(f"{block}:{text}".encode()).digest()
            for j in range(0, len(digest), 4):
                if len(out) >= self.dim:
                    break
                out.append(struct.unpack("<I", digest[j:j + 4])[0] / 2 ** 32)
            block += 1
        norm = sum(x * x for x in out) ** 0.5 or 1.0
        return [x / norm for x in out]


class BgeM3Embedder:
    """Real bge-m3 dense embeddings (FlagEmbedding). Lazy-loads the model on first
    use — downloads ~2.5GB of public weights (not PHI). Enable via RAG_REAL_MODELS=1."""

    def __init__(self, model_name: str = "BAAI/bge-m3", dim: int = 1024,
                 use_fp16: bool = False, device: str = "cpu",
                 batch_size: int = 12) -> None:
        self.dim = dim
        self._model_name = model_name
        self._use_fp16 = use_fp16
        self._device = device.strip().lower() or "cpu"
        self._batch_size = batch_size
        self._model = None
        self._lock = threading.Lock()

    def _load(self):
        if self._model is None:
            with self._lock:
                if self._model is None:
                    from FlagEmbedding import BGEM3FlagModel
                    kwargs = {"use_fp16": self._use_fp16}
                    if self._device != "cpu":
                        kwargs["devices"] = [self._device]
                    try:
                        self._model = BGEM3FlagModel(self._model_name, **kwargs)
                    except TypeError:
                        # Older FlagEmbedding releases did not expose `devices`.
                        kwargs.pop("devices", None)
                        self._model = BGEM3FlagModel(self._model_name, **kwargs)
        return self._model

    def embed(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        # _load() FORA da trava: threading.Lock não é reentrante e _load() já a usa.
        modelo = self._load()
        # Mesma corrida do reranker (#33): o tokenizer fast é Rust `tokenizers` com
        # RwLock interno, e encode() muta estado compartilhado. Duas threads do FastAPI
        # no mesmo singleton levantam "Already borrowed" → 500 → recusa espúria.
        with self._lock:
            dense = modelo.encode(
                texts, batch_size=self._batch_size, max_length=8192)["dense_vecs"]
        return [[float(x) for x in v] for v in dense]

    def info(self) -> dict:
        return {
            "model": self._model_name,
            "device": self._device,
            "use_fp16": self._use_fp16,
            "batch_size": self._batch_size,
        }


def make_embedder(settings) -> Embedder:
    """Real bge-m3 when RAG_REAL_MODELS is set, else FakeEmbedder (no download)."""
    if os.environ.get("RAG_REAL_MODELS", "").lower() in ("1", "true", "yes"):
        return BgeM3Embedder(
            dim=settings.embed_dim,
            device=settings.embed_device,
            use_fp16=settings.embed_use_fp16,
            batch_size=settings.embed_batch_size,
        )
    return FakeEmbedder(settings.embed_dim)


def encode_vector(vec: list[float]) -> bytes:
    return struct.pack(f"<{len(vec)}f", *vec)


def decode_vector(blob: bytes) -> list[float]:
    return list(struct.unpack(f"<{len(blob) // 4}f", blob))
