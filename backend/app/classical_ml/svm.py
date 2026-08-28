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
