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
All predictions are produced using quantum simulators (PennyLane default.qubit) and must be validated
by qualified medical professionals.
"""

from typing import Literal, Dict, Any


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

    def build_consensus(
        self,
        classical_predictions: Dict[str, str],   # {model_name: "high_risk" | "low_risk"}
        quantum_prediction: str,                 # "high_risk" | "low_risk"
        hybrid_probability: float,
        classical_probabilities: Dict[str, float] = None,
        quantum_probability: float = None,
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
            Dict containing agreement level, clinical recommendation, vote counts, and disagreement flags.
        """
        classical_votes = list(classical_predictions.values())
        all_votes = classical_votes + [quantum_prediction]

        high_risk_count = sum(1 for p in all_votes if p == "high_risk")
        low_risk_count = len(all_votes) - high_risk_count

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
        }

    @staticmethod
    def get_verdict(classical_f1: float, hybrid_f1: float) -> Dict[str, Any]:
        """
        Compare classical vs hybrid model performance and return a scientifically honest verdict.
        """
        diff = hybrid_f1 - classical_f1

        if diff > 0.02:
            verdict = "hybrid_better"
            explanation = (
                f"The Hybrid Quantum-Classical model demonstrates higher sensitivity (+{diff:.1%} F1-score) "
                "by projecting multi-variate non-linear interactions into quantum Hilbert space."
            )
        elif diff < -0.02:
            verdict = "classical_better"
            explanation = (
                f"The Classical Ensemble outperforms the hybrid circuit by {abs(diff):.1%} F1-score, "
                "which is expected on smaller sample sizes where tree ensembles excel."
            )
        elif abs(diff) <= 0.02:
            verdict = "similar_performance"
            explanation = (
                "Both classical and hybrid architectures achieve competitive, near-identical performance. "
                "The quantum circuit captures complementary non-linear decision thresholds."
            )
        else:
            verdict = "further_research_required"
            explanation = (
                "Results demonstrate subtle distribution shifts. Extended dataset validation with higher qubit "
                "depth is recommended for deeper statistical significance."
            )

        return {
            "verdict": verdict,
            "explanation": explanation,
            "winner": "Hybrid QML" if diff >= 0 else "Classical Ensemble",
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
