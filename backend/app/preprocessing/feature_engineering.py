"""Feature engineering and preprocessing"""
import numpy as np
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.decomposition import PCA
from typing import Tuple, List, Optional

class FeatureEngineer:
    """Feature engineering pipeline"""
    
    def __init__(self, n_quantum_features=4):
        self.scaler = StandardScaler()
        self.pca = PCA(n_components=n_quantum_features)
        self.quantum_scaler = MinMaxScaler(feature_range=(0, np.pi))
        self.n_quantum_features = n_quantum_features
        self.is_fitted = False
        self.pca_fitted = False
        self.feature_names = None
        
    def fit_transform(self, X: np.ndarray, feature_names: List[str]) -> Tuple[np.ndarray, List[str]]:
        """Fit and transform features"""
        self.feature_names = feature_names
        X_scaled = self.scaler.fit_transform(X)
        self.is_fitted = True
        return X_scaled, feature_names
    
    def transform(self, X: np.ndarray) -> np.ndarray:
        """Transform features using fitted preprocessor"""
        if not self.is_fitted:
            raise ValueError("FeatureEngineer not fitted. Call fit_transform first.")
        return self.scaler.transform(X)

    def fit_quantum_features(self, X: np.ndarray) -> np.ndarray:
        """Fit PCA and MinMaxScaler for quantum features and return transformed data"""
        if not self.is_fitted:
            raise ValueError("FeatureEngineer not fitted. Call fit_transform first.")
            
        X_scaled = self.scaler.transform(X)
        
        # Adjust n_components if needed
        n_comp = min(self.n_quantum_features, X_scaled.shape[0], X_scaled.shape[1])
        self.pca = PCA(n_components=n_comp)
        
        X_pca = self.pca.fit_transform(X_scaled)
        X_quantum = self.quantum_scaler.fit_transform(X_pca)
        
        self.pca_fitted = True
        return X_quantum
    
    def get_quantum_features(self, X: np.ndarray) -> np.ndarray:
        """Extract features suitable for quantum processing"""
        if not self.is_fitted:
            raise ValueError("FeatureEngineer not fitted. Call fit_transform first.")
        if not self.pca_fitted:
            raise ValueError("Quantum components not fitted. Call fit_quantum_features first.")
            
        X_scaled = self.scaler.transform(X)
        X_pca = self.pca.transform(X_scaled)
        X_quantum = self.quantum_scaler.transform(X_pca)
        return X_quantum
