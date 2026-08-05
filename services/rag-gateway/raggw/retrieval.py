"""Hybrid retrieval: lexical (FTS5/BM25) + dense (cosine) -> RRF -> rerank -> top-k.
Filters: status='active' only (superseded hidden) + optional specialty. Abstention when
evidence is weak. Builds a citable evidence pack. All local, zero egress.

ponytail: dense search is brute-force cosine over stored BLOBs — correct and dep-free.
Swap to LanceDB ANN when the corpus outgrows in-memory scan (documented upgrade path)."""
from __future__ import annotations

import math
import re
import sqlite3
import time
from dataclasses import dataclass

from .embedding import Embedder, decode_vector
from .filters import soft_specialty_sql
from .graph.lexicon import Lexicon
from .graph.store import GraphStore
from .query_planning import plan_query
from .reranking import Reranker
from .vectorstore import VectorStore


def _tick() -> float:
    return time.perf_counter()


def _mark(timings: dict | None, name: str, t0: float) -> None:
    """Acumula segundos de parede por estágio (somável em ladder multi-pass)."""
    if timings is None:
        return
    timings[name] = round(timings.get(name, 0.0) + (_tick() - t0), 4)


@dataclass
class Hit:
    chunk_id: int
    document_id: int
    chunk_text: str
    citation_label: str
    page_start: int
    page_end: int
    section_path: str | None
    specialty: str | None
    evidence_level: str | None
    fused_score: float
    rerank_score: float
    final_score: float = 0.0


# Hierarquia de evidência (núcleo clínico). Peso pequeno: desempata, não domina o rerank.
EVIDENCE_RANK = {
    "diretriz": 1.0, "guideline": 1.0,
    "meta-analise": 0.9, "meta_analise": 0.9, "meta-analysis": 0.9,
    "rct": 0.7, "ensaio": 0.7,
    "coorte": 0.5, "cohort": 0.5,
    "serie": 0.3, "case-series": 0.3,
    "opiniao": 0.1, "opinion": 0.1,
}
EVIDENCE_WEIGHT = 0.1


def _evidence_boost(evidence_level: str | None) -> float:
    return EVIDENCE_RANK.get((evidence_level or "").lower().strip(), 0.2)


def _resolve_specs(specialty: str | None, specialties: list[str] | None) -> list[str] | None:
    if specialties:
        return list(specialties)
    return [specialty] if specialty else None


def _spec_clause(specs: list[str] | None) -> str:
    # Shared soft filter (#320) — single source of truth, so lexical/dense/graph can't drift.
    sql, _ = soft_specialty_sql(specs)
    return sql


def rrf_fuse(rankings: list[list[int]], k: int = 60) -> dict[int, float]:
    """Reciprocal Rank Fusion. Score(id) = sum over rankings of 1/(k + rank)."""
    scores: dict[int, float] = {}
    for ranking in rankings:
        for rank, cid in enumerate(ranking, start=1):
            scores[cid] = scores.get(cid, 0.0) + 1.0 / (k + rank)
    return scores


# Stopwords descartadas antes do MATCH. Elas entram no OR e casam quase todo o corpus:
# medido em 2026-08-04, "qual a conduta inicial na embolia pulmonar macica" levava 3,00s
# contra 0,02s da mesma pergunta sem stopwords — 150x, estável na repetição (não é cache).
# Pergunta de usuário é linguagem natural e vem cheia delas, então este era o custo do
# caminho real, não de um caso raro.
#
# Filtro em tempo de query, e não tokenizer customizado, porque reindexar 1,2M chunks
# custa horas e isto é reversível com uma linha.
_STOPWORDS = frozenset("""
a as o os um uma uns umas de do da dos das em no na nos nas por para pelo pela com sem
sob sobre entre ate apos e ou mas que se qual quais quando onde como porque pois ja
nao sim muito mais menos meu minha seu sua este esta esse essa aquele aquela isto isso
ser estar ter haver fazer pode posso devo deve qual e eh sao foi era vou vai
the of in on at to for and or is are was were be been being do does did what which
how when where why can could should would may might will shall
paciente caso conduta inicial fazer faco tratamento manejo
""".split())

