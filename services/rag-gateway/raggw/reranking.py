"""Reranker port + FakeReranker. Real bge-reranker-v2-m3 (ONNX, CPU, 0 VRAM) wired in
behind the same interface; tests use the deterministic fake (no model download)."""
from __future__ import annotations

import os
import threading
from typing import Protocol, runtime_checkable


@runtime_checkable
class Reranker(Protocol):
    def rerank(self, query: str, texts: list[str]) -> list[float]: ...


class FakeReranker:
    """Deterministic relevance = fraction of query tokens present in each text.
    Plausible enough for tests and lets abstention trigger when nothing matches."""

    def rerank(self, query: str, texts: list[str]) -> list[float]:
        q = {w.lower() for w in query.split() if w}
        if not q:
            return [0.0] * len(texts)
        return [len(q & {w.lower() for w in t.split()}) / len(q) for t in texts]


class BgeReranker:
    """Real bge-reranker-v2-m3 (FlagEmbedding, normalized scores). Lazy-loads ~2.2GB of
    public weights on first use. Enable via RAG_REAL_MODELS=1.

    Device: FlagReranker(devices=None) AUTO-SELECTS CUDA when available — that's today's
    production behavior (~8.5GB resident on GPU), despite this class historically being
    documented as "CPU". Pass devices="cpu" (or set RAG_RERANK_DEVICE=cpu via
    make_reranker) to force CPU and free that VRAM — but it's a real tradeoff, not free:
    measured ~2min to rerank ~140 candidates on CPU vs. low-single-digit-seconds on GPU.
    Opt-in only; never the default."""

    def __init__(self, model_name: str = "BAAI/bge-reranker-v2-m3",
                 use_fp16: bool = False, devices: str | list[str] | None = None) -> None:
        self._model_name = model_name
        self._use_fp16 = use_fp16
        self._devices = devices
        self._model = None
        self._lock = threading.Lock()

    def _load(self):
        if self._model is None:
            with self._lock:
                if self._model is None:
                    from FlagEmbedding import FlagReranker
                    self._model = FlagReranker(self._model_name, use_fp16=self._use_fp16,
                                               devices=self._devices)
        return self._model

    def rerank(self, query: str, texts: list[str]) -> list[float]:
        if not texts:
            return []
        # _load() FORA da trava: threading.Lock não é reentrante e _load() já a usa.
        modelo = self._load()
        # O tokenizer fast é Rust `tokenizers` com RwLock interno, e compute_score muta
        # estado compartilhado (enable_truncation). Duas threads do FastAPI no mesmo
        # singleton levantam "Already borrowed" → 500 → recusa clínica espúria (#33).
        # Serializa o rerank entre requests concorrentes; se throughput passar a doer,
        # a saída é uma cópia do modelo por thread, não remover a trava.
        with self._lock:
            scores = modelo.compute_score([[query, t] for t in texts], normalize=True)
        if isinstance(scores, (int, float)):
            scores = [scores]
        return [float(s) for s in scores]


class OnnxReranker:
    """bge-reranker-v2-m3 via ONNX Runtime (CPU, 0 VRAM). Caminho real preferido: contorna o
    bug do FlagReranker (XLMRobertaTokenizer.prepare_for_model — skew FlagEmbedding↔transformers)
    usando tokenizer fast + ORT. Lazy-load: exporta/baixa os pesos (~2.2GB) na 1ª chamada."""

    def __init__(self, model_name: str = "BAAI/bge-reranker-v2-m3") -> None:
        self._model_name = model_name
        self._model = None
        self._tok = None
        self._lock = threading.Lock()

    def _load(self):
        if self._model is None:
            with self._lock:
                if self._model is None:
                    from optimum.onnxruntime import ORTModelForSequenceClassification
                    from transformers import AutoTokenizer
                    self._tok = AutoTokenizer.from_pretrained(self._model_name)
                    self._model = ORTModelForSequenceClassification.from_pretrained(
                        self._model_name, export=True)
        return self._model, self._tok

    def rerank(self, query: str, texts: list[str]) -> list[float]:
        if not texts:
            return []
        import math
        model, tok = self._load()  # fora da trava: _load() já a usa (#33)
        # Mesma corrida do BgeReranker: tokenizer fast compartilhado entre threads.
        with self._lock:
            enc = tok([query] * len(texts), texts, padding=True, truncation=True,
                      max_length=512, return_tensors="np")
            logits = model(**enc).logits  # (N, 1)
        return [1.0 / (1.0 + math.exp(-float(z))) for z in logits.reshape(-1)]  # sigmoid


def make_reranker() -> Reranker:
    """Reranker real quando RAG_REAL_MODELS=1; senão FakeReranker (determinístico, sem download).

    Padrão real = FlagReranker (BgeReranker): validado e2e na RTX 5090. O OnnxReranker (export
    ONNX on-the-fly via optimum) TRAVA em torch recente (2.13+cu130), então virou opt-in
    explícito por RAG_RERANKER=onnx. RAG_RERANK_FP16=1 usa half precision (GPU).
    RAG_RERANK_DEVICE=cpu força CPU (libera ~8.5GB de VRAM; troca por latência bem maior
    — opt-in, nunca default)."""
    if os.environ.get("RAG_REAL_MODELS", "").lower() not in ("1", "true", "yes"):
        return FakeReranker()
    if os.environ.get("RAG_RERANKER", "flag").lower() == "onnx":
        return OnnxReranker()
    return BgeReranker(use_fp16=os.environ.get("RAG_RERANK_FP16", "").lower()
                       in ("1", "true", "yes"),
                       devices=os.environ.get("RAG_RERANK_DEVICE") or None)
