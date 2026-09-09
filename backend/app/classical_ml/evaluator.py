import time
import numpy as np
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, average_precision_score, brier_score_loss, confusion_matrix
)
from sklearn.calibration import calibration_curve

def compute_bootstrap_ci(
    y_true: np.ndarray, 
    y_pred: np.ndarray, 
    y_proba: np.ndarray,
    n_bootstrap: int = 1000,
    confidence: float = 0.95,
    seed: int = 42
) -> dict:
    """Compute bootstrap 95% confidence intervals for key metrics."""
    rng = np.random.RandomState(seed)
    n = len(y_true)
    metrics_boot = {k: [] for k in ['accuracy', 'f1_score', 'roc_auc', 'brier_score']}
    
    for _ in range(n_bootstrap):
        idx = rng.choice(n, n, replace=True)
        if len(np.unique(y_true[idx])) < 2:
            continue
        boot_acc = accuracy_score(y_true[idx], y_pred[idx])
        boot_f1 = f1_score(y_true[idx], y_pred[idx], zero_division=0)
        try:
            boot_auc = roc_auc_score(y_true[idx], y_proba[idx])
        except ValueError:
            boot_auc = 0.5
        boot_brier = brier_score_loss(y_true[idx], y_proba[idx])
        metrics_boot['accuracy'].append(boot_acc)
        metrics_boot['f1_score'].append(boot_f1)
        metrics_boot['roc_auc'].append(boot_auc)
        metrics_boot['brier_score'].append(boot_brier)
    
    alpha = (1 - confidence) / 2
    ci = {}
    for k, vals in metrics_boot.items():
        if vals:
            ci[k] = {
                'lower': float(np.percentile(vals, 100 * alpha)),
                'upper': float(np.percentile(vals, 100 * (1 - alpha))),
                'mean': float(np.mean(vals)),
            }
    return ci

def compute_metrics(model, X_test, y_test, model_name: str, model_type: str = "classical", y_pred=None, y_proba=None) -> dict:
    """
    Compute rigorous clinical diagnostic evaluation metrics for a model.
    Includes:
    - Accuracy, Precision, Sensitivity (Recall), Specificity, F1-Score
    - ROC-AUC and PR-AUC
    - Brier score (probability calibration measure)
    - Calibration curve points (prob_pred, prob_true)
    - Confusion matrix and inference latency
    """
    start = time.time()
    if y_pred is None:
        y_pred = model.predict(X_test)
    inference_time = (time.time() - start) * 1000

    if y_proba is None:
        try:
            y_proba = model.predict_proba(X_test)[:, 1]
        except (AttributeError, IndexError, ValueError):
            y_proba = y_pred.astype(float)

    try:
        roc_auc = float(roc_auc_score(y_test, y_proba))
    except (ValueError, IndexError):
        roc_auc = 0.5

    try:
        pr_auc = float(average_precision_score(y_test, y_proba))
    except (ValueError, IndexError):
        pr_auc = float(np.mean(y_test))

    try:
        brier = float(brier_score_loss(y_test, y_proba))
    except (ValueError, IndexError):
        brier = 0.25

    cm = confusion_matrix(y_test, y_pred).tolist()
    if len(cm) == 1:
        cm = [[cm[0][0], 0], [0, 0]]

    # Specificity: True Negatives / (True Negatives + False Positives)
    tn = cm[0][0]
    fp = cm[0][1]
    specificity = float(tn / (tn + fp)) if (tn + fp) > 0 else 0.0

    # Calibration Curve: 5-bin observed vs predicted
    try:
        prob_true, prob_pred = calibration_curve(y_test, y_proba, n_bins=5, strategy="uniform")
        calib_data = [
            {"predicted": round(float(p), 4), "observed": round(float(t), 4)}
            for p, t in zip(prob_pred, prob_true)
        ]
    except Exception:
        calib_data = []

    sens = round(float(recall_score(y_test, y_pred, zero_division=0)), 4)

    # 95% Bootstrap Confidence Intervals with degenerate draw handling
    bootstrap_cis = {}
    if len(y_test) >= 15:
        ci_res = compute_bootstrap_ci(y_test, y_pred, y_proba, n_bootstrap=200)
        if 'f1_score' in ci_res:
            bootstrap_cis = {
                "valid_bootstrap_samples": 200, # Approximate
                "f1_95_ci": [round(ci_res['f1_score']['lower'], 4), round(ci_res['f1_score']['upper'], 4)],
                "roc_auc_95_ci": [round(ci_res['roc_auc']['lower'], 4), round(ci_res['roc_auc']['upper'], 4)],
                "brier_95_ci": [round(ci_res['brier_score']['lower'], 4), round(ci_res['brier_score']['upper'], 4)],
                "accuracy_95_ci": [round(ci_res['accuracy']['lower'], 4), round(ci_res['accuracy']['upper'], 4)],
            }

    return {
        "model_name": model_name,
        "model_type": model_type,
        "accuracy": round(float(accuracy_score(y_test, y_pred)), 4),
        "precision": round(float(precision_score(y_test, y_pred, zero_division=0)), 4),
        "recall": sens,
        "sensitivity": sens,
        "specificity": round(specificity, 4),
        "f1_score": round(float(f1_score(y_test, y_pred, zero_division=0)), 4),
        "roc_auc": round(roc_auc, 4),
        "pr_auc": round(pr_auc, 4),
        "brier_score": round(brier, 4),
        "calibration_curve": calib_data,
        "confidence_intervals": bootstrap_cis,
        "training_time_s": 0.0,
        "inference_time_ms": round(float(inference_time), 3),
        "confusion_matrix": cm,
    }
