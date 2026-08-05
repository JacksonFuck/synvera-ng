"""Embedder port + FakeEmbedder (deterministic, no model download) + BLOB codec."""
from __future__ import annotations

from raggw.config import get_settings
from raggw.embedding import (
    BgeM3Embedder,
    Embedder,
    FakeEmbedder,
    decode_vector,
    encode_vector,
    make_embedder,
)


def test_fake_embedder_returns_correct_dim():
    emb = FakeEmbedder(dim=16)
    vecs = emb.embed(["sepse", "pneumonia"])
    assert len(vecs) == 2
    assert all(len(v) == 16 for v in vecs)


def test_fake_embedder_is_deterministic():
    emb = FakeEmbedder(dim=8)
    assert emb.embed(["dose de noradrenalina"]) == emb.embed(["dose de noradrenalina"])


def test_different_texts_differ():
    emb = FakeEmbedder(dim=8)
    a = emb.embed(["a"])[0]
    b = emb.embed(["b"])[0]
    assert a != b


def test_vectors_are_l2_normalized():
    v = FakeEmbedder(dim=32).embed(["x"])[0]
    norm = sum(x * x for x in v) ** 0.5
    assert abs(norm - 1.0) < 1e-6


def test_blob_roundtrip():
    v = FakeEmbedder(dim=8).embed(["roundtrip"])[0]
    back = decode_vector(encode_vector(v))
    assert len(back) == len(v)
    assert all(abs(x - y) < 1e-6 for x, y in zip(v, back))


def test_fake_satisfies_protocol():
    assert isinstance(FakeEmbedder(dim=4), Embedder)


def test_make_embedder_switches_on_env(monkeypatch):
    settings = get_settings()
    monkeypatch.delenv("RAG_REAL_MODELS", raising=False)
    assert isinstance(make_embedder(settings), FakeEmbedder)
    monkeypatch.setenv("RAG_REAL_MODELS", "1")
    assert isinstance(make_embedder(settings), BgeM3Embedder)  # lazy: no download here


def test_make_embedder_uses_gpu_env_without_loading_model(monkeypatch):
    monkeypatch.setenv("RAG_REAL_MODELS", "1")
    monkeypatch.setenv("RAG_EMBED_DEVICE", "cuda")
    monkeypatch.setenv("RAG_EMBED_FP16", "1")
    monkeypatch.setenv("RAG_EMBED_BATCH_SIZE", "24")
    emb = make_embedder(get_settings())
    assert isinstance(emb, BgeM3Embedder)
    assert emb.info() == {
        "model": "BAAI/bge-m3",
        "device": "cuda",
        "use_fp16": True,
        "batch_size": 24,
    }
