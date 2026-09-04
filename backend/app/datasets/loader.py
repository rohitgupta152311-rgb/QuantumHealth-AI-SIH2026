"""Dataset loading utilities"""
import json
import numpy as np
from sklearn.datasets import load_breast_cancer
from typing import Tuple, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.datasets.diabetes import DiabetesDataset
from app.datasets.heart import HeartDataset
from app.datasets.breast_cancer import BreastCancerDataset
from app.datasets.kidney import KidneyDataset
from app.models.dataset_models import TrainingSample


class DatasetLoader:
    """Loads datasets for different diseases.

    Preserves the original registry-based interface (load, get_disease_info,
    list_diseases) and adds async helpers for uploaded-data merging.
    """

    def __init__(self):
        self._registry = {
            "diabetes": DiabetesDataset(),
            "heart": HeartDataset(),
            "breast_cancer": BreastCancerDataset(),
            "kidney": KidneyDataset(),
        }

    # ------------------------------------------------------------------
    # Original interface (backward-compatible)
    # ------------------------------------------------------------------

    def load(self, disease_id: str) -> tuple[np.ndarray, np.ndarray, list[str]]:
        """Load base dataset: (X, y, feature_names)."""
        if disease_id not in self._registry:
            raise ValueError(
                f"Dataset for disease '{disease_id}' not found. "
                f"Available: {list(self._registry.keys())}"
            )
        return self._registry[disease_id].load()

    def get_disease_info(self, disease_id: str) -> dict:
        if disease_id not in self._registry:
            raise ValueError(f"Disease '{disease_id}' not found.")
        return self._registry[disease_id].get_disease_info()

    def list_diseases(self) -> list[dict]:
        return [ds.get_disease_info() for ds in self._registry.values()]

    def get_feature_names(self, disease_id: str) -> list[str]:
        """Return ordered feature-name list for a disease."""
        info = self.get_disease_info(disease_id)
        return [f["name"] for f in info["features"]]

    @property
    def disease_ids(self) -> list[str]:
        return list(self._registry.keys())

    # ------------------------------------------------------------------
    # Extended interface: base + uploaded data
    # ------------------------------------------------------------------

    async def load_with_uploads(
        self, disease_id: str, db: AsyncSession
    ) -> tuple[np.ndarray, np.ndarray, list[str], dict]:
        """Load base data merged with user-uploaded training samples.

        Returns
        -------
        X_combined : np.ndarray
        y_combined : np.ndarray
        feature_names : list[str]
        metadata : dict  {'base_rows', 'uploaded_rows', 'total_rows', 'source'}
        """
        X_base, y_base, feature_names = self.load(disease_id)

        result = await db.execute(
            select(TrainingSample).where(TrainingSample.disease_id == disease_id)
        )
        samples = result.scalars().all()

        X_uploaded: list[list[float]] = []
        y_uploaded: list[int] = []

        for sample in samples:
            features_dict = json.loads(sample.features_json)
            row = [features_dict.get(f, 0.0) for f in feature_names]
            X_uploaded.append(row)
            y_uploaded.append(sample.label)

        source_base = "sklearn" if disease_id == "breast_cancer" else "local_real_csv"

        if X_uploaded:
            X_uploaded_array = np.array(X_uploaded, dtype=float)
            y_uploaded_array = np.array(y_uploaded, dtype=int)

            # For heart disease, train only on real uploaded CSV data.
            if disease_id in {"heart", "diabetes"}:
                X_combined = X_uploaded_array
                y_combined = y_uploaded_array
                base_rows_used = 0
                source = "uploaded_real_csv"
            else:
                X_combined = np.vstack((X_base, X_uploaded_array))
                y_combined = np.concatenate((y_base, y_uploaded_array))
                base_rows_used = len(X_base)
                source = f"{source_base}+uploaded"
        else:
            X_combined = X_base
            y_combined = y_base
            base_rows_used = len(X_base)
            source = source_base

        metadata = {
            "base_rows": base_rows_used,
            "uploaded_rows": len(X_uploaded),
            "total_rows": len(X_combined),
            "source": source,
        }

        return X_combined, y_combined, feature_names, metadata


def get_dataset_loader() -> DatasetLoader:
    return DatasetLoader()
