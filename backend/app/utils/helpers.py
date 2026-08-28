def risk_level_from_probability(prob: float) -> str:
    if prob < 0.3: return "low"
    elif prob < 0.5: return "moderate"
    elif prob < 0.7: return "high"
    else: return "very_high"

def normalize_importance_scores(scores: dict[str, float]) -> dict[str, float]:
    """Normalize to 0-1."""
    total = sum(scores.values())
    if total == 0:
        return scores
    return {k: v / total for k, v in scores.items()}

def build_processing_steps(status_map: dict[str, str]) -> list[dict]:
    """Build list of ProcessingStep dicts."""
    steps = [
        "Biomedical data received",
        "Data cleaned and validated",
        "Features normalized",
        "Important features selected",
        "Classical ML analysis",
        "Features encoded into quantum states",
        "Quantum circuit executed",
        "Hybrid model prediction",
        "Disease risk calculated"
    ]
    return [{"step": i+1, "name": s, "status": status_map.get(str(i+1), "completed"), "detail": None} for i, s in enumerate(steps)]
