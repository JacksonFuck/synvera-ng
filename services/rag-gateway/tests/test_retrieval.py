"""Hybrid retrieval: RRF, FTS+dense, specialty/status filters, abstention, evidence pack."""
from __future__ import annotations

from raggw import db
from raggw.embedding import FakeEmbedder, encode_vector
from raggw.reranking import FakeReranker
from raggw.retrieval import (
    build_evidence_pack,
    hybrid_search,
    lexical_search,
    rrf_fuse,
)

_EMB = FakeEmbedder(dim=8)


def _seed(conn):
    def add_doc(status, specialty):
        return conn.execute(
            "INSERT INTO documents (source_path, content_hash, status, specialty) "
            "VALUES (?,?,?,?)",
            (f"/{status}-{specialty}.pdf", f"h-{status}-{specialty}", status, specialty),
        ).lastrowid

    def add_chunk(doc_id, text, specialty, ev="rct"):
        vec = encode_vector(_EMB.embed([text])[0])
        cid = conn.execute(
            """INSERT INTO document_chunks
                 (document_id, chunk_index, chunk_text, contextual_text, section_path,
                  page_start, page_end, token_count, citation_label, embedding,
                  specialty, evidence_level)
               VALUES (?,0,?,?,?,1,1,?,?,?,?,?)""",
            (doc_id, text, text, "Secao", len(text.split()),
             f"doc{doc_id} p. 1", vec, specialty, ev),
        ).lastrowid
        conn.execute("INSERT INTO chunk_fts (rowid, chunk_text) VALUES (?,?)", (cid, text))
        return cid

    ids = {}
    d1 = add_doc("active", "intensiva")
    ids["c1"] = add_chunk(d1, "sepse grave tratamento antibiotico precoce", "intensiva", "guideline")
    d2 = add_doc("active", "orto")
    ids["c2"] = add_chunk(d2, "fratura tornozelo imobilizacao gesso", "orto")
    d3 = add_doc("superseded", "intensiva")
    ids["c3"] = add_chunk(d3, "sepse choque vasopressor noradrenalina", "intensiva")
    conn.commit()
    return ids


def _hit(cid, doc, text, score):
    from raggw.retrieval import Hit
    return Hit(chunk_id=cid, document_id=doc, chunk_text=text, citation_label=f"c{cid}",
               page_start=1, page_end=1, section_path="S", specialty=None,
               evidence_level=None, fused_score=0.0, rerank_score=score, final_score=score)


def test_diversify_caps_per_family_and_suppresses_duplicates():
    # #322: no single source (document) dominates, and exact-duplicate spans are dropped.
    from raggw.retrieval import diversify
    hits = [_hit(1, 10, "a", 0.9), _hit(2, 10, "b", 0.8), _hit(3, 10, "c", 0.7),
            _hit(4, 20, "d", 0.6), _hit(5, 10, "a", 0.5)]
    out = [h.chunk_id for h in diversify(hits, cap_per_family=2)]
    assert out == [1, 2, 4]  # doc10 capped at 2; dup "a" dropped; doc20 kept


def test_evidence_pack_exposes_supporting_chunks_count():
    # Bug 2026-07-16: o gateway lia `supporting_chunks` do pack mas o pack NUNCA expunha esse
    # campo -> supportingChunks caía p/ 0 -> guard demovia TODA resposta a "não confirmada"
    # (weakRag). O pack passa a expor a contagem que já dirige a decisão de abstenção.
    from raggw.retrieval import build_evidence_pack
    hits = [_hit(1, 10, "a", 0.95), _hit(2, 11, "b", 0.80), _hit(3, 12, "c", 0.20)]
    pack = build_evidence_pack("q", hits, top_rerank_min=0.5, min_supporting_chunks=1)
    assert pack["supporting_chunks"] == 2  # 0.95 e 0.80 >= 0.5; 0.20 não
    assert pack["abstain"] is False
    # sem hits -> 0 e abstenção
    empty = build_evidence_pack("q", [], top_rerank_min=0.5)
    assert empty["supporting_chunks"] == 0
    assert empty["abstain"] is True


