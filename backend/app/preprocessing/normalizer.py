import numpy as np
from sklearn.preprocessing import StandardScaler, MinMaxScaler

class FeatureNormalizer:
    def __init__(self, method: str = "standard"):
        self.method = method
        if method == "standard":
            self.scaler = StandardScaler()
        elif method == "minmax":
            self.scaler = MinMaxScaler()
        else:
            raise ValueError(f"Unknown scaling method: {method}")
        self._fitted = False
    
    def fit(self, X: np.ndarray) -> 'FeatureNormalizer':
        self.scaler.fit(X)
        self._fitted = True
        return self
    
    def transform(self, X: np.ndarray) -> np.ndarray:
        if not self._fitted:
            raise RuntimeError("FeatureNormalizer not fitted")
        return self.scaler.transform(X)
    
    def fit_transform(self, X: np.ndarray) -> np.ndarray:
        return self.fit(X).transform(X)
        
    def inverse_transform(self, X: np.ndarray) -> np.ndarray:
        if not self._fitted:
            raise RuntimeError("FeatureNormalizer not fitted")
        return self.scaler.inverse_transform(X)
