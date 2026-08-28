"""
hybrid_ml package - Hybrid Quantum-Classical ML pipeline.
QuantumHealth AI (SIH 2026 Problem Statement 26139).

Combines classical ML predictions with the quantum VQC output
to produce a consensus disease risk assessment.
"""

from app.hybrid_ml.pipeline import HybridPipeline

__all__ = ["HybridPipeline"]
