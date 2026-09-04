import os
import time
from pathlib import Path
import numpy as np
from app.classical_ml.random_forest import RandomForestModel
from app.classical_ml.svm import SVMModel
from app.classical_ml.logistic_regression import LogisticRegressionModel
from app.classical_ml.evaluator import compute_metrics

class ClassicalMLTrainer:
    """Trains and manages classical ML models for a disease."""
    
    def __init__(self, disease_id: str, models_cache_dir: Path):
        self.disease_id = disease_id
        self.models_cache_dir = models_cache_dir
        self.models = {
            "RandomForest": RandomForestModel(),
            "SVM": SVMModel(),
            "LogisticRegression": LogisticRegressionModel()
        }
        self._trained = False
        self._metrics = []
    
    def _get_model_path(self, model_name: str) -> Path:
        return self.models_cache_dir / f"{self.disease_id}_{model_name}.pkl"
    
    def train(self, X_train, y_train, X_test, y_test, feature_names) -> list[dict]:
        """Train models and return metrics."""
        self._metrics = []
        for name, model in self.models.items():
            start = time.time()
            model.fit(X_train, y_train)
            train_time = time.time() - start
            
            # Save
            model.save(str(self._get_model_path(name)))
            
            # Evaluate
            metrics = compute_metrics(model, X_test, y_test, model_name=name)
            metrics["training_time_s"] = float(train_time)
            self._metrics.append(metrics)
            
        self._trained = True
        return self._metrics
    
    def predict_single(self, X: np.ndarray) -> list[dict]:
        """Run all trained models on a single sample."""
        if not self._trained:
            raise RuntimeError("Models not trained")

        results = []
        for name, model in self.models.items():
            pred_int = int(model.predict(X)[0])
            try:
                proba = float(model.predict_proba(X)[0][1])
            except (AttributeError, IndexError):
                proba = 1.0 if pred_int == 1 else 0.0

            pred_str = "high_risk" if pred_int == 1 else "low_risk"
            confidence = abs(proba - 0.5) * 2  # 0=uncertain, 1=confident

            results.append({
                "model_name": name,
                "risk_probability": proba,
                "prediction": pred_str,
                "confidence": round(confidence, 4),
            })
        return results

    
    def get_feature_importance(self, feature_names: list[str]) -> dict[str, float]:
        if not self._trained:
            return {}
        return self.models["RandomForest"].get_feature_importance(feature_names)
    
    def load_or_train(self, X_train, y_train, X_test, y_test, feature_names: list[str]) -> None:
        """Load cached models or train fresh."""
        all_loaded = True
        for name, model in self.models.items():
            path = self._get_model_path(name)
            if path.exists():
                try:
                    model.load(str(path))
                except Exception:
                    all_loaded = False
                    break
            else:
                all_loaded = False
                break
                
        if all_loaded:
            self._trained = True
            # Compute metrics on representative test sample (< 1000 samples for high speed)
            self._metrics = []
            if len(X_test) > 1000:
                rng = np.random.RandomState(42)
                sub_idx = rng.choice(len(X_test), size=1000, replace=False)
                eval_X, eval_y = X_test[sub_idx], y_test[sub_idx]
            else:
                eval_X, eval_y = X_test, y_test

            for name, model in self.models.items():
                metrics = compute_metrics(model, eval_X, eval_y, model_name=name)
                self._metrics.append(metrics)
        else:
            self.train(X_train, y_train, X_test, y_test, feature_names)

            
    def get_model_metrics(self) -> list[dict]:
        return self._metrics
