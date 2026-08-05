"""Fase 4 — lógica admin (catálogo, curadoria, supersede, skill-as-RAG).

Local, zero egress. Mantém api.py fino. Curadoria toca só campos enviados.
Skill: .zip → references/**/*.md viram chunks citáveis (documents source_type='skill');
SKILL.md vira persona de um agente. Reutiliza chunk_document via Blocks de markdown.
"""
from __future__ import annotations

import hashlib
import io
import os
import re
import sqlite3
import uuid
import zipfile
from pathlib import Path

from fastapi import FastAPI, File, Form, Header, HTTPException, UploadFile
from pydantic import BaseModel

from . import agents, db, jobs
from .chunking import chunk_document
from .config import Settings
from .embedding import Embedder, encode_vector
from .models import Block, ParsedDoc
from .parsing.router import SUPPORTED_EXTS

# Campos que a curadoria pode editar (PATCH /admin/documents/{id}).
_DOC_EDITABLE = ("evidence_level", "publication_year", "specialty", "source_type", "title")


def list_documents(conn: sqlite3.Connection, *, q: str | None = None,
                   specialty: str | None = None, status: str | None = None) -> list[dict]:
    """Catálogo filtrável com contagem de chunks por doc."""
    sql = [
        "SELECT d.*, (SELECT COUNT(*) FROM document_chunks c WHERE c.document_id=d.id) "
        "AS chunk_count FROM documents d WHERE 1=1"]
    params: list = []
    if q:
        sql.append("AND d.title LIKE ?")
        params.append(f"%{q}%")
    if specialty:
        sql.append("AND d.specialty=?")
        params.append(specialty)
    if status:
        sql.append("AND d.status=?")
        params.append(status)
    sql.append("ORDER BY d.id DESC")
    rows = conn.execute(" ".join(sql), params).fetchall()
    return [dict(r) for r in rows]


def get_document(conn: sqlite3.Connection, doc_id: int) -> dict | None:
    row = conn.execute(
        "SELECT d.*, (SELECT COUNT(*) FROM document_chunks c WHERE c.document_id=d.id) "
        "AS chunk_count FROM documents d WHERE d.id=?", (doc_id,)).fetchone()
    return dict(row) if row else None


def update_document(conn: sqlite3.Connection, doc_id: int, fields: dict) -> dict | None:
    """Curadoria: atualiza só os campos enviados (não-None). 404 → None."""
    if get_document(conn, doc_id) is None:
        return None
    sets, vals = [], []
    for col in _DOC_EDITABLE:
        if col in fields and fields[col] is not None:
            sets.append(f"{col}=?")
            vals.append(fields[col])
    if sets:
        conn.execute(f"UPDATE documents SET {', '.join(sets)} WHERE id=?", (*vals, doc_id))
        conn.commit()
    return get_document(conn, doc_id)


def supersede_document(conn: sqlite3.Connection, doc_id: int, superseded_by: int) -> dict | None:
    """Q3: marca status='superseded' + superseded_by. Some da busca, fica auditável.
    Retorna None se doc ou alvo não existem (handler decide o 404)."""
    if get_document(conn, doc_id) is None or get_document(conn, superseded_by) is None:
        return None
    conn.execute("UPDATE documents SET status='superseded', superseded_by=? WHERE id=?",
                 (superseded_by, doc_id))
    conn.commit()
    return get_document(conn, doc_id)


# ── Skill-as-RAG (Q2) ───────────────────────────────────────────────────────────

def _md_to_blocks(text: str, *, page: int = 1) -> list[Block]:
    """Markdown simples → Blocks por seção (## cabeçalho). Section_path carrega a fonte."""
    blocks: list[Block] = []
    section: str | None = None
    body: list[str] = []

    def flush() -> None:
        joined = "\n".join(body).strip()
        if joined:
            blocks.append(Block(joined, page, section, "text"))

    for line in text.splitlines():
        m = re.match(r"^#{1,6}\s+(.*)$", line)
        if m:
            flush()
            body = []
            section = m.group(1).strip()
        else:
            body.append(line)
    flush()
    if not blocks:  # markdown sem cabeçalhos: um bloco único
        whole = text.strip()
        if whole:
            blocks.append(Block(whole, page, None, "text"))
    return blocks


