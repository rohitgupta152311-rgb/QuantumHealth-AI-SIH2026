import numpy as np
from sklearn.feature_selection import SelectKBest, mutual_info_classif

class FeatureSelector:
    def __init__(self, n_features: int = 6, method: str = "mutual_info"):
        self.n_features = n_features
        self.method = method
        self.selected_indices = None
        self.selected_names = None
        self.selector = SelectKBest(score_func=mutual_info_classif, k=n_features)
        self.feature_names = None
        self._fitted = False
    
    def fit(self, X: np.ndarray, y: np.ndarray, feature_names: list[str]) -> 'FeatureSelector':
        # Adjust n_features if X has fewer features
        k = min(self.n_features, X.shape[1])
        self.selector.set_params(k=k)
        
        self.selector.fit(X, y)
        self.selected_indices = self.selector.get_support(indices=True)
        self.feature_names = feature_names
        self.selected_names = [feature_names[i] for i in self.selected_indices]
        self._fitted = True
        return self
    
    def transform(self, X: np.ndarray) -> np.ndarray:
        if not self._fitted:
            raise RuntimeError("FeatureSelector not fitted")
        return X[:, self.selected_indices]
        
    def fit_transform(self, X: np.ndarray, y: np.ndarray, feature_names: list[str]) -> np.ndarray:
        return self.fit(X, y, feature_names).transform(X)
    
    def get_importance_scores(self) -> dict[str, float]:
        if not self._fitted:
            raise RuntimeError("FeatureSelector not fitted")
        scores = self.selector.scores_
        return {name: float(score) for name, score in zip(self.feature_names, scores)}
