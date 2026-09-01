from pathlib import Path
import numpy as np
import pandas as pd

class HeartDataset:
    """Loads the validated real heart-disease CSV prepared for this project."""

    _DATASET_FILE = Path(__file__).resolve().parents[2] / "heart_training_data.csv"
    _FEATURE_NAMES = [
        "age", "sex", "cp", "trestbps", "chol", "fbs", "restecg",
        "thalach", "exang", "oldpeak", "slope", "ca", "thal"
    ]

    def load(self) -> tuple[np.ndarray, np.ndarray, list[str]]:
        if not self._DATASET_FILE.exists():
            raise FileNotFoundError(
                "Real heart training data was not found. Expected "
                f"'{self._DATASET_FILE}'. Create and validate "
                "heart_training_data.csv before training."
            )

        df = pd.read_csv(self._DATASET_FILE)
        required_columns = self._FEATURE_NAMES + ["label"]
        missing_columns = [c for c in required_columns if c not in df.columns]
        if missing_columns:
            raise ValueError(
                "The heart training CSV is missing required columns: "
                f"{missing_columns}"
            )

        X = df[self._FEATURE_NAMES].to_numpy(dtype=float)
        y = df["label"].to_numpy(dtype=int)
        return X, y, self._FEATURE_NAMES.copy()
    
    def get_feature_info(self) -> list[dict]:
        return [
            {"name": "age", "label": "Age", "unit": "years", "min_val": 29, "max_val": 77, "description": "Age in years"},
            {"name": "sex", "label": "Sex", "unit": None, "min_val": 0, "max_val": 1, "description": "1 = male; 0 = female"},
            {"name": "cp", "label": "Chest Pain Type", "unit": None, "min_val": 0, "max_val": 3, "description": "Chest pain type"},
            {"name": "trestbps", "label": "Resting Blood Pressure", "unit": "mm Hg", "min_val": 94, "max_val": 200, "description": "Resting blood pressure"},
            {"name": "chol", "label": "Serum Cholestoral", "unit": "mg/dl", "min_val": 126, "max_val": 564, "description": "Serum cholestoral in mg/dl"},
            {"name": "fbs", "label": "Fasting Blood Sugar > 120 mg/dl", "unit": None, "min_val": 0, "max_val": 1, "description": "Fasting blood sugar"},
            {"name": "restecg", "label": "Resting ECG Results", "unit": None, "min_val": 0, "max_val": 2, "description": "Resting electrocardiographic results"},
            {"name": "thalach", "label": "Max Heart Rate", "unit": None, "min_val": 71, "max_val": 202, "description": "Maximum heart rate achieved"},
            {"name": "exang", "label": "Exercise Induced Angina", "unit": None, "min_val": 0, "max_val": 1, "description": "Exercise induced angina"},
            {"name": "oldpeak", "label": "ST Depression", "unit": None, "min_val": 0, "max_val": 6.2, "description": "ST depression induced by exercise"},
            {"name": "slope", "label": "Slope of Peak Exercise ST Segment", "unit": None, "min_val": 0, "max_val": 2, "description": "Slope of the peak exercise ST segment"},
            {"name": "ca", "label": "Number of Major Vessels", "unit": None, "min_val": 0, "max_val": 4, "description": "Number of major vessels colored by flourosopy"},
            {"name": "thal", "label": "Thal", "unit": None, "min_val": 0, "max_val": 3, "description": "0 = normal; 1 = fixed defect; 2 = reversable defect"}
        ]
        
    def get_disease_info(self) -> dict:
        dataset_size = 0
        if self._DATASET_FILE.exists():
            dataset_size = len(pd.read_csv(self._DATASET_FILE))
        return {
            "id": "heart",
            "name": "Heart Disease",
            "description": "Heart disease risk prediction based on clinical data.",
            "features": self.get_feature_info(),
            "dataset_size": dataset_size,
            "status": "ready"
        }
