"""Opt-in smoke for the REAL retrieval stack. Skipped unless RAG_REAL_MODELS=1
(running it downloads bge-m3 ~2.5GB + bge-reranker ~2.2GB of public weights).

    RAG_REAL_MODELS=1 .venv/bin/python -m pytest tests/test_real_models.py
"""
from __future__ import annotations

import os

import pytest

_ENABLED = os.environ.get("RAG_REAL_MODELS", "").lower() in ("1", "true", "yes")
pytestmark = pytest.mark.skipif(
    not _ENABLED, reason="set RAG_REAL_MODELS=1 to run (downloads bge-m3 + reranker)")


def test_real_bge_m3_embeds_1024d():
    from raggw.embedding import BgeM3Embedder
    vecs = BgeM3Embedder(dim=1024).embed(["sepse grave em adultos"])
    assert len(vecs) == 1 and len(vecs[0]) == 1024


def test_real_onnx_reranker_orders_by_relevance():
    from raggw.reranking import OnnxReranker
    scores = OnnxReranker().rerank(
        "tratamento de sepse", ["antibioticoterapia precoce na sepse", "fratura de tornozelo"])
    assert scores[0] > scores[1]
