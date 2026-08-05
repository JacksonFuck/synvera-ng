"""GraphStore: grafo de co-ocorrência de entidades sobre os chunks, como 3º sinal de retrieval.

Espelha o padrão do VectorStore port. Determinístico, SQLite puro (stdlib), loopback.
- build_from_chunks: detecta entidades por chunk (via léxico) → nós + arestas de
  co-ocorrência (peso) + arestas típicas curadas + mapa chunk↔entidade.
- expand(query): entidades da query → vizinhos 1-hop ponderados → ids de chunks ligados,
  ranqueados. Alimenta o rrf_fuse junto de léxico+denso. NUNCA gera texto.

Grafo é DERIVADO dos chunks → sempre rebuildável (build_from_chunks é idempotente).
"""
from __future__ import annotations

import os
import sqlite3
from pathlib import Path

from ..filters import soft_specialty_sql
from .lexicon import Lexicon, load_lexicon

# Quantos vizinhos 1-hop entram na expansão (0 = só as entidades da própria query).
_MAX_NEIGHBORS = int(os.environ.get("RAG_GRAPH_NEIGHBORS", "0"))

_SCHEMA = """
CREATE TABLE IF NOT EXISTS graph_nodes (
    entity_id TEXT PRIMARY KEY,
    label     TEXT,
    kind      TEXT
);
CREATE TABLE IF NOT EXISTS graph_edges (
    a      TEXT NOT NULL,
    b      TEXT NOT NULL,
    rel    TEXT NOT NULL DEFAULT 'cooc',
    weight REAL NOT NULL DEFAULT 0,
    PRIMARY KEY (a, b, rel)
);
CREATE TABLE IF NOT EXISTS graph_chunk_entities (
    chunk_id  INTEGER NOT NULL,
    entity_id TEXT NOT NULL,
    PRIMARY KEY (chunk_id, entity_id)
);
CREATE INDEX IF NOT EXISTS idx_gce_entity ON graph_chunk_entities(entity_id);
CREATE INDEX IF NOT EXISTS idx_gedges_a ON graph_edges(a);
"""


class GraphStore:
    """Grafo de entidades sobre os chunks. Construído a partir do léxico, consultado no retrieval."""

    def __init__(self, conn: sqlite3.Connection, lexicon: Lexicon) -> None:
        self._conn = conn
        self._lex = lexicon
        conn.executescript(_SCHEMA)
        conn.commit()

    # ── build (index-time) ───────────────────────────────────────────────────
    def build_from_chunks(self) -> dict:
        """(Re)constrói o grafo a partir dos chunks ATIVOS. Idempotente: limpa e reinsere."""
        conn = self._conn
        conn.execute("DELETE FROM graph_chunk_entities")
        conn.execute("DELETE FROM graph_edges")
        conn.execute("DELETE FROM graph_nodes")

        for e in self._lex.entities:
            conn.execute(
                "INSERT OR REPLACE INTO graph_nodes (entity_id, label, kind) VALUES (?,?,?)",
                (e.id, e.label, e.kind))

        edge_w: dict[tuple[str, str], float] = {}
        rows = conn.execute(
            "SELECT dc.id, dc.chunk_text, COALESCE(dc.section_path,'') sp "
            "FROM document_chunks dc JOIN documents d ON d.id = dc.document_id "
            "WHERE d.status = 'active'").fetchall()
        n_chunks = 0
        for r in rows:
            ents = sorted(self._lex.detect(f"{r['chunk_text']} {r['sp']}"))
            if not ents:
                continue
            n_chunks += 1
            for eid in ents:
                conn.execute(
                    "INSERT OR IGNORE INTO graph_chunk_entities (chunk_id, entity_id) VALUES (?,?)",
                    (r["id"], eid))
            # co-ocorrência: aresta não-direcionada (a<b) por par no mesmo chunk
            for i in range(len(ents)):
                for j in range(i + 1, len(ents)):
                    key = (ents[i], ents[j])
                    edge_w[key] = edge_w.get(key, 0.0) + 1.0

        for (a, b), w in edge_w.items():
            conn.execute(
                "INSERT OR REPLACE INTO graph_edges (a, b, rel, weight) VALUES (?,?,'cooc',?)",
                (a, b, w))
        # arestas típicas curadas (peso alto, direção preservada em rel)
        for a, rel, b in self._lex.typed_edges:
            conn.execute(
                "INSERT OR REPLACE INTO graph_edges (a, b, rel, weight) VALUES (?,?,?,?)",
                (a, b, rel, 5.0))
        conn.commit()
        return {"chunks_indexed": n_chunks, "edges": len(edge_w) + len(self._lex.typed_edges)}

    # ── query-time ───────────────────────────────────────────────────────────
    def _neighbors(self, entity_ids: set[str], *, only_typed: bool) -> dict[str, float]:
        """Vizinhos 1-hop ponderados.

        `only_typed` separa dois sinais que estavam misturados e não deveriam estar:

        - **arestas tipadas** (`trata`, `dd`, `contraindicado`, `interage`) são FATOS
          curados a partir de campos estruturados. "adrenalina trata anafilaxia" é
          verdade ou não. Sempre valem.
        - **`cooc`** é estatística sobre prosa: mede co-menção em capítulo, não relação
          clínica. Neste corpus deu 66% de densidade — `choque` ↔ `sangramento-uterino`
          com peso 1084 — e expandir por ela trazia 185 das 194 entidades. Ruído.
        """
        rel = " AND rel <> 'cooc'" if only_typed else ""
        weight: dict[str, float] = {}
        for eid in entity_ids:
            for row in self._conn.execute(
                    f"SELECT b AS other, weight FROM graph_edges WHERE a=?{rel} "
                    f"UNION ALL SELECT a AS other, weight FROM graph_edges WHERE b=?{rel}",
                    (eid, eid)):
                other = row["other"]
                if other not in entity_ids:
                    weight[other] = weight.get(other, 0.0) + float(row["weight"])
        return weight

    def expand(self, query: str, top_n: int,
               *, specialties: list[str] | None = None) -> list[int]:
        """Ids de chunks (ativos) ligados às entidades da query + vizinhos 1-hop, ranqueados.

        Entidade direta da query pesa mais que vizinho; retorna no máximo top_n ids.
        Grafo vazio / sem entidade na query → lista vazia (no-op no fusion).
        Respeita o MESMO filtro soft de especialidade do retrieval (#321): como sinal
        obrigatório, o grafo NUNCA pode furar o limite de corpus de um agente — só nomeia
        chunks da(s) especialidade(s) pedida(s) ou gerais (NULL/'')."""
        seeds = self._lex.detect(query)
        if not seeds:
            return []
        # peso por entidade: seeds=alto, vizinhos abaixo (nunca empatam com o seed)
        ent_weight: dict[str, float] = {e: 3.0 for e in seeds}

        # Arestas TIPADAS sempre expandem. São fatos curados de campos estruturados
        # ("adrenalina trata anafilaxia"), e é justamente por elas que o grafo existe:
        # respondem o que a busca densa responde mal — "o que trata X", "diferencial de X".
        for other, w in self._neighbors(seeds, only_typed=True).items():
            ent_weight[other] = ent_weight.get(other, 0.0) + min(w, 2.0)

        # Co-ocorrência só sob pedido explícito. Medido neste corpus: 194 entidades e
        # 12.438 arestas `cooc` = 66% de densidade, então 1-hop a partir de 2 seeds trazia
        # 185/194 entidades — varria ~646k linhas (1,6s) e devolvia "os chunks que citam
        # mais entidades", não os relevantes: graph_contribution=0 em toda query.
        if _MAX_NEIGHBORS:
            cooc = self._neighbors(seeds, only_typed=False)
            for other, w in sorted(cooc.items(), key=lambda kv: -kv[1])[:_MAX_NEIGHBORS]:
                # teto 1.0: abaixo do vizinho tipado (2.0) e do seed (3.0). Só desempata.
                ent_weight[other] = ent_weight.get(other, 0.0) + min(w / 100.0, 1.0)

        spec_sql, spec_params = soft_specialty_sql(specialties)

        chunk_score: dict[int, float] = {}
        for eid, ew in ent_weight.items():
            for row in self._conn.execute(
                    "SELECT gce.chunk_id AS cid FROM graph_chunk_entities gce "
                    "JOIN document_chunks dc ON dc.id = gce.chunk_id "
                    "JOIN documents d ON d.id = dc.document_id "
                    "WHERE gce.entity_id=? AND d.status='active'" + spec_sql,
                    (eid, *spec_params)):
                cid = int(row["cid"])
                chunk_score[cid] = chunk_score.get(cid, 0.0) + ew
        ranked = sorted(chunk_score, key=lambda c: chunk_score[c], reverse=True)
        return ranked[:top_n]