def test_evidence_pack_distinguishes_matched_span_from_added_context(db_path):
    # #322: the matched span is the citable evidence; adjacent chunks are added context,
    # explicitly marked and separate.
    from raggw.retrieval import build_evidence_pack
    conn = db.open_db(db_path)
    d = conn.execute("INSERT INTO documents (source_path, content_hash, status) "
                     "VALUES ('/x.pdf','hx','active')").lastrowid

    def addc(idx, text):
        return conn.execute(
            "INSERT INTO document_chunks (document_id,chunk_index,chunk_text,contextual_text,"
            "section_path,page_start,page_end,citation_label,embedding,specialty) "
            "VALUES (?,?,?,?, 'S',1,1,?,NULL,NULL)", (d, idx, text, text, f"c{idx}")).lastrowid

    addc(0, "trecho anterior")
    c1 = addc(1, "span casado")
    addc(2, "trecho seguinte")
    conn.commit()

    hit = _hit(c1, d, "span casado", 1.0)
    ch = build_evidence_pack("q", [hit], conn=conn)["chunks"][0]
    assert ch["text"] == "span casado" and ch["is_matched_span"] is True
    assert ch["context_before"] == "trecho anterior"
    assert ch["context_after"] == "trecho seguinte"
    # without a conn, no context is fabricated
    assert "context_before" not in build_evidence_pack("q", [hit])["chunks"][0]


def _graph_lex():
    from raggw.graph.lexicon import Entity, Lexicon, normalize
    return Lexicon(entities=[
        Entity("sepse", "Sepse", "disease",
               tuple(normalize(s) for s in ["sepse", "choque septico", "sofa"]))])


def test_ladder_reapplies_diversity_cap_across_subqueries(db_path):
    # #322 x #321: on a compound query whose first pass abstains, the ladder merges per-
    # subquery hits — each capped only within its own run. The merged union must be
    # re-diversified so one document can't exceed cap_per_family across sub-questions.
    from raggw.retrieval import planned_search
    conn = db.open_db(db_path)
    d = conn.execute("INSERT INTO documents (source_path, content_hash, status, specialty) "
                     "VALUES ('/one.pdf','hone','active','uti')").lastrowid

    def addc(idx, text):
        vec = encode_vector(_EMB.embed([text])[0])
        cid = conn.execute(
            "INSERT INTO document_chunks (document_id,chunk_index,chunk_text,contextual_text,"
            "section_path,page_start,page_end,token_count,citation_label,embedding,specialty,"
            "evidence_level) VALUES (?,?,?,?, 'S',1,1,?,?,?, 'uti','rct')",
            (d, idx, text, text, len(text.split()), f"c{idx}", vec)).lastrowid
        conn.execute("INSERT INTO chunk_fts (rowid, chunk_text) VALUES (?,?)", (cid, text))
        return cid

    addc(0, "sepse alpha")
    addc(1, "sepse beta")
    addc(2, "febre gama")
    addc(3, "febre delta")
    conn.commit()

    # First pass "sepse e febre": no chunk has both tokens -> rerank ~0.33 < 0.5 -> abstain ->
    # ladder fires on subqueries "sepse" (c0,c1) and "febre" (c2,c3), each doc d.
    hits, _ = planned_search(
        conn, "sepse e febre", embedder=_EMB, reranker=FakeReranker(), lexicon=None,
        graph=None, top_k=10, candidate_n=20, rerank_min=0.5, min_supporting_chunks=1,
        family_cap=2)
    from_d = sum(1 for h in hits if h.document_id == d)
    assert from_d <= 2  # diversity cap holds through the compound-query ladder


