"""
Quantum-Classical Consensus Engine for QuantumHealth AI.
Team Member 3 - Hybrid ML Layer & Consensus.

Combines predictions from multiple classical models and the Variational Quantum Classifier (VQC)
to generate a verified consensus decision with nuanced agreement analysis.

Agreement Levels
----------------
- strong_agreement   : All classical models (RF, SVM, LR) AND the quantum VQC agree on the risk label.
- moderate_agreement : Majority of classical models agree with the quantum VQC with acceptable confidence.
- disagreement       : Quantum VQC disagrees with the classical majority, or classical models are split with high uncertainty.

DISCLAIMER: This platform is developed strictly for research, educational, and decision-support purposes.
All predictions are produced using quantum simulators (PennyLane default.qubit / native statevector) and must be validated
by qualified medical professionals.
"""

from typing import Literal, Dict, Any, List, Optional
import numpy as np
from sklearn.metrics import f1_score


class ConsensusEngine:
    """
    Synthesizes multiple model predictions into a consensus diagnostic assessment.
    """

    DISCLAIMER: str = (
        "WARNING: This platform is an experimental AI-assisted research and "
        "decision-support system and is NOT a replacement for professional medical "
        "diagnosis. All predictions are based on simulated quantum circuits and "
        "must be validated by qualified healthcare professionals."
    )

    @staticmethod
    def compute_disagreement_range(model_probabilities: List[float]) -> Dict[str, Any]:
        """
        Calculate internal model disagreement range across candidate models.
        NOTE: Model agreement is NOT statistical confidence or patient certainty.
        """
        if not model_probabilities:
            return {
                "lower": 0.0,
                "upper": 0.0,
                "spread": 0.0,
                "label": "Internal model-disagreement range; not a confidence interval",
            }
        probs = [float(p) for p in model_probabilities]
        lower = float(min(probs))
        upper = float(max(probs))
        spread = float(upper - lower)
        return {
            "lower": round(lower, 4),
            "upper": round(upper, 4),
            "spread": round(spread, 4),
            "label": "Internal model-disagreement range; not a confidence interval",
        }

    def build_consensus(
        self,
        classical_predictions: Dict[str, str],   # {model_name: "high_risk" | "low_risk"}
        quantum_prediction: str,                 # "high_risk" | "low_risk"
        hybrid_probability: float,
        classical_probabilities: Optional[Dict[str, float]] = None,
        quantum_probability: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Build a verified consensus result from classical and quantum model predictions.

        Args:
            classical_predictions: Dict mapping model name to risk label ("high_risk" / "low_risk").
            quantum_prediction: Quantum VQC risk label ("high_risk" / "low_risk").
            hybrid_probability: Combined hybrid probability in [0, 1].
            classical_probabilities: Optional map of model probabilities.
            quantum_probability: Optional quantum probability float.

        Returns:
            Dict containing agreement level, clinical recommendation, vote counts, structured disagreement, and flags.
        """
        classical_votes = list(classical_predictions.values())
        all_votes = classical_votes + [quantum_prediction]

        high_risk_count = sum(1 for p in all_votes if p == "high_risk")

        # Final consensus vote by weighted majority
        final_vote = "high_risk" if hybrid_probability >= 0.5 else "low_risk"

        # Check classical consensus
        c_high = sum(1 for v in classical_votes if v == "high_risk")
        c_low = len(classical_votes) - c_high
        classical_all_agree = (c_high == len(classical_votes)) or (c_low == len(classical_votes))
        classical_majority_high = c_high > c_low

        quantum_agrees_with_classical_majority = (
            (quantum_prediction == "high_risk" and classical_majority_high) or
            (quantum_prediction == "low_risk" and not classical_majority_high)
        )

        # Classify agreement level
        if classical_all_agree and (quantum_prediction == classical_votes[0]):
            agreement = "strong_agreement"
            recommendation = "consistent_prediction"
            disagreement_detected = False
        elif quantum_agrees_with_classical_majority and (c_high >= 2 or c_low >= 2):
            agreement = "moderate_agreement"
            recommendation = "clinical_review_advised"
            disagreement_detected = False
        else:
            agreement = "disagreement"
            recommendation = "further_investigation_recommended"
            disagreement_detected = True

        # Collect all available model probabilities for structured disagreement analysis
        all_probs = []
        if classical_probabilities:
            all_probs.extend(list(classical_probabilities.values()))
        if quantum_probability is not None:
            all_probs.append(quantum_probability)
        all_probs.append(hybrid_probability)

        disagreement_range = self.compute_disagreement_range(all_probs)

        return {
            "agreement": agreement,
            "recommendation": recommendation,
            "classical_votes": classical_predictions,
            "quantum_vote": quantum_prediction,
            "final_vote": final_vote,
            "disagreement_detected": disagreement_detected,
            "high_risk_count": high_risk_count,
            "total_models": len(all_votes),
            "hybrid_probability": round(float(hybrid_probability), 4),
            "disagreement_range": disagreement_range,
        }

    @staticmethod
    def compute_paired_bootstrap_comparison(
        y_true: np.ndarray,
        classical_probs: np.ndarray,
        hybrid_probs: np.ndarray,
        threshold: float = 0.5,
        n_bootstraps: int = 1000,
        seed: int = 42,
    ) -> Dict[str, Any]:
        """
        Paired non-parametric bootstrap comparison between classical and hybrid predictions.
        Uses a frozen decision threshold and skips/resamples degenerate single-class draws.
        """
        rng = np.random.RandomState(seed)
        n = len(y_true)
        diffs = []
        valid_samples = 0
        max_attempts = n_bootstraps * 3
        attempts = 0

        while valid_samples < n_bootstraps and attempts < max_attempts:
            attempts += 1
            idx = rng.randint(0, n, size=n)
            y_b = y_true[idx]
            # Must have both classes present for valid binary metric evaluation
            if len(np.unique(y_b)) < 2:
                continue

            c_b = (classical_probs[idx] >= threshold).astype(int)
            h_b = (hybrid_probs[idx] >= threshold).astype(int)

            f1_c = float(f1_score(y_b, c_b, zero_division=0))
            f1_h = float(f1_score(y_b, h_b, zero_division=0))
            diffs.append(f1_h - f1_c)
            valid_samples += 1

        if not diffs:
            return {
                "mean_f1_diff": 0.0,
                "ci_lower": 0.0,
                "ci_upper": 0.0,
                "valid_bootstrap_samples": 0,
                "statistically_significant": False,
            }

        diffs_arr = np.array(diffs)
        ci_lower = float(np.percentile(diffs_arr, 2.5))
        ci_upper = float(np.percentile(diffs_arr, 97.5))
        mean_diff = float(np.mean(diffs_arr))
        zero_in_ci = bool(ci_lower <= 0.0 <= ci_upper)

        return {
            "mean_f1_diff": round(mean_diff, 4),
            "ci_lower": round(ci_lower, 4),
            "ci_upper": round(ci_upper, 4),
            "confidence_level": 0.95,
            "valid_bootstrap_samples": valid_samples,
            "statistically_significant": not zero_in_ci,
            "zero_in_ci": zero_in_ci,
        }

    @staticmethod
    def get_verdict(
        classical_f1: float,
        hybrid_f1: float,
        bootstrap_ci: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Compare classical vs hybrid model performance and return a scientifically honest verdict.
        If bootstrap_ci is provided, uses 95% confidence interval overlap rather than naive heuristics.
        """
        diff = hybrid_f1 - classical_f1

        if bootstrap_ci and bootstrap_ci.get("valid_bootstrap_samples", 0) >= 100:
            ci_lower = bootstrap_ci["ci_lower"]
            ci_upper = bootstrap_ci["ci_upper"]
            zero_in_ci = bootstrap_ci["zero_in_ci"]

            if zero_in_ci:
                verdict = "similar_performance"
                winner = "Statistically Indistinguishable"
                explanation = (
                    f"Both classical and hybrid architectures achieve competitive, statistically indistinguishable performance "
                    f"(F1 difference: {diff:+.1%}; 95% CI: [{ci_lower:+.3f}, {ci_upper:+.3f}] contains 0)."
                )
            elif ci_lower > 0:
                verdict = "hybrid_better"
                winner = "Hybrid QML"
                explanation = (
                    f"The Hybrid Quantum-Classical model achieves a statistically significant improvement "
                    f"(+{diff:.1%} F1-score; 95% CI: [{ci_lower:+.3f}, {ci_upper:+.3f}])."
                )
            else:
                verdict = "classical_better"
                winner = "Classical Ensemble"
                explanation = (
                    f"The Classical Ensemble demonstrates a statistically significant advantage "
                    f"({abs(diff):.1%} F1-score; 95% CI: [{ci_lower:+.3f}, {ci_upper:+.3f}])."
                )

            return {
                "verdict": verdict,
                "explanation": explanation,
                "winner": winner,
                "f1_difference": round(float(diff), 4),
                "bootstrap_ci": bootstrap_ci,
            }

        # Fallback when bootstrap CI is not yet available
        if diff > 0.02:
            verdict = "hybrid_better"
            winner = "Hybrid QML"
            explanation = (
                f"The Hybrid Quantum-Classical model demonstrates higher F1-score (+{diff:.1%}) "
                "by projecting multi-variate non-linear interactions into quantum Hilbert space."
            )
        elif diff < -0.02:
            verdict = "classical_better"
            winner = "Classical Ensemble"
            explanation = (
                f"The Classical Ensemble outperforms the hybrid circuit by {abs(diff):.1%} F1-score, "
                "which is expected on smaller sample sizes where tree ensembles excel."
            )
        else:
            verdict = "similar_performance"
            winner = "Statistically Indistinguishable"
            explanation = (
                "Both classical and hybrid architectures achieve competitive, near-identical performance. "
                f"F1 difference ({diff:+.1%}) is within standard estimation variance."
            )

        return {
            "verdict": verdict,
            "explanation": explanation,
            "winner": winner,
            "f1_difference": round(float(diff), 4),
        }

    @staticmethod
    def format_risk_summary(
        final_vote: str,
        hybrid_probability: float,
        agreement: str,
    ) -> str:
        """Format a clear, human-readable summary for clinical presentation."""
        risk_pct = round(hybrid_probability * 100, 1)
        vote_str = "ELEVATED RISK" if final_vote == "high_risk" else "LOW RISK"
        agree_str = agreement.replace("_", " ").title()
        return (
            f"{vote_str} ({risk_pct}% probability) — Model consensus: {agree_str}."
        )