# Tokens abaixo disto quase nunca discriminam e engordam o OR.
_MIN_TOKEN = 3


def _fts_query(query: str) -> str | None:
    toks = re.findall(r"\w+", query.lower(), flags=re.UNICODE)
    util = [t for t in toks if len(t) >= _MIN_TOKEN and t not in _STOPWORDS]
    # Query inteiramente feita de stopwords (ex.: "o que fazer?") ainda precisa buscar
    # algo — cair para os tokens originais é lento, mas devolver vazio mataria o sinal
    # lexical e deixaria a fusão RRF só com o denso.
    chosen = util or toks
    return " OR ".join(f'"{t}"' for t in chosen) if chosen else None


def lexical_search(conn: sqlite3.Connection, query: str, top_n: int, *,
                   specialty: str | None = None,
                   specialties: list[str] | None = None) -> list[int]:
    match = _fts_query(query)
    if not match:
        return []
    specs = _resolve_specs(specialty, specialties)
    sql = ("SELECT dc.id FROM chunk_fts f "
           "JOIN document_chunks dc ON dc.id = f.rowid "
           "JOIN documents d ON d.id = dc.document_id "
           "WHERE chunk_fts MATCH ? AND d.status = 'active'" + _spec_clause(specs)
           + " ORDER BY bm25(chunk_fts) LIMIT ?")
    params: list = [match, *(specs or []), top_n]
    try:
        return [r["id"] for r in conn.execute(sql, params)]
    except sqlite3.OperationalError:
        return []


def _cosine(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(y * y for y in b))
    return dot / (na * nb) if na and nb else 0.0


def dense_search(conn: sqlite3.Connection, query_vec: list[float], top_n: int, *,
                 specialty: str | None = None,
                 specialties: list[str] | None = None) -> list[int]:
    specs = _resolve_specs(specialty, specialties)
    sql = ("SELECT dc.id, dc.embedding FROM document_chunks dc "
           "JOIN documents d ON d.id = dc.document_id "
           "WHERE d.status = 'active' AND dc.embedding IS NOT NULL" + _spec_clause(specs))
    params: list = list(specs or [])
    scored = [(_cosine(query_vec, decode_vector(r["embedding"])), r["id"])
              for r in conn.execute(sql, params)]
    scored.sort(reverse=True)
    return [cid for _, cid in scored[:top_n]]


def _load_chunks(conn: sqlite3.Connection, ids: list[int]) -> dict[int, sqlite3.Row]:
    if not ids:
        return {}
    placeholders = ",".join("?" * len(ids))
    rows = conn.execute(
        f"SELECT dc.* FROM document_chunks dc JOIN documents d ON d.id = dc.document_id "
        f"WHERE dc.id IN ({placeholders}) AND d.status = 'active'", ids).fetchall()
    return {r["id"]: r for r in rows}