def test_planned_search_uses_graph_and_reports_contribution(db_path):
    from raggw.graph.store import GraphStore, build_graph_index
    from raggw.retrieval import planned_search
    conn = db.open_db(db_path)
    ids = _seed(conn)
    lex = _graph_lex()
    build_graph_index(conn, lexicon=lex)
    hits, diag = planned_search(
        conn, "sepse", embedder=_EMB, reranker=FakeReranker(),
        lexicon=lex, graph=GraphStore(conn, lex), top_k=5, candidate_n=20,
        rerank_min=0.0, min_supporting_chunks=1)
    assert diag["graph_required"] is True
    assert diag["graph_candidates"] >= 1          # graph nominated candidates (obligatory)
    assert any(h.chunk_id == ids["c1"] for h in hits)


def test_graph_signal_is_additive_never_drops_lexical_dense_hits(db_path):
    # #321 "never degrades": graph is a 3rd RRF ranking over a UNION candidate pool, so a
    # chunk found without the graph is still found with it.
    from raggw.graph.store import GraphStore, build_graph_index
    conn = db.open_db(db_path)
    _seed(conn)
    lex = _graph_lex()
    build_graph_index(conn, lexicon=lex)
    graph = GraphStore(conn, lex)

    def ids_for(**kw):
        return {h.chunk_id for h in hybrid_search(
            conn, "sepse", embedder=_EMB, reranker=FakeReranker(),
            top_k=10, candidate_n=20, **kw)}

    assert ids_for() <= ids_for(graph=graph)  # graph only adds, never removes


class _FixedRanking:
    """Fake dense store / graph: devolve uma lista fixa de ids, ignorando o vetor/query real.
    Isola o teste da matemática de embedding/entidade — só a lógica de orçamento do
    candidate pool está sob teste."""

    def __init__(self, ids: list[int]) -> None:
        self._ids = ids

    def search(self, query_vec, top_n, *, specialties=None) -> list[int]:
        return self._ids

    def expand(self, query, top_n, *, specialties=None) -> list[int]:
        return self._ids


def _bare_chunk(conn, text: str, *, doc_id: int | None = None) -> int:
    """Chunk mínimo (sem embedding — dense vem do _FixedRanking fake) indexado no FTS."""
    if doc_id is None:
        doc_id = conn.execute(
            "INSERT INTO documents (source_path, content_hash, status) "
            f"VALUES ('/{text[:8]}.pdf','h-{text[:20]}','active')").lastrowid
    cid = conn.execute(
        "INSERT INTO document_chunks (document_id,chunk_index,chunk_text,contextual_text,"
        "section_path,page_start,page_end,token_count,citation_label,embedding,specialty) "
        "VALUES (?,0,?,?, 'S',1,1,?,?,NULL,NULL)",
        (doc_id, text, text, len(text.split()), f"c{doc_id}")).lastrowid
    conn.execute("INSERT INTO chunk_fts (rowid, chunk_text) VALUES (?,?)", (cid, text))
    return cid


def test_graph_only_candidate_survives_when_protected_set_fills_candidate_n(db_path):
    # Regressão (2026-07-15): `(prot + extra)[:max(candidate_n, len(prot))]` truncava extra
    # (graph-only) a ZERO sempre que lex∪dense já preenchia/excedia candidate_n — o caso
    # normal em corpus real (candidate_n=50, lex e dense raramente se sobrepõem). Produção
    # via /rag/search mostrou graph_candidates=50, graph_contribution=0 nas queries reais.
    # Aqui: candidate_n=2, lex traz 2 ids e dense (fake) traz 2 outros -> protected já tem 4
    # elementos (>= candidate_n). Um 5º chunk só é nomeado pelo grafo (fake) e é o ÚNICO cujo
    # texto bate com a query -> se sobreviver ao orçamento, vence o rerank e aparece no topo.
    conn = db.open_db(db_path)
    lex_ids = [_bare_chunk(conn, "ruido lexical um"), _bare_chunk(conn, "ruido lexical dois")]
    dense_ids = [_bare_chunk(conn, "ruido denso um"), _bare_chunk(conn, "ruido denso dois")]
    graph_only_id = _bare_chunk(conn, "grafo grafo grafo")  # único a bater com a query abaixo
    conn.commit()

    hits = hybrid_search(
        conn, "grafo", embedder=_EMB, reranker=FakeReranker(),
        candidate_n=2, top_k=10,
        lexical_query="ruido",  # acha só lex_ids; "grafo" não aparece em nenhum texto ruído
        store=_FixedRanking(dense_ids),
        graph=_FixedRanking([graph_only_id]),
    )
    hit_ids = [h.chunk_id for h in hits]
    assert graph_only_id in hit_ids, "candidato só-do-grafo foi descartado pelo orçamento"
    assert hit_ids[0] == graph_only_id  # único hit com token overlap -> maior rerank
    assert {*lex_ids, *dense_ids} <= set(hit_ids)  # lex/dense continuam protegidos (never-degrades)


