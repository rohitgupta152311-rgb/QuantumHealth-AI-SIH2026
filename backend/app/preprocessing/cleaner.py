import numpy as np
from sklearn.impute import SimpleImputer

class DataCleaner:
    def __init__(self, strategy: str = "median"):
        self.strategy = strategy
        self.imputer = SimpleImputer(strategy=strategy)
        self.mean_ = None
        self.std_ = None
        self._fitted = False
    
    def fit(self, X: np.ndarray) -> 'DataCleaner':
        self.imputer.fit(X)
        X_imputed = self.imputer.transform(X)
        self.mean_ = np.mean(X_imputed, axis=0)
        self.std_ = np.std(X_imputed, axis=0)
        # Avoid division by zero or zero-range clipping
        self.std_ = np.where(self.std_ == 0, 1.0, self.std_)
        self._fitted = True
        return self
    
    def transform(self, X: np.ndarray) -> np.ndarray:
        if not self._fitted:
            raise RuntimeError("DataCleaner must be fitted before transform")
        X_imputed = self.imputer.transform(X)
        # Outlier clipping (3 std dev from training mean)
        lower_bound = self.mean_ - 3 * self.std_
        upper_bound = self.mean_ + 3 * self.std_
        return np.clip(X_imputed, lower_bound, upper_bound)
    
    def fit_transform(self, X: np.ndarray) -> np.ndarray:
        return self.fit(X).transform(X)
