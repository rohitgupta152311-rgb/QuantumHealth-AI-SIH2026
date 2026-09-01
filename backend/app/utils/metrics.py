"""Model evaluation metrics"""
import numpy as np
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, 
    f1_score, roc_auc_score, confusion_matrix
)
from typing import Dict, Optional

def evaluate_model(model, X_test, y_test) -> Dict:
    """Evaluate model performance"""
    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1]
    
    return {
        'accuracy': float(accuracy_score(y_test, y_pred)),
        'precision': float(precision_score(y_test, y_pred, zero_division=0)),
        'recall': float(recall_score(y_test, y_pred, zero_division=0)),
        'f1_score': float(f1_score(y_test, y_pred, zero_division=0)),
        'auc_roc': float(roc_auc_score(y_test, y_proba)),
        'confusion_matrix': confusion_matrix(y_test, y_pred).tolist()
    }

def evaluate_model_safe(model, X_test, y_test) -> Dict:
    """Evaluate model performance, safe for single-class cases where AUC-ROC cannot be computed"""
    y_pred = model.predict(X_test)
    
    metrics = {
        'accuracy': float(accuracy_score(y_test, y_pred)),
        'precision': float(precision_score(y_test, y_pred, zero_division=0)),
        'recall': float(recall_score(y_test, y_pred, zero_division=0)),
        'f1_score': float(f1_score(y_test, y_pred, zero_division=0)),
        'confusion_matrix': confusion_matrix(y_test, y_pred).tolist()
    }
    
    if len(np.unique(y_test)) < 2:
        metrics['auc_roc'] = None
    else:
        try:
            y_proba = model.predict_proba(X_test)[:, 1]
            auc = roc_auc_score(y_test, y_proba)
            metrics['auc_roc'] = None if (auc is None or np.isnan(auc)) else float(auc)
        except (ValueError, IndexError):
            metrics['auc_roc'] = None
        
    return metrics

def get_model_comparison(classical_metrics: Dict, quantum_metrics: Dict, hybrid_metrics: Dict) -> Dict:
    """
    Compare classical, quantum, and hybrid models.
    This reports real evaluated metrics only, with no artificial boosts.
    """
    metrics_keys = ['accuracy', 'precision', 'recall', 'f1_score', 'auc_roc']
    improvement = {}
    
    for k in metrics_keys:
        val_c = classical_metrics.get(k)
        val_h = hybrid_metrics.get(k)
        if val_c is not None and val_h is not None:
            improvement[k] = val_h - val_c
            
    return {
        'classical': classical_metrics,
        'quantum': quantum_metrics,
        'hybrid': hybrid_metrics,
        'improvement': improvement
    }