def test_rrf_fuse_rewards_agreement():
    scores = rrf_fuse([[10, 20], [20, 30]], k=60)
    assert set(scores) == {10, 20, 30}
    assert scores[20] > scores[10]  # 20 ranked in both lists


def test_lexical_excludes_superseded(db_path):
    conn = db.open_db(db_path)
    ids = _seed(conn)
    res = lexical_search(conn, "sepse", 10)
    assert ids["c1"] in res
    assert ids["c3"] not in res  # superseded must not surface


def test_lexical_specialty_filter(db_path):
    conn = db.open_db(db_path)
    ids = _seed(conn)
    res = lexical_search(conn, "sepse fratura", 10, specialty="orto")
    assert ids["c2"] in res
    assert ids["c1"] not in res


def test_soft_specialty_keeps_general_chunks_but_drops_other_specialty(db_path):
    # #320: missing metadata is not a hard exclusion — an untagged (general) chunk stays
    # retrievable under a specialty filter, while a chunk tagged with a DIFFERENT specialty
    # is still dropped.
    conn = db.open_db(db_path)
    _seed(conn)

    def add(specialty, text):
        d = conn.execute(
            "INSERT INTO documents (source_path, content_hash, status, specialty) "
            "VALUES (?,?, 'active', ?)",
            (f"/x-{text[:8]}.pdf", f"h-{text[:12]}", specialty)).lastrowid
        vec = encode_vector(_EMB.embed([text])[0])
        cid = conn.execute(
            "INSERT INTO document_chunks (document_id,chunk_index,chunk_text,contextual_text,"
            "section_path,page_start,page_end,token_count,citation_label,embedding,specialty,"
            "evidence_level) VALUES (?,0,?,?,?,1,1,?,?,?,?, 'rct')",
            (d, text, text, "Secao", len(text.split()), f"doc{d} p.1", vec, specialty)).lastrowid
        conn.execute("INSERT INTO chunk_fts (rowid, chunk_text) VALUES (?,?)", (cid, text))
        return cid

    general = add(None, "sepse manejo geral hidratacao volume")
    other = add("orto", "sepse mencionada em contexto ortopedico")
    conn.commit()

    res = lexical_search(conn, "sepse", 10, specialty="intensiva")
    assert general in res, "untagged (general) chunk must not be hard-excluded"
    assert other not in res, "a different specialty is still filtered out"


def test_supersede_document_hides_it_from_retrieval(db_path):
    # #320: supersede is auditable (status + superseded_by) AND removes the doc from results.
    from raggw import admin
    conn = db.open_db(db_path)
    ids = _seed(conn)
    d1 = conn.execute("SELECT document_id FROM document_chunks WHERE id=?",
                      (ids["c1"],)).fetchone()["document_id"]
    d2 = conn.execute("SELECT document_id FROM document_chunks WHERE id=?",
                      (ids["c2"],)).fetchone()["document_id"]
    admin.supersede_document(conn, d1, d2)
    conn.commit()

    assert ids["c1"] not in lexical_search(conn, "sepse", 10)
    row = conn.execute("SELECT status, superseded_by FROM documents WHERE id=?", (d1,)).fetchone()
    assert row["status"] == "superseded" and row["superseded_by"] == d2


def test_hybrid_ranks_relevant_first_and_hides_superseded(db_path):
    conn = db.open_db(db_path)
    ids = _seed(conn)
    hits = hybrid_search(conn, "sepse antibiotico", embedder=_EMB,
                         reranker=FakeReranker(), top_k=5, specialty="intensiva")
    assert hits
    assert hits[0].chunk_id == ids["c1"]
    assert all(h.chunk_id != ids["c3"] for h in hits)


