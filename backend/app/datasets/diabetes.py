from pathlib import Path
import numpy as np
import pandas as pd

class DiabetesDataset:
    """Loads the validated real diabetes CSV prepared for this project."""

    _DATASET_FILE = Path(__file__).resolve().parents[2] / "diabetes_training_data.csv"
    _FEATURE_NAMES = [
        "Pregnancies", "Glucose", "BloodPressure", "SkinThickness",
        "Insulin", "BMI", "DiabetesPedigreeFunction", "Age"
    ]

    def load(self) -> tuple[np.ndarray, np.ndarray, list[str]]:
        if not self._DATASET_FILE.exists():
            raise FileNotFoundError(
                "Real diabetes training data was not found. Expected "
                f"'{self._DATASET_FILE}'. Create and validate "
                "diabetes_training_data.csv before training."
            )

        df = pd.read_csv(self._DATASET_FILE)
        required_columns = self._FEATURE_NAMES + ["label"]
        missing_columns = [c for c in required_columns if c not in df.columns]
        if missing_columns:
            raise ValueError(
                "The diabetes training CSV is missing required columns: "
                f"{missing_columns}"
            )

        X = df[self._FEATURE_NAMES].to_numpy(dtype=float)
        y = df["label"].to_numpy(dtype=int)
        return X, y, self._FEATURE_NAMES.copy()
    
    def get_feature_info(self) -> list[dict]:
        return [
            {"name": "Pregnancies", "label": "Pregnancies", "unit": None, "min_val": 0, "max_val": 17, "description": "Number of times pregnant"},
            {"name": "Glucose", "label": "Glucose Level", "unit": "mg/dL", "min_val": 0, "max_val": 200, "description": "Plasma glucose concentration"},
            {"name": "BloodPressure", "label": "Blood Pressure", "unit": "mm Hg", "min_val": 0, "max_val": 122, "description": "Diastolic blood pressure"},
            {"name": "SkinThickness", "label": "Skin Thickness", "unit": "mm", "min_val": 0, "max_val": 99, "description": "Triceps skin fold thickness"},
            {"name": "Insulin", "label": "Insulin", "unit": "mu U/ml", "min_val": 0, "max_val": 846, "description": "2-Hour serum insulin"},
            {"name": "BMI", "label": "BMI", "unit": "kg/m²", "min_val": 0.0, "max_val": 67.1, "description": "Body mass index"},
            {"name": "DiabetesPedigreeFunction", "label": "Pedigree Function", "unit": None, "min_val": 0.078, "max_val": 2.42, "description": "Diabetes pedigree function"},
            {"name": "Age", "label": "Age", "unit": "years", "min_val": 21, "max_val": 81, "description": "Age in years"}
        ]
    
    def get_disease_info(self) -> dict:
        dataset_size = 0
        if self._DATASET_FILE.exists():
            dataset_size = len(pd.read_csv(self._DATASET_FILE))
        return {
            "id": "diabetes",
            "name": "Type 2 Diabetes",
            "description": "Predicting the onset of diabetes based on diagnostic measures.",
            "features": self.get_feature_info(),
            "dataset_size": dataset_size,
            "status": "ready"
        }
