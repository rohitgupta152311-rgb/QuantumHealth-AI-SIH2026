"""Shared test fixtures for QuantumHealth-AI tests."""
import asyncio
import io
import os
from pathlib import Path
import shutil
import tempfile
from typing import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base, get_db
from app.core.config import settings
from app.datasets.loader import get_dataset_loader


# ---------------------------------------------------------------------------
# Event-loop fixture (session-scoped, required by pytest-asyncio)
# ---------------------------------------------------------------------------
@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


# ---------------------------------------------------------------------------
# In-memory async SQLite engine & session factory
# ---------------------------------------------------------------------------
TEST_DB_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(TEST_DB_URL, echo=False)
TestSessionLocal = sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)


@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Provide a clean per-test database session."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestSessionLocal() as session:
        yield session

    # Tear down tables after each test
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


# ---------------------------------------------------------------------------
# Temporary model directory (per-test)
# ---------------------------------------------------------------------------
@pytest.fixture
def tmp_model_dir(monkeypatch):
    d = tempfile.mkdtemp(prefix="qhtest_models_")
    monkeypatch.setattr(settings, "models_cache_dir", Path(d))
    yield d
    shutil.rmtree(d, ignore_errors=True)


# ---------------------------------------------------------------------------
# Async test client wired to the in-memory DB
# ---------------------------------------------------------------------------
@pytest_asyncio.fixture
async def client(db_session: AsyncSession, tmp_model_dir) -> AsyncGenerator[AsyncClient, None]:
    """AsyncClient bound to the FastAPI app with DB override."""
    from main import app  # import here to avoid circular

    async def _override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac

    app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# CSV helpers
# ---------------------------------------------------------------------------
def make_diabetes_csv(rows: list[dict] | None = None) -> io.BytesIO:
    """Build a valid diabetes CSV. Caller can override rows."""
    import pandas as pd

    loader = get_dataset_loader()
    features = loader.get_feature_names("diabetes")
    if rows is None:
        rows = [
            {f: round(50 + i * 0.3 + j, 2) for j, f in enumerate(features)}
            | {"label": i % 2}
            for i in range(20)
        ]
    df = pd.DataFrame(rows)
    buf = io.BytesIO()
    df.to_csv(buf, index=False)
    buf.seek(0)
    return buf


def make_csv_bytes(columns: list[str], rows: list[list]) -> io.BytesIO:
    """Low-level helper: build a CSV from column names and raw row lists."""
    import pandas as pd

    df = pd.DataFrame(rows, columns=columns)
    buf = io.BytesIO()
    df.to_csv(buf, index=False)
    buf.seek(0)
    return buf
