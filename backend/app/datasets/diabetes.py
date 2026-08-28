import numpy as np

class DiabetesDataset:
    def load(self) -> tuple[np.ndarray, np.ndarray, list[str]]:
        np.random.seed(42)
        n_samples = 768
        
        pregnancies = np.random.randint(0, 18, n_samples)
        glucose = np.random.normal(120, 30, n_samples).clip(0, 200)
        blood_pressure = np.random.normal(69, 19, n_samples).clip(0, 122)
        skin_thickness = np.random.normal(20, 15, n_samples).clip(0, 99)
        insulin = np.random.exponential(80, n_samples).clip(0, 846)
        bmi = np.random.normal(32, 7, n_samples).clip(0, 67.1)
        dpf = np.random.lognormal(-0.7, 0.5, n_samples).clip(0.078, 2.42)
        age = np.random.randint(21, 81, n_samples)
        
        X = np.column_stack([pregnancies, glucose, blood_pressure, skin_thickness, insulin, bmi, dpf, age])
        
        # Create a realistic target based on features
        risk = (glucose / 200) * 0.4 + (bmi / 67) * 0.3 + (age / 80) * 0.2 + (dpf / 2.5) * 0.1
        y = (risk + np.random.normal(0, 0.1, n_samples) > 0.45).astype(int)
        
        feature_names = ["Pregnancies", "Glucose", "BloodPressure", "SkinThickness", "Insulin", "BMI", "DiabetesPedigreeFunction", "Age"]
        return X, y, feature_names
    
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
        return {
            "id": "diabetes",
            "name": "Type 2 Diabetes",
            "description": "Predicting the onset of diabetes based on diagnostic measures.",
            "features": self.get_feature_info(),
            "dataset_size": 768,
            "status": "ready"
        }
