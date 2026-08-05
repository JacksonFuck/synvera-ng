"""Inc 2 — inbox watcher: observa ~/rag-inbox e ingere arquivos novos no Super-RAG.

    python -m raggw.scripts.inbox_watcher [--inbox DIR] [--once]

Fala HTTP loopback com a API (POST /ingest + GET /jobs/{id}) — NUNCA abre o SQLite
direto: o worker da API é o único consumidor do DB e isso sobrevive a promotes de
geração. Requer watcher e API no MESMO host/usuário (a API valida o path localmente).

Convenções da inbox:
- subpasta de 1º nível = specialty (ex.: ~/rag-inbox/emergencia/x.pdf); raiz = sem.
- resolvido: sucesso/duplicado → processed/ ; falha → failed/ + <nome>.reason.txt.
- estabilidade por idade de mtime (cópias parciais/rsync/Syncthing esperam a próxima
  varredura); sufixos parciais e dotfiles são ignorados no scan.
- estado só em memória: re-submissão pós-restart é idempotente (dedup por content_hash
  no ingest). Job 404 (DB trocado num promote) → re-submete na próxima varredura.

Limitação documentada: job órfão em `processing` (worker morto sem derrubar a API)
fica pendente indefinidamente — o arquivo permanece na inbox; um restart do gateway
não o retoma (linha continua `processing` no DB). Remediação manual/promote.
"""
from __future__ import annotations

import argparse
import json
import os
import shutil
import time
from dataclasses import dataclass, field
from pathlib import Path

import httpx

from ..ingest import file_hash
from ..parsing.router import SUPPORTED_EXTS

RESERVED_DIRS = {"processed", "failed"}
PARTIAL_SUFFIXES = {".part", ".tmp", ".crdownload", ".partial"}


def _now() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%S%z")


def _log(fp, event: dict) -> None:
    fp.write(json.dumps({"ts": _now(), **event}, ensure_ascii=False) + "\n")
    fp.flush()


@dataclass
class WatcherState:
    """Só memória: path → job_id dos submits ainda não resolvidos."""
    pending: dict[str, int] = field(default_factory=dict)


def scan_inbox(inbox: Path) -> list[Path]:
    """Candidatos a ingestão: exclui processed/ e failed/, dotfiles/dotdirs (inclui o
    log e temporários .syncthing.*), sufixos de cópia parcial e os reason.txt."""
    out: list[Path] = []
    for p in sorted(inbox.rglob("*")):
        if not p.is_file():
            continue
        rel = p.relative_to(inbox)
        if rel.parts[0] in RESERVED_DIRS:
            continue
        if any(part.startswith(".") for part in rel.parts):
            continue
        if p.suffix.lower() in PARTIAL_SUFFIXES:
            continue
        if p.name.endswith(".reason.txt"):
            continue
        out.append(p)
    return out


def classify_specialty(inbox: Path, path: Path) -> str | None:
    rel = path.relative_to(inbox)
    return rel.parts[0] if len(rel.parts) > 1 else None


def is_stable(path: Path, *, stable_seconds: float, now: float | None = None) -> bool:
    """Idade do mtime (não snapshot entre varreduras): rsync/Syncthing atualizam o
    mtime enquanto escrevem, então arquivo em cópia nunca conta como estável."""
    try:
        mtime = path.stat().st_mtime
    except FileNotFoundError:
        return False
    return (now if now is not None else time.time()) - mtime >= stable_seconds


def build_metadata(inbox: Path, path: Path) -> dict:
    # title explícito: sem ele o catálogo mostraria o stem do path (lição do Inc 1).
    meta = {"source": "inbox", "original_filename": path.name, "title": path.stem}
    specialty = classify_specialty(inbox, path)
    if specialty:
        meta["specialty"] = specialty
    return meta


def move_resolved(inbox: Path, path: Path, bucket: str, *, reason: str | None = None) -> Path:
    """Move preservando a subpasta relativa; colisão ganha sufixo _1, _2…; nunca deleta."""
    rel = path.relative_to(inbox)
    dest = inbox / bucket / rel
    dest.parent.mkdir(parents=True, exist_ok=True)
    n = 0
    while dest.exists():
        n += 1
        dest = dest.with_name(f"{path.stem}_{n}{path.suffix}")
    shutil.move(str(path), str(dest))
    if reason:
        dest.with_name(dest.name + ".reason.txt").write_text(reason, encoding="utf-8")
    return dest


def submit(client: httpx.Client, path: Path, metadata: dict) -> int | None:
    r = client.post("/ingest", json={"path": str(path.resolve()), "metadata": metadata})
    if r.status_code == 404:  # arquivo sumiu entre o scan e o POST
        return None
    r.raise_for_status()
    return r.json()["job_id"]


