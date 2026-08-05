"""Reranker port + FakeReranker (deterministic; real bge-reranker-v2-m3 ONNX wired later)."""
from __future__ import annotations

from raggw.reranking import BgeReranker, FakeReranker, OnnxReranker, Reranker, make_reranker


def test_scores_reflect_query_overlap():
    scores = FakeReranker().rerank(
        "sepse grave", ["tratamento de sepse grave em adultos", "fratura de tornozelo"])
    assert scores[0] > scores[1]
    assert scores[0] == 1.0  # both query tokens present


def test_no_overlap_scores_zero():
    assert FakeReranker().rerank("xyz abc", ["conteudo sem relacao"]) == [0.0]


def test_empty_query_scores_zero():
    assert FakeReranker().rerank("", ["qualquer texto"]) == [0.0]


def test_fake_satisfies_protocol():
    assert isinstance(FakeReranker(), Reranker)


def test_make_reranker_switches_on_env(monkeypatch):
    monkeypatch.delenv("RAG_REAL_MODELS", raising=False)
    monkeypatch.delenv("RAG_RERANKER", raising=False)
    assert isinstance(make_reranker(), FakeReranker)
    monkeypatch.setenv("RAG_REAL_MODELS", "1")
    # Default real reranker = FlagReranker (OnnxReranker export hangs on recent torch).
    assert isinstance(make_reranker(), BgeReranker)  # lazy: no download at construction
    monkeypatch.setenv("RAG_RERANKER", "onnx")  # explicit opt-in still available
    assert isinstance(make_reranker(), OnnxReranker)


def test_bge_reranker_defaults_to_auto_device():
    # FlagReranker(devices=None) auto-selects CUDA when available — matches today's
    # production behavior. Constructing must not touch the network/GPU (lazy _load()).
    assert BgeReranker()._devices is None


def test_make_reranker_forces_cpu_via_env(monkeypatch):
    # RAG_RERANK_DEVICE=cpu frees the ~8.5GB the reranker otherwise claims on GPU — real
    # tradeoff is latency (measured ~2min for ~140 candidates on CPU), so this is opt-in,
    # never the default. Lazy: no model load/download at construction.
    monkeypatch.setenv("RAG_REAL_MODELS", "1")
    monkeypatch.setenv("RAG_RERANK_DEVICE", "cpu")
    reranker = make_reranker()
    assert isinstance(reranker, BgeReranker)
    assert reranker._devices == "cpu"