def load_graph_lexicon(settings=None) -> Lexicon | None:
    """Léxico quando RAG_GRAPH_ENABLED=true e o arquivo existe; senão None (grafo desligado).
    Carregado UMA vez em create_app e reusado por request (o GraphStore por-conn é leve)."""
    if os.environ.get("RAG_GRAPH_ENABLED", "").lower() != "true":
        return None
    lex_path = os.environ.get("RAG_GRAPH_LEXICON") or str(
        Path(__file__).parent / "lexicon.json")
    if not Path(lex_path).exists():
        return None
    return load_lexicon(lex_path)


def load_required_lexicon(settings=None) -> Lexicon | None:
    """Léxico SEMPRE carregado — grafo é sinal de recall OBRIGATÓRIO (#321), independente de
    RAG_GRAPH_ENABLED (que segue gating só do caminho legado opt-in). None apenas se o
    arquivo curado não existir. Mesma fonte que build_graph_index (RAG_GRAPH_LEXICON)."""
    lex_path = os.environ.get("RAG_GRAPH_LEXICON") or str(
        Path(__file__).parent / "lexicon.json")
    return load_lexicon(lex_path) if Path(lex_path).exists() else None


def make_graph_store(conn: sqlite3.Connection, lexicon: Lexicon | None) -> GraphStore | None:
    """Envolve uma conn num GraphStore para consulta (expand). None se o léxico está desligado."""
    return GraphStore(conn, lexicon) if lexicon is not None else None


def build_graph_index(conn: sqlite3.Connection, *, lexicon: Lexicon | None = None,
                      lexicon_path: str | Path | None = None) -> dict:
    """(Re)constrói o GraphStore a partir dos chunks ativos, como parte do build do corpus.

    Sinal de recall OBRIGATÓRIO (#320): ao contrário de load_graph_lexicon (opt-in p/ o
    consumo no app até #321), o BUILD não é gated por RAG_GRAPH_ENABLED — roda sempre que
    houver léxico curado. Sem léxico → no-op auditável. Determinístico, zero egress, nunca LLM."""
    if lexicon is None:
        # Same lexicon source as the consume side (load_graph_lexicon) to avoid build/query
        # skew: explicit arg > RAG_GRAPH_LEXICON env > bundled default.
        path = Path(lexicon_path or os.environ.get("RAG_GRAPH_LEXICON")
                    or (Path(__file__).parent / "lexicon.json"))
        if not path.exists():
            return {"skipped": "no_lexicon"}
        lexicon = load_lexicon(path)
    return GraphStore(conn, lexicon).build_from_chunks()