def hybrid_search(conn: sqlite3.Connection, query: str, *, embedder: Embedder,
                  reranker: Reranker, top_k: int = 8, candidate_n: int = 50,
                  specialty: str | None = None, specialties: list[str] | None = None,
                  rrf_k: int = 60, evidence_aware: bool = True,
                  store: VectorStore | None = None,
                  graph: GraphStore | None = None,
                  lexical_query: str | None = None,
                  family_cap: int = 0,
                  extra_dense_rankings: dict[str, list[int]] | None = None,
                  timings: dict | None = None) -> list[Hit]:
    # `timings` é opcional e mutável: preenche segundos de parede por estágio sem
    # mudar o contrato de retorno (list[Hit]). Instrumentação de latência 2026-08-04:
    # FTS/grafo/load_chunks já foram descartados; o que falta isolar é embed+dense+rerank.
    t0 = _tick()
    qvec = embedder.embed([query])[0]
    _mark(timings, "embed_s", t0)
    # Estágio lexical usa a query expandida (sinônimos/siglas do plano) quando fornecida;
    # o denso segue com a query original para não diluir o vetor. #321.
    t0 = _tick()
    lex = lexical_search(conn, lexical_query or query, candidate_n,
                         specialty=specialty, specialties=specialties)
    _mark(timings, "lexical_s", t0)
    # Estágio denso: ANN (LanceDB) quando `store` é dado; senão brute-force exato no SQLite.
    t0 = _tick()
    if store is not None:
        dense = store.search(qvec, candidate_n, specialties=_resolve_specs(specialty, specialties))
        if timings is not None:
            timings["dense_backend"] = type(store).__name__
    else:
        dense = dense_search(conn, qvec, candidate_n, specialty=specialty, specialties=specialties)
        if timings is not None:
            timings["dense_backend"] = "sqlite_bruteforce"
    _mark(timings, "dense_s", t0)
    # 3º sinal: grafo de entidades (respeita o mesmo filtro de especialidade). None → fusion
    # idêntico ao anterior (regressão zero para chamadas diretas sem grafo).
    rankings = [lex, dense]
    # Simvera 2.0: extra dense rankings (MedCPT, Contriever)
    if extra_dense_rankings:
        for name, ranking in extra_dense_rankings.items():
            if isinstance(ranking, list) and ranking:
                rankings.append(ranking)
    graph_ids: list[int] = []
    if graph is not None:
        t0 = _tick()
        graph_ids = graph.expand(query, candidate_n,
                                 specialties=_resolve_specs(specialty, specialties))
        rankings.append(graph_ids)
        _mark(timings, "graph_s", t0)
    t0 = _tick()
    fused = rrf_fuse(rankings, k=rrf_k)
    _mark(timings, "rrf_s", t0)
    if not fused:
        if timings is not None:
            timings["n_lex"] = len(lex)
            timings["n_dense"] = len(dense)
            timings["n_graph"] = len(graph_ids)
            timings["n_candidates"] = 0
            timings["n_reranked"] = 0
        return []
    ranked = sorted(fused, key=lambda c: fused[c], reverse=True)
    # #321 "never degrades": the graph is strictly ADDITIVE. Every lexical/dense candidate is
    # retained before rerank; graph-only candidates get their OWN reserved budget of up to
    # candidate_n slots, regardless of how large the protected set already is. Bug fixed
    # 2026-07-15: `(prot + extra)[:max(candidate_n, len(prot))]` silently dropped 100% of
    # extras whenever len(prot) >= candidate_n (the slice length became exactly len(prot),
    # i.e. `prot` itself) — at corpus scale lex∪dense virtually always reaches candidate_n,
    # so the graph signal never survived to rerank despite `graph.expand()` finding
    # candidates (observed in prod: graph_candidates=50, graph_contribution=0 on every query).
    protected = set(lex) | set(dense)
    prot = [c for c in ranked if c in protected]
    extra = [c for c in ranked if c not in protected]
    candidates = prot + extra[:candidate_n]
    t0 = _tick()
    rows = _load_chunks(conn, candidates)
    _mark(timings, "load_chunks_s", t0)
    ids = [c for c in candidates if c in rows]
    if not ids:
        if timings is not None:
            timings["n_lex"] = len(lex)
            timings["n_dense"] = len(dense)
            timings["n_graph"] = len(graph_ids)
            timings["n_candidates"] = len(candidates)
            timings["n_reranked"] = 0
        return []
    t0 = _tick()
    scores = reranker.rerank(query, [rows[i]["chunk_text"] for i in ids])
    _mark(timings, "rerank_s", t0)
    hits: list[Hit] = []
    for cid, score in zip(ids, scores):
        r = rows[cid]
        boost = EVIDENCE_WEIGHT * _evidence_boost(r["evidence_level"]) if evidence_aware else 0.0
        hits.append(Hit(
            chunk_id=r["id"], document_id=r["document_id"], chunk_text=r["chunk_text"],
            citation_label=r["citation_label"], page_start=r["page_start"],
            page_end=r["page_end"], section_path=r["section_path"],
            specialty=r["specialty"], evidence_level=r["evidence_level"],
            fused_score=fused[cid], rerank_score=score, final_score=score + boost))
    # Ordena por final_score (rerank + evidência); abstenção ainda usa rerank_score puro.
    hits.sort(key=lambda h: h.final_score, reverse=True)
    if family_cap > 0:
        hits = diversify(hits, cap_per_family=family_cap)
    if timings is not None:
        timings["n_lex"] = len(lex)
        timings["n_dense"] = len(dense)
        timings["n_graph"] = len(graph_ids)
        timings["n_candidates"] = len(candidates)
        timings["n_reranked"] = len(ids)
        timings["n_hits"] = min(top_k, len(hits))
    return hits[:top_k]


