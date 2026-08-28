from sklearn.datasets import load_breast_cancer
import numpy as np

class BreastCancerDataset:
    def load(self) -> tuple[np.ndarray, np.ndarray, list[str]]:
        data = load_breast_cancer()
        return data.data, data.target, list(data.feature_names)
    
    def get_feature_info(self) -> list[dict]:
        data = load_breast_cancer()
        features = []
        for i, name in enumerate(data.feature_names):
            features.append({
                "name": name,
                "label": name.replace(" ", " ").title(),
                "unit": None,
                "min_val": float(np.min(data.data[:, i])),
                "max_val": float(np.max(data.data[:, i])),
                "description": f"Measurement of {name}"
            })
        return features
        
    def get_disease_info(self) -> dict:
        data = load_breast_cancer()
        return {
            "id": "breast_cancer",
            "name": "Breast Cancer",
            "description": "Breast cancer diagnostic dataset.",
            "features": self.get_feature_info(),
            "dataset_size": len(data.target),
            "status": "ready"
        }