def _store_skill_document(conn: sqlite3.Connection, *, title: str, specialty: str | None,
                          blocks: list[Block], embedder: Embedder, settings: Settings) -> int:
    doc = ParsedDoc(markdown="", blocks=blocks, parser="skill")
    chunks = chunk_document(
        doc, min_tokens=settings.chunk_min_tokens, max_tokens=settings.chunk_max_tokens,
        overlap_tokens=settings.chunk_overlap_tokens, title=title)
    vectors = embedder.embed([c.contextual_text for c in chunks]) if chunks else []
    cur = conn.execute(
        "INSERT INTO documents (source_path, source_type, title, specialty, ingestion_status) "
        "VALUES (?, 'skill', ?, ?, 'done')", (f"skill://{title}", title, specialty))
    doc_id = cur.lastrowid
    for chunk, vec in zip(chunks, vectors):
        ccur = conn.execute(
            "INSERT INTO document_chunks (document_id, chunk_index, chunk_text, contextual_text, "
            "section_path, page_start, page_end, token_count, chunk_type, citation_label, "
            "embedding, specialty) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
            (doc_id, chunk.chunk_index, chunk.chunk_text, chunk.contextual_text,
             chunk.section_path, chunk.page_start, chunk.page_end, chunk.token_count,
             chunk.chunk_type, chunk.citation_label, encode_vector(vec), specialty))
        conn.execute("INSERT INTO chunk_fts (rowid, chunk_text) VALUES (?, ?)",
                     (ccur.lastrowid, chunk.chunk_text))
    conn.commit()
    return doc_id