def diversify(hits: list[Hit], *, cap_per_family: int = 3) -> list[Hit]:
    """Impõe diversidade por família de fonte (#322): no máximo `cap_per_family` chunks por
    documento e suprime spans exatamente duplicados, mantendo os de maior rerank. Uma única
    fonte não pode dominar a resposta. Espera `hits` já ordenados por relevância."""
    seen_text: set[str] = set()
    per_family: dict[int, int] = {}
    out: list[Hit] = []
    for h in hits:
        key = h.chunk_text.strip()
        if key in seen_text:
            continue
        fam = h.document_id
        if per_family.get(fam, 0) >= cap_per_family:
            continue
        seen_text.add(key)
        per_family[fam] = per_family.get(fam, 0) + 1
        out.append(h)
    return out


def _neighbor_context(conn: sqlite3.Connection, h: Hit) -> dict:
    """Contexto hierárquico (#322): chunks adjacentes (mesmo doc, index ±1) do span casado.
    Distingue explicitamente o SPAN CASADO do contexto ADICIONADO — o contexto nunca é a
    citação, só ajuda a leitura."""
    row = conn.execute("SELECT chunk_index FROM document_chunks WHERE id=?",
                       (h.chunk_id,)).fetchone()
    if row is None:
        return {"context_before": None, "context_after": None}
    idx = row["chunk_index"]

    def nbr(delta: int) -> str | None:
        r = conn.execute(
            "SELECT dc.chunk_text FROM document_chunks dc JOIN documents d ON d.id = dc.document_id "
            "WHERE dc.document_id=? AND dc.chunk_index=? AND d.status='active'",
            (h.document_id, idx + delta)).fetchone()
        return r["chunk_text"] if r else None

    return {"context_before": nbr(-1), "context_after": nbr(1)}


def should_abstain(hits: list[Hit], *, top_rerank_min: float,
                   min_supporting_chunks: int) -> bool:
    if not hits:
        return True
    if hits[0].rerank_score < top_rerank_min:
        return True
    supporting = sum(1 for h in hits if h.rerank_score >= top_rerank_min)
    return supporting < min_supporting_chunks


def build_evidence_pack(query: str, hits: list[Hit], *, top_rerank_min: float = 0.0,
                        min_supporting_chunks: int = 1,
                        conn: sqlite3.Connection | None = None) -> dict:
    abstain = should_abstain(hits, top_rerank_min=top_rerank_min,
                             min_supporting_chunks=min_supporting_chunks)
    # Contagem que dirige a abstenção — EXPOSTA no contrato: o gateway a lê como
    # `supporting_chunks` p/ o guard (sem ela, supportingChunks=0 -> weakRag -> toda
    # resposta vira "não confirmada", mesmo com retrieval forte). Bug corrigido 2026-07-16.
    supporting = sum(1 for h in hits if h.rerank_score >= top_rerank_min)
    return {
        "query": query,
        "abstain": abstain,
        "supporting_chunks": supporting,
        "confidence_precheck": round(hits[0].rerank_score, 4) if hits else 0.0,
        "chunks": [
            {
                "chunk_id": h.chunk_id,
                "document_id": h.document_id,
                "citation_label": h.citation_label,
                "page_start": h.page_start,
                "page_end": h.page_end,
                "section_path": h.section_path,
                "specialty": h.specialty,
                "evidence_level": h.evidence_level,
                "rerank_score": round(h.rerank_score, 4),
                "final_score": round(h.final_score, 4),
                "fused_score": round(h.fused_score, 6),
                # The matched span is the citable evidence; adjacent context (#322) is added
                # for readability and is explicitly NOT the citation.
                "text": h.chunk_text,
                "is_matched_span": True,
                **(_neighbor_context(conn, h) if conn is not None else {}),
            }
            for h in hits
        ],
    }


