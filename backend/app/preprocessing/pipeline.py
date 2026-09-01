import os
from pathlib import Path
import numpy as np
import joblib

from app.preprocessing.cleaner import DataCleaner
from app.preprocessing.normalizer import FeatureNormalizer
from app.preprocessing.feature_selector import FeatureSelector


class PreprocessingPipeline:
    """
    Dual-branch preprocessing pipeline:
    1. Classical Branch: DataCleaner -> StandardScaler (for RF, SVM, LR)
    2. Quantum Branch: DataCleaner -> MinMaxScaler[0, 1] -> SelectKBest (for VQC)

    Both scalers and feature selector are fitted strictly on training data.
    """

    def __init__(self, n_quantum_features: int = 6, model_version: str = "v1.0"):
        self.n_quantum_features = n_quantum_features
        self.model_version = model_version
        self.cleaner = DataCleaner()
        self.normalizer_classical = FeatureNormalizer(method="standard")
        self.normalizer_quantum = FeatureNormalizer(method="minmax")
        self.selector = FeatureSelector(n_features=n_quantum_features)
        self._fitted = False
        self.feature_names = None

    @property
    def normalizer(self):
        """Backward compatibility alias for classical normalizer."""
        return self.normalizer_classical

    def fit(self, X: np.ndarray, y: np.ndarray, feature_names: list[str]) -> 'PreprocessingPipeline':
        """Fit all preprocessing components strictly on training data."""
        self.feature_names = list(feature_names)

        # 1. Clean data (impute & compute outlier bounds)
        X_clean = self.cleaner.fit_transform(X)

        # 2. Fit classical scaler (StandardScaler)
        X_classical = self.normalizer_classical.fit_transform(X_clean)

        # 3. Fit quantum scaler (MinMaxScaler -> [0, 1])
        self.normalizer_quantum.fit(X_clean)

        # 4. Fit feature selector on training standardized features
        self.selector.fit(X_classical, y, self.feature_names)

        self._fitted = True
        return self

    def transform(self, X: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
        """
        Transform raw data into classical and quantum feature matrices.

        Returns:
            X_classical: np.ndarray, Standard-scaled (all features)
            X_quantum: np.ndarray, MinMax-scaled in [0, 1] (selected k features)
        """
        if not self._fitted:
            raise RuntimeError("PreprocessingPipeline has not been fitted.")

        X_clean = self.cleaner.transform(X)
        X_classical = self.normalizer_classical.transform(X_clean)

        # Quantum branch: MinMax scaled strictly into [0, 1]
        X_minmax = np.clip(self.normalizer_quantum.transform(X_clean), 0.0, 1.0)
        X_quantum = X_minmax[:, self.selector.selected_indices]

        return X_classical, X_quantum

    def fit_transform(self, X: np.ndarray, y: np.ndarray, feature_names: list[str]) -> tuple[np.ndarray, np.ndarray]:
        return self.fit(X, y, feature_names).transform(X)

    def get_preprocessing_info(self) -> dict:
        if not self._fitted:
            return {}
        return {
            "model_version": self.model_version,
            "selected_features": self.selector.selected_names,
            "selected_indices": self.selector.selected_indices.tolist() if self.selector.selected_indices is not None else [],
            "importance_scores": self.selector.get_importance_scores(),
            "n_quantum_features": self.n_quantum_features,
            "quantum_scaling": "MinMaxScaler(0, 1)",
            "classical_scaling": "StandardScaler()",
        }

    def transform_single(self, features_dict: dict, feature_names: list[str]) -> tuple[np.ndarray, np.ndarray]:
        if not self._fitted:
            raise RuntimeError("PreprocessingPipeline has not been fitted.")
        x_array = np.array([[features_dict.get(f, 0.0) for f in feature_names]], dtype=float)
        return self.transform(x_array)

    def save(self, path: str | Path) -> None:
        """Persist fitted pipeline state to disk."""
        os.makedirs(os.path.dirname(str(path)) or ".", exist_ok=True)
        state = {
            "n_quantum_features": self.n_quantum_features,
            "model_version": self.model_version,
            "cleaner": self.cleaner,
            "normalizer_classical": self.normalizer_classical,
            "normalizer_quantum": self.normalizer_quantum,
            "selector": self.selector,
            "_fitted": self._fitted,
            "feature_names": self.feature_names,
        }
        joblib.dump(state, str(path))

    def load(self, path: str | Path) -> 'PreprocessingPipeline':
        """Load fitted pipeline state from disk."""
        state = joblib.load(str(path))
        self.n_quantum_features = state["n_quantum_features"]
        self.model_version = state.get("model_version", "v1.0")
        self.cleaner = state["cleaner"]
        self.normalizer_classical = state["normalizer_classical"]
        self.normalizer_quantum = state["normalizer_quantum"]
        self.selector = state["selector"]
        self._fitted = state["_fitted"]
        self.feature_names = state["feature_names"]
        return self
