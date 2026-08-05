"""Index-generation registry: register -> promote -> rollback lifecycle, and
atomicity of promote() under a simulated mid-transaction failure."""
from __future__ import annotations

import sqlite3

import pytest

from raggw import generations as gen


@pytest.fixture
def conn():
    c = sqlite3.connect(":memory:")
    yield c
    c.close()


class _FailingConn:
    """Proxies a real sqlite3.Connection, forcing the Nth execute() call to raise."""

    def __init__(self, real: sqlite3.Connection, fail_at: int) -> None:
        object.__setattr__(self, "_real", real)
        object.__setattr__(self, "_calls", 0)
        object.__setattr__(self, "_fail_at", fail_at)

    def execute(self, *args, **kwargs):
        object.__setattr__(self, "_calls", self._calls + 1)
        if self._calls == self._fail_at:
            raise RuntimeError("simulated failure mid-promote")
        return self._real.execute(*args, **kwargs)

    def __getattr__(self, name):
        return getattr(self._real, name)

    def __setattr__(self, name, value):
        setattr(self._real, name, value)


def test_register_is_idempotent(conn):
    gen.register_generation(conn, "g1", db_path="a.db")
    gen.register_generation(conn, "g1", db_path="b.db")  # ignored, first write wins
    row = conn.execute("SELECT db_path, status FROM index_generations WHERE id='g1'").fetchone()
    assert row[0] == "a.db"
    assert row[1] == "staged"


def test_promote_activates_and_demotes_previous(conn):
    gen.register_generation(conn, "g1", db_path="a.db")
    gen.register_generation(conn, "g2", db_path="b.db")

    gen.promote(conn, "g1")
    active = gen.active_generation(conn)
    assert active["id"] == "g1"

    gen.promote(conn, "g2")
    active = gen.active_generation(conn)
    assert active["id"] == "g2"
    g1 = conn.execute("SELECT status FROM index_generations WHERE id='g1'").fetchone()
    assert g1["status"] == "superseded"


def test_promote_already_active_is_noop(conn):
    gen.register_generation(conn, "g1", db_path="a.db")
    gen.promote(conn, "g1")
    first_promoted_at = gen.active_generation(conn)["promoted_at"]
    gen.promote(conn, "g1")  # no-op, must not error or change promoted_at
    assert gen.active_generation(conn)["promoted_at"] == first_promoted_at


def test_promote_unknown_generation_raises(conn):
    with pytest.raises(ValueError):
        gen.promote(conn, "does-not-exist")


def test_rollback_restores_prior_generation(conn):
    gen.register_generation(conn, "g1", db_path="a.db")
    gen.register_generation(conn, "g2", db_path="b.db")
    gen.promote(conn, "g1")
    gen.promote(conn, "g2")

    gen.rollback(conn, "g1")
    assert gen.active_generation(conn)["id"] == "g1"
    g2 = conn.execute("SELECT status FROM index_generations WHERE id='g2'").fetchone()
    assert g2["status"] == "rolled_back"


def test_active_generation_none_when_nothing_promoted(conn):
    gen.register_generation(conn, "g1", db_path="a.db")
    assert gen.active_generation(conn) is None


def test_promote_atomic_failure_leaves_exactly_one_active(conn):
    gen.register_generation(conn, "g1", db_path="a.db")
    gen.register_generation(conn, "g2", db_path="b.db")
    gen.promote(conn, "g1")

    # execute() calls inside promote(): 1) SELECT target (_get), 2) demote UPDATE,
    # 3) activate UPDATE. Force failure on the 3rd call — mid-promote, after the
    # demote already ran on the connection but before it (or the activate) commits.
    # promote() must roll back so g1 (still uncommitted-demoted) stays active.
    proxy = _FailingConn(conn, fail_at=3)
    with pytest.raises(RuntimeError):
        gen.promote(proxy, "g2")

    rows = conn.execute("SELECT id, status FROM index_generations").fetchall()
    active_rows = [r for r in rows if r["status"] == "active"]
    assert len(active_rows) == 1
    assert active_rows[0]["id"] == "g1"
