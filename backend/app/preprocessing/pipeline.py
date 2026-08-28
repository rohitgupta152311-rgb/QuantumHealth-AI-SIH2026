import numpy as np
from app.preprocessing.cleaner import DataCleaner
from app.preprocessing.normalizer import FeatureNormalizer
from app.preprocessing.feature_selector import FeatureSelector

class PreprocessingPipeline:
    def __init__(self, n_quantum_features: int = 6):
        self.cleaner = DataCleaner()
        self.normalizer = FeatureNormalizer(method="standard")
        self.selector = FeatureSelector(n_features=n_quantum_features)
        self._fitted = False
        self.feature_names = None
    
    def fit(self, X: np.ndarray, y: np.ndarray, feature_names: list[str]) -> 'PreprocessingPipeline':
        self.feature_names = feature_names
        X_clean = self.cleaner.fit_transform(X)
        X_norm = self.normalizer.fit_transform(X_clean)
        self.selector.fit(X_norm, y, feature_names)
        self._fitted = True
        return self
    
    def transform(self, X: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
        if not self._fitted:
            raise RuntimeError("Pipeline not fitted")
        X_clean = self.cleaner.transform(X)
        X_full_normalized = self.normalizer.transform(X_clean)
        X_selected_for_quantum = self.selector.transform(X_full_normalized)
        return X_full_normalized, X_selected_for_quantum
    
    def fit_transform(self, X: np.ndarray, y: np.ndarray, feature_names: list[str]) -> tuple[np.ndarray, np.ndarray]:
        return self.fit(X, y, feature_names).transform(X)
    
    def get_preprocessing_info(self) -> dict:
        if not self._fitted:
            return {}
        return {
            "selected_features": self.selector.selected_names,
            "selected_indices": self.selector.selected_indices.tolist() if self.selector.selected_indices is not None else [],
            "importance_scores": self.selector.get_importance_scores()
        }
    
    def transform_single(self, features_dict: dict, feature_names: list[str]) -> tuple[np.ndarray, np.ndarray]:
        if not self._fitted:
            raise RuntimeError("Pipeline not fitted")
        
        # Ensure correct order
        x_array = np.array([[features_dict.get(f, 0.0) for f in feature_names]])
        return self.transform(x_array)
