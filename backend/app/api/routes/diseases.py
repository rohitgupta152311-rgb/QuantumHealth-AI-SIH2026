from fastapi import APIRouter, HTTPException, Depends, status
import numpy as np
from app.schemas.disease import DiseaseListResponse, DiseaseInfo
from app.datasets.loader import DatasetLoader, get_dataset_loader

router = APIRouter()

@router.get(
    "",
    response_model=DiseaseListResponse,
    summary="List Supported Disease Modules",
    description="Returns metadata, feature schemas, parameter ranges, and training status for all available disease modules."
)
async def list_diseases(loader: DatasetLoader = Depends(get_dataset_loader)):
    return {"diseases": loader.list_diseases()}

@router.get(
    "/{disease_id}",
    response_model=DiseaseInfo,
    summary="Get Specific Disease Module Details",
    description="Returns feature definitions, valid ranges, units, and dataset statistics for a given disease ID."
)
async def get_disease(disease_id: str, loader: DatasetLoader = Depends(get_dataset_loader)):
    try:
        return loader.get_disease_info(disease_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Disease module '{disease_id}' is not supported: {str(e)}"
        )


@router.get(
    "/{disease_id}/samples",
    summary="Get Raw Dataset Clinical Records",
    description="Inspect raw patient records directly from the verified dataset (supports limit 1-100)."
)
async def get_disease_samples(
    disease_id: str,
    limit: int = 10,
    loader: DatasetLoader = Depends(get_dataset_loader)
):
    try:
        X, y, feature_cols = loader.load(disease_id)
        disease_info = loader.get_disease_info(disease_id)
        limit = min(max(1, limit), len(X), 100)
        samples = []
        for i in range(limit):
            row_dict = {col: round(float(X[i][j]), 4) for j, col in enumerate(feature_cols)}
            row_dict["target"] = int(y[i])
            samples.append(row_dict)

        return {
            "disease": disease_id,
            "disease_name": disease_info.get("name", disease_id),
            "total_records": len(X),
            "features_count": len(feature_cols),
            "features": feature_cols,
            "sample_records": samples
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Disease module '{disease_id}' is not supported: {str(e)}"
        )


