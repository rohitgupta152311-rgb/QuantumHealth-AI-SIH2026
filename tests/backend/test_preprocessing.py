import pytest
import numpy as np
from app.preprocessing.cleaner import DataCleaner
from app.preprocessing.normalizer import FeatureNormalizer
from app.preprocessing.feature_selector import FeatureSelector
from app.preprocessing.pipeline import PreprocessingPipeline

def test_data_cleaner(dummy_data):
    X, _, _ = dummy_data
    # Introduce NaN
    X_nan = X.copy()
    X_nan[0, 0] = np.nan
    
    cleaner = DataCleaner(strategy="mean")
    X_clean = cleaner.fit_transform(X_nan)
    
    assert not np.isnan(X_clean).any()

def test_normalizer(dummy_data):
    X, _, _ = dummy_data
    
    norm = FeatureNormalizer(method="standard")
    X_norm = norm.fit_transform(X)
    
    assert np.isclose(np.mean(X_norm[:, 0]), 0, atol=1e-7)

def test_feature_selector(dummy_data):
    X, y, feature_names = dummy_data
    
    selector = FeatureSelector(n_features=3)
    X_sel = selector.fit_transform(X, y, feature_names)
    
    assert X_sel.shape[1] == 3
    assert len(selector.selected_names) == 3

def test_pipeline(dummy_data):
    X, y, feature_names = dummy_data
    
    pipeline = PreprocessingPipeline(n_quantum_features=4)
    X_norm, X_sel = pipeline.fit_transform(X, y, feature_names)
    
    assert X_sel.shape[1] == 4
    info = pipeline.get_preprocessing_info()
    assert "selected_features" in info