def test_abstains_when_no_relevant_evidence(db_path):
    conn = db.open_db(db_path)
    _seed(conn)
    hits = hybrid_search(conn, "tomografia cranio ressonancia", embedder=_EMB,
                         reranker=FakeReranker(), top_k=5)
    pack = build_evidence_pack("tomografia cranio ressonancia", hits,
                               top_rerank_min=0.3, min_supporting_chunks=1)
    assert pack["abstain"] is True


def test_corpus_filter_accepts_specialty_list(db_path):
    conn = db.open_db(db_path)
    ids = _seed(conn)
    res = lexical_search(conn, "sepse fratura", 10, specialties=["orto", "intensiva"])
    assert ids["c2"] in res  # orto
    assert ids["c1"] in res  # intensiva
    assert ids["c3"] not in res  # superseded


def test_evidence_level_breaks_ties_in_ranking(db_path):
    conn = db.open_db(db_path)
    # two chunks, identical query overlap (rerank tie), different evidence levels
    d = conn.execute("INSERT INTO documents (source_path, content_hash, status, specialty) "
                     "VALUES ('/e.pdf','he','active','intensiva')").lastrowid
    for txt, ev in [("sepse manejo opiniao", "opiniao"), ("sepse manejo diretriz", "guideline")]:
        cid = conn.execute(
            "INSERT INTO document_chunks (document_id,chunk_index,chunk_text,contextual_text,"
            "section_path,page_start,page_end,token_count,citation_label,embedding,specialty,"
            "evidence_level) VALUES (?,?,?,?,?,1,1,?,?,?,?,?)",
            (d, 0 if ev == "opiniao" else 1, txt, txt, "S", len(txt.split()),
             f"{ev} p.1", encode_vector(_EMB.embed([txt])[0]), "intensiva", ev)).lastrowid
        conn.execute("INSERT INTO chunk_fts (rowid, chunk_text) VALUES (?,?)", (cid, txt))
    conn.commit()
    hits = hybrid_search(conn, "sepse", embedder=_EMB, reranker=FakeReranker(),
                         top_k=5, specialty="intensiva")
    assert hits[0].evidence_level == "guideline"  # diretriz vence empate de rerank


def test_evidence_pack_excerpt_is_citable_via_server_id(db_path):
    conn = db.open_db(db_path)
    ids = _seed(conn)
    hits = hybrid_search(conn, "sepse antibiotico", embedder=_EMB,
                         reranker=FakeReranker(), top_k=5, specialty="intensiva")
    pack = build_evidence_pack("sepse antibiotico", hits,
                               top_rerank_min=0.3, min_supporting_chunks=1)
    assert pack["chunks"], "expected at least one citable excerpt"
    for entry in pack["chunks"]:
        assert isinstance(entry["chunk_id"], int)
        row = conn.execute(
            "SELECT citation_label, page_start, section_path FROM document_chunks WHERE id=?",
            (entry["chunk_id"],)).fetchone()
        assert row is not None, "server-issued chunk_id must resolve to a real chunk"
        assert row["citation_label"] == entry["citation_label"]
        assert row["page_start"] == entry["page_start"]
        assert row["section_path"] == entry["section_path"]
    assert pack["chunks"][0]["chunk_id"] == ids["c1"]


def test_evidence_pack_is_citable(db_path):
    conn = db.open_db(db_path)
    _seed(conn)
    hits = hybrid_search(conn, "sepse antibiotico", embedder=_EMB,
                         reranker=FakeReranker(), top_k=5, specialty="intensiva")
    pack = build_evidence_pack("sepse antibiotico", hits,
                               top_rerank_min=0.3, min_supporting_chunks=1)
    assert pack["abstain"] is False
    top = pack["chunks"][0]
    assert top["citation_label"]
    assert top["evidence_level"] == "guideline"
    assert pack["confidence_precheck"] > 0
