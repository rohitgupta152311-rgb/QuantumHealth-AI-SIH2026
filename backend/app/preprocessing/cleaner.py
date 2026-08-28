import numpy as np
from sklearn.impute import SimpleImputer

class DataCleaner:
    def __init__(self, strategy: str = "median"):
        self.strategy = strategy
        self.imputer = SimpleImputer(strategy=strategy)
        self._fitted = False
    
    def fit(self, X: np.ndarray) -> 'DataCleaner':
        self.imputer.fit(X)
        self._fitted = True
        return self
    
    def transform(self, X: np.ndarray) -> np.ndarray:
        if not self._fitted:
            raise RuntimeError("DataCleaner must be fitted before transform")
        X_imputed = self.imputer.transform(X)
        # Outlier clipping (3 std dev)
        mean = np.mean(X_imputed, axis=0)
        std = np.std(X_imputed, axis=0)
        return np.clip(X_imputed, mean - 3*std, mean + 3*std)
    
    def fit_transform(self, X: np.ndarray) -> np.ndarray:
        return self.fit(X).transform(X)
