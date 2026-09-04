import joblib
from sklearn.svm import SVC

class SVMModel:
    """
    Support Vector Machine Classifier with Radial Basis Function (RBF) kernel.
    Effective for non-linear decision boundaries on scaled clinical biomarkers.
    """
    def __init__(self, C: float = 1.0, kernel: str = 'rbf', random_state: int = 42):
        self.model = SVC(
            C=C,
            kernel=kernel,
            probability=True,
            class_weight='balanced',
            random_state=random_state
        )
        self.C = C
        self.kernel = kernel
        
    def fit(self, X, y):
        # SVM (RBF) has O(N^2) complexity; for N > 10,000, use a high-fidelity stratified sample
        if len(X) > 10000:
            import numpy as np
            rng = np.random.RandomState(42)
            idx = rng.choice(len(X), size=10000, replace=False)
            self.model.fit(X[idx], y[idx])
        else:
            self.model.fit(X, y)
        return self
        
    def predict(self, X):
        return self.model.predict(X)
        
    def predict_proba(self, X):
        return self.model.predict_proba(X)
        
    def save(self, path: str):
        joblib.dump(self.model, path)
        
    def load(self, path: str):
        self.model = joblib.load(path)
        return self
