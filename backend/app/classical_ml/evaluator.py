import time
import numpy as np
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix

def compute_metrics(model, X_test, y_test, model_name: str, model_type: str = "classical") -> dict:
    """
    Compute comprehensive clinical diagnostic evaluation metrics for a model.
    Includes Accuracy, Precision, Sensitivity (Recall), F1 Score, ROC-AUC, and Confusion Matrix.
    """
    start = time.time()
    y_pred = model.predict(X_test)
    inference_time = (time.time() - start) * 1000
    
    try:
        y_proba = model.predict_proba(X_test)[:, 1]
        roc_auc = float(roc_auc_score(y_test, y_proba))
    except (AttributeError, IndexError, ValueError):
        roc_auc = 0.5
        
    cm = confusion_matrix(y_test, y_pred).tolist()
    if len(cm) == 1:
        # Edge case: only 1 class in test slice
        cm = [[cm[0][0], 0], [0, 0]]
    
    return {
        "model_name": model_name,
        "model_type": model_type,
        "accuracy": round(float(accuracy_score(y_test, y_pred)), 4),
        "precision": round(float(precision_score(y_test, y_pred, zero_division=0)), 4),
        "recall": round(float(recall_score(y_test, y_pred, zero_division=0)), 4),
        "f1_score": round(float(f1_score(y_test, y_pred, zero_division=0)), 4),
        "roc_auc": round(roc_auc, 4),
        "training_time_s": 0.0,  # Recorded during training loop
        "inference_time_ms": round(float(inference_time), 3),
        "confusion_matrix": cm,
    }
