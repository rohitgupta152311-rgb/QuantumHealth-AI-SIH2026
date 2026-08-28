import numpy as np

class HeartDataset:
    def load(self) -> tuple[np.ndarray, np.ndarray, list[str]]:
        np.random.seed(42)
        n_samples = 303
        
        age = np.random.randint(29, 78, n_samples)
        sex = np.random.randint(0, 2, n_samples)
        cp = np.random.randint(0, 4, n_samples)
        trestbps = np.random.normal(131, 17, n_samples).clip(94, 200)
        chol = np.random.normal(246, 51, n_samples).clip(126, 564)
        fbs = np.random.randint(0, 2, n_samples)
        restecg = np.random.randint(0, 3, n_samples)
        thalach = np.random.normal(149, 23, n_samples).clip(71, 202)
        exang = np.random.randint(0, 2, n_samples)
        oldpeak = np.random.exponential(1.0, n_samples).clip(0, 6.2)
        slope = np.random.randint(0, 3, n_samples)
        ca = np.random.randint(0, 5, n_samples)
        thal = np.random.randint(0, 4, n_samples)
        
        X = np.column_stack([age, sex, cp, trestbps, chol, fbs, restecg, thalach, exang, oldpeak, slope, ca, thal])
        
        # Synthetic target based on features
        risk = (age/78)*0.2 + (cp/3)*0.3 + (trestbps/200)*0.1 + (chol/564)*0.1 - (thalach/202)*0.2 + exang*0.1
        y = (risk + np.random.normal(0, 0.1, n_samples) > 0.25).astype(int)
        
        feature_names = ["age", "sex", "cp", "trestbps", "chol", "fbs", "restecg", "thalach", "exang", "oldpeak", "slope", "ca", "thal"]
        return X, y, feature_names
    
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
        return {
            "id": "heart",
            "name": "Heart Disease",
            "description": "Heart disease risk prediction based on clinical data.",
            "features": self.get_feature_info(),
            "dataset_size": 303,
            "status": "ready"
        }