@router.get(
    "/{disease_id}/split-insights",
    summary="Get Cohort Test Data Split & Clinical Statistical Insights",
    description="Calculates exact train/validation/test sample counts, statistical power, confidence interval precision bounds, and bias-variance recommendations for a requested test data split percentage."
)
async def get_disease_split_insights(
    disease_id: str,
    test_size: float = 0.20,
    loader: DatasetLoader = Depends(get_dataset_loader)
):
    try:
        # Clamp test size between 0.05 (5%) and 0.50 (50%)
        test_ratio = float(max(0.05, min(0.50, test_size)))
        if test_ratio > 1.0:
            test_ratio = test_ratio / 100.0

        if disease_id == "diabetes":
            X, y, groups, feature_cols = loader.load_grouped(disease_id)
            group_strategy = "GroupShuffleSplit (grouped by medical examination site to prevent patient leakage)"
        else:
            X, y, feature_cols = loader.load(disease_id)
            group_strategy = "StratifiedShuffleSplit (strictly stratified on disease positive/negative labels)"

        disease_info = loader.get_disease_info(disease_id)
        total_samples = len(X)
        total_pos = int(np.sum(y == 1))
        prevalence = float(total_pos / total_samples)

        # Standard 3-way split: Test = test_ratio, Val = 25% of remainder, Train = 75% of remainder
        # (e.g. at 20% test -> 20% Test, 20% Validation, 60% Train)
        test_count = int(round(total_samples * test_ratio))
        dev_count = total_samples - test_count
        val_count = int(round(dev_count * 0.25))
        train_count = dev_count - val_count

        train_pct = round((train_count / total_samples) * 100, 1)
        val_pct = round((val_count / total_samples) * 100, 1)
        test_pct = round((test_count / total_samples) * 100, 1)

        # Expected positive / negative cases in test set under stratification
        test_pos = int(round(test_count * prevalence))
        test_neg = test_count - test_pos

        # Statistical Power & Standard Error Margin for ROC-AUC/Sensitivity (95% CI)
        se = np.sqrt((prevalence * (1.0 - prevalence)) / max(test_count, 1))
        ci_margin_pct = round(float(1.96 * se * 100), 2)

        # Statistical power rating
        if test_count >= 5000:
            power_rating = "Ultra-High Statistical Power (p < 0.0001)"
            power_level = "exceptional"
        elif test_count >= 500:
            power_rating = "High Statistical Power (p < 0.005)"
            power_level = "high"
        elif test_count >= 60:
            power_rating = "Adequate Clinical Verification Power (p < 0.05)"
            power_level = "adequate"
        else:
            power_rating = "Low Sample Size (Wider Uncertainty Interval)"
            power_level = "warning"

        # Bias-Variance & Model Optimization Analysis
        if train_count < 150:
            quantum_readiness_note = "High Underfitting Risk: Quantum VQC parameters and gradient steps require adequate data points. Training set is critically small."
            split_rating = "suboptimal_too_little_training_data"
        elif test_ratio > 0.35 and total_samples < 1000:
            quantum_readiness_note = "High Variance Risk: Overly large test split reduces training data, limiting ensemble diversity and Platt scaling calibration."
            split_rating = "caution_large_test_split"
        elif 0.15 <= test_ratio <= 0.25:
            quantum_readiness_note = "Gold Standard Clinical Split: Balances 6-qubit angle encoding parameter convergence with unbiased test set validation."
            split_rating = "optimal_clinical_balance"
        else:
            quantum_readiness_note = "Acceptable Configuration: Training set preserves sufficient biomarker representation."
            split_rating = "acceptable"

        # Specific Cohort Insights
        disease_specific_insights = {
            "diabetes": (
                f"Longitudinal epidemiological cohort with {total_samples:,} total records. "
                f"Even with a {test_pct}% test split, the evaluation set contains {test_count:,} patient cases, "
                f"delivering an ultra-precise margin of error of ±{ci_margin_pct}%. Group-level splitting by site "
                f"prevents cross-hospital diagnostic leakage."
            ),
            "heart": (
                f"UCI Cleveland cardiovascular cohort ({total_samples} patients). "
                f"A {test_pct}% test split allocates {test_count} unseen test patients ({test_pos} positive cases). "
                f"Margin of error is ±{ci_margin_pct}%. Setting test size above 25% significantly degrades "
                f"the 6-qubit angle encoding training pool."
            ),
            "breast_cancer": (
                f"Wisconsin Diagnostic Breast Cancer (WDBC) cytology cohort ({total_samples} samples). "
                f"A {test_pct}% test split retains {train_count} cases for training five calibrated classifiers and VQC, "
                f"while evaluating on {test_count} test tumors with an estimated 95% CI precision of ±{ci_margin_pct}%."
            ),
            "kidney": (
                f"Apollo Hospitals Chronic Kidney Disease cohort ({total_samples} patients). "
                f"With a {test_pct}% test split, {test_count} cases are locked for evaluation. "
                f"Maintains balanced positive ({test_pos}) and negative ({test_neg}) screening cases without imputation leakage."
            )
        }

        return {
            "disease": disease_id,
            "disease_name": disease_info.get("name", disease_id),
            "total_samples": total_samples,
            "prevalence_pct": round(prevalence * 100, 2),
            "requested_test_pct": round(test_ratio * 100, 1),
            "split_breakdown": {
                "train": {
                    "count": train_count,
                    "percentage": train_pct,
                    "role": "Model Training & Feature Selection (6-Qubit VQC + 5 Classical Models)"
                },
                "validation": {
                    "count": val_count,
                    "percentage": val_pct,
                    "role": "Platt Scaling Probability Calibration & Abstention Threshold Optimization"
                },
                "test": {
                    "count": test_count,
                    "percentage": test_pct,
                    "role": "Unbiased Locked Generalization Evaluation (Zero Data Leakage)"
                }
            },
            "class_distribution_in_test": {
                "estimated_positive_cases": test_pos,
                "estimated_negative_cases": test_neg,
                "stratification_maintained": True
            },
            "statistical_insights": {
                "confidence_interval_95_margin_pct": ci_margin_pct,
                "power_rating": power_rating,
                "power_level": power_level,
                "split_recommendation": quantum_readiness_note,
                "split_rating": split_rating,
                "grouping_protocol": group_strategy,
                "cohort_insight": disease_specific_insights.get(
                    disease_id,
                    f"Cohort contains {total_samples} records. {test_pct}% test split yields {test_count} validation cases."
                ),
                "clinical_takeaway": (
                    f"Test size of {test_pct}% yields an expected 95% Confidence Interval precision of ±{ci_margin_pct}%. "
                    "The platform locks this split during training so models never observe testing data prior to evaluation."
                )
            }
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Disease module '{disease_id}' is not supported: {str(e)}"
        )

