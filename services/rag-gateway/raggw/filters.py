"""Shared SQL filter fragments — one source of truth for retrieval boundaries.

The soft specialty filter guards an agent's corpus boundary and is applied on EVERY recall
path (lexical, dense, graph). Keeping it here — instead of hand-rolled per path — means a
future change to the boundary can't silently drift between paths and reopen a leak.
"""
from __future__ import annotations


def soft_specialty_sql(specialties: list[str] | None,
                       col: str = "dc.specialty") -> tuple[str, list[str]]:
    """Soft specialty filter (#320): matched specialty OR general/untagged (NULL/'') chunks
    pass; a chunk tagged with a DIFFERENT specialty is dropped. Returns (sql_fragment, params).
    Empty/None specialties → no filter. `col` lets callers use their own table alias."""
    if not specialties:
        return "", []
    placeholders = ",".join("?" * len(specialties))
    return (f" AND ({col} IN ({placeholders}) OR {col} IS NULL OR {col} = '')",
            list(specialties))