def _slugify(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", name.lower()).strip("_") or "skill"


def ingest_skill_zip(conn: sqlite3.Connection, *, name: str, specialty: str | None,
                     zip_bytes: bytes, embedder: Embedder, settings: Settings) -> dict:
    """.zip → references/**/*.md = chunks citáveis (1 documents); SKILL.md = persona de agente.
    Liga tudo em skill_packages. Cria/atualiza o agente preservando CORE_SAFETY primeiro."""
    ref_blocks: list[Block] = []
    skill_md = ""
    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as z:
        for info in z.infolist():
            if info.is_dir():
                continue
            n = info.filename
            base = Path(n).name
            text = z.read(n).decode("utf-8", "replace")
            if base.upper() == "SKILL.MD":
                skill_md = text
            elif "references/" in n.replace("\\", "/") and base.lower().endswith(".md"):
                ref_blocks.extend(_md_to_blocks(text))

    doc_id = _store_skill_document(
        conn, title=name, specialty=specialty, blocks=ref_blocks,
        embedder=embedder, settings=settings)

    persona = skill_md.strip() or f"Skill: {name}"
    agent_key = _slugify(name)
    if agents.get_agent_admin(conn, agent_key) is None:
        agents.create_agent(
            conn, key=agent_key, display_name=name, persona_prompt=persona,
            corpus_filter=[specialty] if specialty else [], skill_source_id=doc_id)
    else:
        agents.update_agent(conn, agent_key,
                            {"persona_prompt": persona,
                             "corpus_filter": [specialty] if specialty else []})

    cur = conn.execute(
        "INSERT INTO skill_packages (name, specialty, agent_key, document_id, status) "
        "VALUES (?,?,?,?, 'active')", (name, specialty, agent_key, doc_id))
    conn.commit()
    return {"skill_id": cur.lastrowid, "document_id": doc_id, "agent_key": agent_key,
            "status": "active"}


# ── HTTP: modelos + gating + registro de rotas (mantém api.py fino) ─────────────

class DocPatch(BaseModel):
    evidence_level: str | None = None
    publication_year: int | None = None
    specialty: str | None = None
    source_type: str | None = None
    title: str | None = None


class SupersedeRequest(BaseModel):
    superseded_by: int


class AgentPatch(BaseModel):
    persona_prompt: str | None = None
    corpus_filter: list[str] | None = None
    enabled: bool | None = None
    display_name: str | None = None
    # core_safety NÃO existe aqui: núcleo imutável, nunca editável pelo admin.


class AgentCreate(BaseModel):
    key: str
    display_name: str
    persona_prompt: str
    corpus_filter: list[str] | None = None
    enabled: bool = True


def check_admin(token: str | None) -> None:
    """Defesa em profundidade local. Sem token no env → 503; token errado/ausente → 403.
    O role admin real é validado na camada PWA/gateway."""
    configured = os.environ.get("RAG_ADMIN_TOKEN")
    if not configured:
        raise HTTPException(status_code=503, detail="admin disabled: RAG_ADMIN_TOKEN not set")
    if token != configured:
        raise HTTPException(status_code=403, detail="invalid admin token")


def _agent_view(agent: dict) -> dict:
    return {**agent, "system_prompt": agents.resolve_system_prompt(agent)}


# ── Uploads (drag-and-drop multi-arquivo) ─────────────────────────────────────

def _uploads_dir(db_path: str) -> Path:
    """Spool dos originais. Ancorado ao db_path REAL do app (não ao settings.db_path,
    que pode divergir quando create_app recebe db_path explícito — caso dos testes).
    Lido a cada request para permitir override por env sem reboot."""
    env = os.environ.get("RAG_UPLOADS_DIR")
    return Path(env) if env else Path(db_path).parent / "uploads"


def _upload_max_bytes() -> int:
    # Default 100MB: teto de body do caminho nuvem (Cloudflare Tunnel).
    return int(os.environ.get("RAG_UPLOAD_MAX_MB", "100")) << 20


def _safe_upload_name(digest: str, original: str) -> str:
    p = Path(original or "document")
    stem = "".join(c if c.isalnum() or c in ("-", "_") else "_" for c in p.stem)
    stem = stem[:90].strip("_") or "document"
    return f"{digest[:16]}_{stem}{p.suffix.lower()}"


def _receive_upload(conn: sqlite3.Connection, upload: UploadFile, *,
                    specialty: str | None, uploads_dir: Path, max_bytes: int) -> dict:
    """Um arquivo do batch: whitelist → streaming p/ spool (1MB blocks, sha256 no mesmo
    passo, NUNCA read() inteiro) → dedup por content_hash ANTES de enfileirar → rename
    atômico + enqueue. Falha aqui não aborta o batch (o chamador itera)."""
    name = upload.filename or "document"
    ext = Path(name).suffix.lower()
    if ext not in SUPPORTED_EXTS:
        return {"filename": name, "status": "rejected", "size_bytes": 0,
                "reason": f"unsupported extension: {ext or '(none)'}"}

    digest_h = hashlib.sha256()
    size = 0
    too_large = False
    tmp = uploads_dir / f".{uuid.uuid4().hex}.part"
    with open(tmp, "wb") as out:
        while block := upload.file.read(1 << 20):
            size += len(block)
            if size > max_bytes:
                too_large = True
                break
            digest_h.update(block)
            out.write(block)
    if too_large:
        tmp.unlink(missing_ok=True)
        return {"filename": name, "status": "rejected", "size_bytes": size,
                "reason": f"file exceeds {max_bytes >> 20}MB limit"}

    digest = digest_h.hexdigest()
    existing = conn.execute(
        "SELECT id FROM documents WHERE content_hash=?", (digest,)).fetchone()
    if existing:
        tmp.unlink(missing_ok=True)
        return {"filename": name, "status": "duplicate", "size_bytes": size,
                "document_id": existing["id"]}

    # Mesmo conteúdo já no spool (ex.: duplicado dentro do batch, ainda sem documents
    # row) — o nome do spool inclui o stem ORIGINAL, então a chave é o prefixo do digest.
    if any(uploads_dir.glob(f"{digest[:16]}_*")):
        tmp.unlink(missing_ok=True)
        return {"filename": name, "status": "duplicate", "size_bytes": size,
                "reason": "identical upload already pending ingestion"}
    final = uploads_dir / _safe_upload_name(digest, name)
    tmp.rename(final)  # mesmo filesystem → atômico

    # title explícito: sem ele o ingest usaria o stem do SPOOL ("<digest>_<stem>") como
    # título no catálogo e nas citações.
    metadata = {"source": "upload", "original_filename": name, "title": Path(name).stem}
    if specialty:
        metadata["specialty"] = specialty
    job_id = jobs.enqueue(conn, final, metadata)
    return {"filename": name, "status": "queued", "size_bytes": size, "job_id": job_id}


def register_admin_routes(app: FastAPI, *, db_path: str, embedder: Embedder,
                          settings: Settings) -> None:
    """Registra rotas /admin/* no app. Cada handler valida X-Admin-Token e usa conn por request."""

    @app.get("/admin/documents")
    def admin_list_documents(q: str | None = None, specialty: str | None = None,
                             status: str | None = None,
                             x_admin_token: str | None = Header(default=None)):
        check_admin(x_admin_token)
        conn = db.connect(db_path)
        try:
            return {"documents": list_documents(conn, q=q, specialty=specialty, status=status)}
        finally:
            conn.close()

    @app.patch("/admin/documents/{doc_id}")
    def admin_patch_document(doc_id: int, patch: DocPatch,
                             x_admin_token: str | None = Header(default=None)):
        check_admin(x_admin_token)
        conn = db.connect(db_path)
        try:
            updated = update_document(conn, doc_id, patch.model_dump(exclude_unset=True))
        finally:
            conn.close()
        if updated is None:
            raise HTTPException(status_code=404, detail="document not found")
        return updated

    @app.post("/admin/documents/{doc_id}/supersede")
    def admin_supersede(doc_id: int, req: SupersedeRequest,
                        x_admin_token: str | None = Header(default=None)):
        check_admin(x_admin_token)
        conn = db.connect(db_path)
        try:
            updated = supersede_document(conn, doc_id, req.superseded_by)
        finally:
            conn.close()
        if updated is None:
            raise HTTPException(status_code=404, detail="document or target not found")
        return updated

    @app.patch("/admin/agents/{key}")
    def admin_patch_agent(key: str, patch: AgentPatch,
                          x_admin_token: str | None = Header(default=None)):
        check_admin(x_admin_token)
        conn = db.connect(db_path)
        try:
            updated = agents.update_agent(conn, key, patch.model_dump(exclude_unset=True))
        finally:
            conn.close()
        if updated is None:
            raise HTTPException(status_code=404, detail="agent not found")
        return _agent_view(updated)

    @app.get("/admin/agents/{key}")
    def admin_get_agent(key: str, x_admin_token: str | None = Header(default=None)):
        check_admin(x_admin_token)
        conn = db.connect(db_path)
        try:
            agent = agents.get_agent_admin(conn, key)
        finally:
            conn.close()
        if agent is None:
            raise HTTPException(status_code=404, detail="agent not found")
        return _agent_view(agent)

    @app.post("/admin/agents")
    def admin_create_agent(body: AgentCreate,
                           x_admin_token: str | None = Header(default=None)):
        check_admin(x_admin_token)
        conn = db.connect(db_path)
        try:
            if agents.get_agent_admin(conn, body.key) is not None:
                raise HTTPException(status_code=409, detail="agent key already exists")
            created = agents.create_agent(
                conn, key=body.key, display_name=body.display_name,
                persona_prompt=body.persona_prompt, corpus_filter=body.corpus_filter,
                enabled=body.enabled)
        finally:
            conn.close()
        return _agent_view(created)

    @app.post("/admin/skills")
    def admin_upload_skill(name: str = Form(...), specialty: str | None = Form(default=None),
                           file: UploadFile = File(...),
                           x_admin_token: str | None = Header(default=None)):
        check_admin(x_admin_token)
        conn = db.connect(db_path)
        try:
            return ingest_skill_zip(
                conn, name=name, specialty=specialty, zip_bytes=file.file.read(),
                embedder=embedder, settings=settings)
        finally:
            conn.close()

    @app.post("/admin/uploads")
    def admin_upload_documents(files: list[UploadFile] = File(...),
                               specialty: str | None = Form(default=None),
                               x_admin_token: str | None = Header(default=None)):
        check_admin(x_admin_token)
        uploads_dir = _uploads_dir(db_path)
        uploads_dir.mkdir(parents=True, exist_ok=True)
        max_bytes = _upload_max_bytes()
        conn = db.connect(db_path)
        try:
            results = [
                _receive_upload(conn, f, specialty=specialty,
                                uploads_dir=uploads_dir, max_bytes=max_bytes)
                for f in files
            ]
        finally:
            conn.close()
        return {"results": results}

    # Wrappers gated de /jobs — o gateway só proxia /admin/*, então o browser
    # acompanha os uploads por aqui (api.py:/jobs continua loopback-only).
    @app.get("/admin/jobs")
    def admin_list_jobs(ids: str | None = None,
                        x_admin_token: str | None = Header(default=None)):
        check_admin(x_admin_token)
        conn = db.connect(db_path)
        try:
            if ids:
                id_list = [int(x) for x in ids.split(",") if x.strip().isdigit()]
                if not id_list:
                    return {"jobs": []}
                marks = ",".join("?" * len(id_list))
                rows = conn.execute(
                    f"SELECT * FROM ingestion_jobs WHERE id IN ({marks}) ORDER BY id DESC",
                    id_list).fetchall()
            else:
                rows = conn.execute(
                    "SELECT * FROM ingestion_jobs ORDER BY id DESC LIMIT 100").fetchall()
            return {"jobs": [dict(r) for r in rows]}
        finally:
            conn.close()

    @app.get("/admin/jobs/{job_id}")
    def admin_get_job(job_id: int, x_admin_token: str | None = Header(default=None)):
        check_admin(x_admin_token)
        conn = db.connect(db_path)
        try:
            row = conn.execute(
                "SELECT * FROM ingestion_jobs WHERE id=?", (job_id,)).fetchone()
        finally:
            conn.close()
        if row is None:
            raise HTTPException(status_code=404, detail="job not found")
        return dict(row)
