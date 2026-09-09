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
        
    def fit(self, X, y, X_val=None, y_val=None):
        import numpy as np
        # For large clinical cohorts (e.g. Chinese cohort > 100k), LinearSVC + calibration
        # solves the O(N^2) RBF bottleneck in sub-second time with balanced class weights.
        if len(X) > 5000:
            from sklearn.svm import LinearSVC
            from sklearn.calibration import CalibratedClassifierCV
            base_linear = LinearSVC(
                C=self.C,
                class_weight='balanced',
                max_iter=3000,
                random_state=42,
                dual="auto"
            )
            base_linear.fit(X, y)
            if X_val is not None and y_val is not None and len(np.unique(y_val)) > 1:
                self.model = CalibratedClassifierCV(estimator=base_linear, method='sigmoid', cv='prefit')
                self.model.fit(X_val, y_val)
            else:
                self.model = CalibratedClassifierCV(estimator=base_linear, method='sigmoid', cv=3)
                self.model.fit(X, y)
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
