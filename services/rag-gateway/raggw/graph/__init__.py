"""Grafo de conhecimento como SINAL DE RETRIEVAL (não gerador).

Auxilia a encontrar o chunk citável (expansão por entidade/sinônimo + multi-hop);
nunca vira a fonte citada. Preserva claim→source (#193): o evidence-pack e o guard
não mudam. Determinístico, sem LLM — entidades vêm de um léxico curado. Opt-in atrás
de RAG_GRAPH_ENABLED (default off), como o VectorStore foi introduzido como port.
"""
from .lexicon import Entity, Lexicon, load_lexicon
from .store import GraphStore, make_graph_store

__all__ = ["Entity", "Lexicon", "load_lexicon", "GraphStore", "make_graph_store"]