def run_once(client: httpx.Client, inbox: Path, *, state: WatcherState,
             stable_seconds: float, log_fp) -> dict:
    """Uma varredura: Fase A resolve pendências (só então move — o worker lê o path
    lazily), Fase B submete novidades. API fora → retorno antecipado, nada se move."""
    summary = {"scanned": 0, "submitted": 0, "resolved_done": 0, "resolved_failed": 0,
               "pending": 0, "requeued": 0, "ignored_unsupported": 0, "unstable": 0,
               "api_unreachable": False}

    # Fase A — pendências
    for path_str, job_id in list(state.pending.items()):
        path = Path(path_str)
        try:
            r = client.get(f"/jobs/{job_id}")
        except httpx.TransportError:
            summary["api_unreachable"] = True
            _log(log_fp, {"event": "api_unreachable", "phase": "resolve"})
            summary["pending"] = len(state.pending)
            return summary
        if r.status_code == 404:
            # DB trocado num promote: o job sumiu, o arquivo não — re-submete na Fase B.
            _log(log_fp, {"event": "job_lost", "path": path_str, "job_id": job_id})
            summary["requeued"] += 1
            del state.pending[path_str]
            continue
        job = r.json()
        if job["status"] == "done":
            if path.exists():
                move_resolved(inbox, path, "processed")
            _log(log_fp, {"event": "done", "path": path_str, "job_id": job_id,
                          "document_id": job.get("document_id")})
            summary["resolved_done"] += 1
            del state.pending[path_str]
        elif job["status"] == "failed":
            if path.exists():
                move_resolved(inbox, path, "failed",
                              reason=job.get("error") or "ingestion failed")
            _log(log_fp, {"event": "failed", "path": path_str, "job_id": job_id,
                          "error": job.get("error")})
            summary["resolved_failed"] += 1
            del state.pending[path_str]
        # queued/processing: mantém pendente

    # Fase B — scan + submit
    for path in scan_inbox(inbox):
        summary["scanned"] += 1
        if str(path) in state.pending:
            continue
        if path.suffix.lower() not in SUPPORTED_EXTS:
            move_resolved(inbox, path, "failed",
                          reason=f"unsupported extension: {path.suffix or '(none)'}")
            _log(log_fp, {"event": "unsupported", "path": str(path)})
            summary["ignored_unsupported"] += 1
            continue
        if not is_stable(path, stable_seconds=stable_seconds):
            summary["unstable"] += 1
            continue
        metadata = build_metadata(inbox, path)
        try:
            job_id = submit(client, path, metadata)
        except httpx.TransportError:
            summary["api_unreachable"] = True
            _log(log_fp, {"event": "api_unreachable", "phase": "submit"})
            break
        except Exception as exc:  # noqa: BLE001 — um arquivo não derruba a varredura
            _log(log_fp, {"event": "error", "path": str(path), "error": str(exc)[:300]})
            continue
        if job_id is None:
            _log(log_fp, {"event": "vanished", "path": str(path)})
            continue
        state.pending[str(path)] = job_id
        _log(log_fp, {"event": "submit", "path": str(path), "job_id": job_id,
                      "sha256": file_hash(path),  # auditoria; dedup real é do servidor
                      "specialty": metadata.get("specialty")})
        summary["submitted"] += 1

    summary["pending"] = len(state.pending)
    return summary


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description="Watcher da inbox de ingestão do Super-RAG")
    ap.add_argument("--inbox", default="~/rag-inbox")
    ap.add_argument("--api-base",
                    default=f"http://{os.environ.get('RAG_HOST', '127.0.0.1')}:"
                            f"{os.environ.get('RAG_PORT', '8099')}")
    ap.add_argument("--interval", type=float, default=10.0)
    ap.add_argument("--stable-seconds", type=float, default=5.0)
    ap.add_argument("--log", default=None, help="default: <inbox>/.inbox_watcher.jsonl")
    ap.add_argument("--once", action="store_true", help="uma varredura e sai (smoke/dry-run)")
    args = ap.parse_args(argv)

    inbox = Path(args.inbox).expanduser()
    for d in (inbox, inbox / "processed", inbox / "failed"):
        d.mkdir(parents=True, exist_ok=True)
    log_path = Path(args.log) if args.log else inbox / ".inbox_watcher.jsonl"

    state = WatcherState()
    with (open(log_path, "a", encoding="utf-8") as log_fp,
          httpx.Client(base_url=args.api_base, timeout=30.0) as client):
        _log(log_fp, {"event": "start", "inbox": str(inbox), "api_base": args.api_base,
                      "interval": args.interval, "stable_seconds": args.stable_seconds})
        while True:
            summary = run_once(client, inbox, state=state,
                               stable_seconds=args.stable_seconds, log_fp=log_fp)
            if args.once:
                print(json.dumps(summary, ensure_ascii=False))
                return 0
            try:
                time.sleep(args.interval)
            except KeyboardInterrupt:
                return 0


if __name__ == "__main__":
    raise SystemExit(main())
