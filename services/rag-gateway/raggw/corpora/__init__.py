"""Corpora médicos — data loaders para Simvera 2.0."""

from .base import BaseCorpusLoader, CorpusChunk, CorpusStats
from .registry import CORPORA, get_corpus_loader, list_corpora

__all__ = [
    "BaseCorpusLoader",
    "CorpusChunk",
    "CorpusStats",
    "CORPORA",
    "get_corpus_loader",
    "list_corpora",
]
