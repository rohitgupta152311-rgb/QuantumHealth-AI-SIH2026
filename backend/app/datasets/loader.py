import numpy as np
from app.datasets.diabetes import DiabetesDataset
from app.datasets.heart import HeartDataset
from app.datasets.breast_cancer import BreastCancerDataset

class DatasetLoader:
    def __init__(self):
        self._registry = {
            "diabetes": DiabetesDataset(),
            "heart": HeartDataset(),
            "breast_cancer": BreastCancerDataset()
        }
    
    def load(self, disease_id: str) -> tuple[np.ndarray, np.ndarray, list[str]]:
        if disease_id not in self._registry:
            raise ValueError(f"Dataset for disease {disease_id} not found.")
        return self._registry[disease_id].load()
    
    def get_disease_info(self, disease_id: str) -> dict:
        if disease_id not in self._registry:
            raise ValueError(f"Disease {disease_id} not found.")
        return self._registry[disease_id].get_disease_info()
    
    def list_diseases(self) -> list[dict]:
        return [ds.get_disease_info() for ds in self._registry.values()]

def get_dataset_loader() -> DatasetLoader:
    return DatasetLoader()
