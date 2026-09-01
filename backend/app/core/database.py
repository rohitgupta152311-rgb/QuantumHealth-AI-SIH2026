import hashlib
import json
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from sqlalchemy import text
from app.core.config import settings

engine = create_async_engine(settings.database_url, echo=False)
AsyncSessionLocal = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

Base = declarative_base()


def compute_sample_fingerprint(disease_id: str, features_dict: dict, label: int) -> str:
    """Compute deterministic SHA-256 fingerprint for a training sample."""
    items_str = ",".join(f"{k}={float(v):.6f}" for k, v in sorted(features_dict.items()))
    raw_str = f"{disease_id}:{int(label)}:{items_str}"
    return hashlib.sha256(raw_str.encode("utf-8")).hexdigest()


async def run_sqlite_migrations(db_engine):
    """Safely apply non-destructive SQLite column additions and backfill fingerprints without data loss."""
    async with db_engine.begin() as conn:
        # Check uploaded_datasets table columns
        res = await conn.execute(text("PRAGMA table_info(uploaded_datasets);"))
        cols = [row[1] for row in res.fetchall()]
        if cols and "file_hash" not in cols:
            await conn.execute(text("ALTER TABLE uploaded_datasets ADD COLUMN file_hash VARCHAR;"))
            await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_uploaded_datasets_file_hash ON uploaded_datasets (file_hash);"))

        # Check training_samples table columns
        res = await conn.execute(text("PRAGMA table_info(training_samples);"))
        cols = [row[1] for row in res.fetchall()]
        if cols and "fingerprint" not in cols:
            await conn.execute(text("ALTER TABLE training_samples ADD COLUMN fingerprint VARCHAR;"))
            await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_training_samples_fingerprint ON training_samples (fingerprint);"))

        # Backfill fingerprints for any existing rows that have None
        if cols:
            res = await conn.execute(text("SELECT id, disease_id, features_json, label FROM training_samples WHERE fingerprint IS NULL;"))
            rows = res.fetchall()
            for r_id, disease_id, features_json, label in rows:
                try:
                    feat_dict = json.loads(features_json) if features_json else {}
                    fp = compute_sample_fingerprint(disease_id, feat_dict, label)
                    await conn.execute(
                        text("UPDATE training_samples SET fingerprint = :fp WHERE id = :id"),
                        {"fp": fp, "id": r_id}
                    )
                except Exception:
                    pass


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
