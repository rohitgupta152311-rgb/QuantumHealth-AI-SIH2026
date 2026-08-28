import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
import sys
from pathlib import Path
import numpy as np

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent / "backend"))

from main import app
from app.datasets.diabetes import DiabetesDataset

@pytest.fixture
def anyio_backend():
    return 'asyncio'

@pytest_asyncio.fixture
async def async_client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

@pytest.fixture
def dummy_data():
    X = np.random.rand(100, 10)
    y = np.random.randint(0, 2, 100)
    feature_names = [f"feat_{i}" for i in range(10)]
    return X, y, feature_names
