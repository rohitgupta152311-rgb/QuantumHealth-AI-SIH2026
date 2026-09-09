import numpy as np
from sklearn.impute import SimpleImputer

class DataCleaner:
    """
    Leakage-free clinical data cleaner.
    - Replaces feature-specific sentinel values (e.g., Glucose=0) with NaN.
    - Fits SimpleImputer strictly on training distribution.
    - Computes and caches training mean and standard deviation for ±3σ outlier clipping.
    """
    def __init__(self, strategy: str = "median", missing_sentinels: dict[int, list[float]] | None = None):
        self.strategy = strategy
        self.imputer = SimpleImputer(strategy=strategy)
        self.missing_sentinels = missing_sentinels or {}
        self.mean_ = None
        self.std_ = None
        self._fitted = False

    def _mask_sentinels(self, X: np.ndarray) -> np.ndarray:
        """Replace sentinel values with np.nan."""
        X_out = np.array(X, dtype=np.float64, copy=True)
        sentinels_dict = getattr(self, "missing_sentinels", None)
        if not sentinels_dict:
            return X_out

        for col_idx, sentinels in sentinels_dict.items():
            if col_idx < X_out.shape[1]:
                for s in sentinels:
                    mask = np.isclose(X_out[:, col_idx], s, atol=1e-5)
                    X_out[mask, col_idx] = np.nan
        return X_out

    def fit(self, X: np.ndarray) -> 'DataCleaner':
        X_masked = self._mask_sentinels(X)
        self.imputer.fit(X_masked)
        X_imputed = self.imputer.transform(X_masked)
        self.mean_ = np.nanmean(X_imputed, axis=0)
        self.std_ = np.nanstd(X_imputed, axis=0)
        # Avoid division by zero or zero-range clipping
        self.std_ = np.where(self.std_ == 0, 1.0, self.std_)
        self._fitted = True
        return self

    def transform(self, X: np.ndarray) -> np.ndarray:
        if not self._fitted:
            raise RuntimeError("DataCleaner must be fitted before transform")
        X_masked = self._mask_sentinels(X)
        X_imputed = self.imputer.transform(X_masked)
        # Outlier clipping strictly to 3 std dev from training mean
        lower_bound = self.mean_ - 3 * self.std_
        upper_bound = self.mean_ + 3 * self.std_
        return np.clip(X_imputed, lower_bound, upper_bound)

    def fit_transform(self, X: np.ndarray) -> np.ndarray:
        return self.fit(X).transform(X)