def planned_search(conn: sqlite3.Connection, query: str, *, embedder: Embedder,
                   reranker: Reranker, lexicon: Lexicon | None, graph: GraphStore | None,
                   top_k: int = 8, candidate_n: int = 50,
                   specialty: str | None = None, specialties: list[str] | None = None,
                   rerank_min: float = 0.0, min_supporting_chunks: int = 1,
                   store: VectorStore | None = None,
                   family_cap: int = 0,
                   extra_dense_rankings: dict[str, list[int]] | None = None) -> tuple[list[Hit], dict]:
    """Query planning + hybrid retrieval + ladder de fallback (#321).

    Simvera 2.0: extra_dense_rankings propagado para hybrid_search (MedCPT/Contriever).
    """
    t_total = _tick()
    t0 = _tick()
    plan = plan_query(query, lexicon)
    plan_s = round(_tick() - t0, 4)
    stage_timings: dict = {}
    n_passes = 0

    def run(q: str, lexq: str) -> list[Hit]:
        nonlocal n_passes
        n_passes += 1
        return hybrid_search(
            conn, q, embedder=embedder, reranker=reranker, top_k=top_k,
            candidate_n=candidate_n, specialty=specialty, specialties=specialties,
            store=store, graph=graph, lexical_query=lexq, family_cap=family_cap,
            extra_dense_rankings=extra_dense_rankings, timings=stage_timings)

    hits = run(query, plan.expanded_query())

    # Ladder: só escala se a 1ª passada abstém E há sub-perguntas a tentar (composta).
    if plan.subqueries and should_abstain(
            hits, top_rerank_min=rerank_min, min_supporting_chunks=min_supporting_chunks):
        merged: dict[int, Hit] = {h.chunk_id: h for h in hits}
        for sq in plan.subqueries:
            for h in run(sq, plan_query(sq, lexicon).expanded_query()):
                cur = merged.get(h.chunk_id)
                if cur is None or h.final_score > cur.final_score:
                    merged[h.chunk_id] = h
        merged_hits = sorted(merged.values(), key=lambda h: h.final_score, reverse=True)
        # Re-apply diversity across the MERGED union: each subquery run was capped only within
        # its own candidate set, so the union of N subqueries could exceed cap_per_family N× —
        # re-diversify so one source can't dominate a compound-query answer (#322).
        if family_cap > 0:
            merged_hits = diversify(merged_hits, cap_per_family=family_cap)
        hits = merged_hits[:top_k]

    # Contribuição mensurável do grafo: quantos hits finais o grafo nomeou (mesmo filtro).
    # Nota: isto re-executa expand() só para diagnosticar — já era assim antes da
    # instrumentação; o tempo extra entra em total_s, não em graph_s do hybrid.
    graph_ids: set[int] = set()
    if graph is not None:
        graph_ids = set(graph.expand(query, candidate_n,
                                     specialties=_resolve_specs(specialty, specialties)))
    total_s = round(_tick() - t_total, 4)
    # Estágios numéricos de tempo (exclui contagens / backend label).
    timed = {k: v for k, v in stage_timings.items() if k.endswith("_s") and isinstance(v, (int, float))}
    dominant = max(timed, key=timed.get) if timed else None
    diagnostics = {
        "graph_required": graph is not None,
        "graph_candidates": len(graph_ids),
        "graph_contribution": sum(1 for h in hits if h.chunk_id in graph_ids),
        "expansions": len(plan.expansions),
        "subqueries": len(plan.subqueries),
        "n_passes": n_passes,
        "plan_s": plan_s,
        "stage_timings_s": stage_timings,
        "total_s": total_s,
        "dominant_stage": dominant,
    }
    return hits, diagnostics
