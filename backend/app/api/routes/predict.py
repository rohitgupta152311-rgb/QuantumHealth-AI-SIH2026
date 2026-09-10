import logging
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from app.schemas.prediction import (
    PredictionRequest, PredictionResponse,
    BatchPredictionRequest, BatchPredictionResponse, BatchPatientResult
)
from app.services.prediction_service import PredictionService
from app.services.firebase_service import firebase_service
from app.datasets.loader import get_dataset_loader, DatasetLoader
from app.core.config import settings

logger = logging.getLogger("quantumhealth.api.predict")
router = APIRouter()

_global_prediction_service = None

def get_prediction_service() -> PredictionService:
    global _global_prediction_service
    if _global_prediction_service is None:
        loader = get_dataset_loader()
        _global_prediction_service = PredictionService(loader, settings.models_cache_dir)
    return _global_prediction_service


@router.post(
    "",
    response_model=PredictionResponse,
    status_code=status.HTTP_200_OK,
    summary="Execute Calibrated Hybrid Quantum-Classical Disease Prediction",
    description=(
        "Ingests patient biomarker features, validates disease schema, "
        "checks out-of-distribution & missing sentinels, executes calibrated classical ensemble and "
        "PennyLane 6-qubit VQC simulation, and returns calibrated consensus risk or safe abstention."
    )
)
async def predict(
    request: PredictionRequest,
    background_tasks: BackgroundTasks,
    service: PredictionService = Depends(get_prediction_service),
    loader: DatasetLoader = Depends(get_dataset_loader)
):
    try:
        disease_info = loader.get_disease_info(request.disease)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Disease module '{request.disease}' not found: {str(e)}"
        )

    valid_feature_names = {f["name"] for f in disease_info["features"]}

    # Check for unknown or unexpected features
    normalized_features = {}
    warnings_list = []
    for key, val in request.features.items():
        if key in valid_feature_names:
            normalized_features[key] = val
        else:
            # Check alias (e.g. 'error radius' <-> 'radius error')
            alias = None
            if key.startswith("error "):
                alias = key[6:] + " error"
            elif key.endswith(" error"):
                alias = "error " + key[:-6]
            elif key in ("Glucose", "FPG") and "FPG_mg_dL" in valid_feature_names:
                alias = "FPG_mg_dL"
            elif key in ("BloodPressure", "DBP") and "DBP_mmHg" in valid_feature_names:
                alias = "DBP_mmHg"
            elif key in ("SystolicBP", "SBP") and "SBP_mmHg" in valid_feature_names:
                alias = "SBP_mmHg"
            elif key in ("Cholesterol", "TotalCholesterol") and "Cholesterol_mmol_L" in valid_feature_names:
                alias = "Cholesterol_mmol_L"
            elif key in ("Triglyceride", "Triglycerides") and "Triglyceride_mmol_L" in valid_feature_names:
                alias = "Triglyceride_mmol_L"
            elif key in ("ALT", "SGPT") and "ALT_UL" in valid_feature_names:
                alias = "ALT_UL"
            elif key in ("CCR", "Creatinine") and "CCR_umol_L" in valid_feature_names:
                alias = "CCR_umol_L"
            elif key in ("FamilyHistory", "family_history") and "family_history_of_diabetes" in valid_feature_names:
                alias = "family_history_of_diabetes"
            elif key in ("Pregnancies", "SkinThickness", "Insulin", "DiabetesPedigreeFunction"):
                # Legacy Pima fields: EXPLICITLY IGNORED WITH WARNING, NEVER REMAPPED!
                warnings_list.append(
                    f"Legacy Pima biomarker '{key}' is deprecated and ignored under longitudinal cohort schema. Not remapped."
                )
                continue

            if alias and alias in valid_feature_names:
                normalized_features[alias] = val
            else:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Unknown or unexpected feature provided: '{key}' for disease '{request.disease}'."
                )

    # Fill optional non-specified features with median baseline for partial profiles
    for f in disease_info["features"]:
        name = f["name"]
        if name not in normalized_features or normalized_features[name] is None:
            min_v = f.get("min_val", 0.0) if f.get("min_val") is not None else 0.0
            max_v = f.get("max_val", 100.0) if f.get("max_val") is not None else 100.0
            normalized_features[name] = round((min_v + max_v) / 2.0, 4)

    try:
        logger.info(f"Executing prediction for disease '{request.disease}' with mode '{request.mode}'")
        result = await service.predict(request.disease, normalized_features, mode=request.mode)
        if warnings_list:
            existing_warn = result.get("warnings", [])
            result["warnings"] = list(set(existing_warn + warnings_list))
        result["cohort"] = disease_info.get("cohort_name", disease_info.get("display_name"))
        result["schema_version"] = disease_info.get("schema_version", "v1.0")
        result["prediction_horizon"] = disease_info.get("prediction_horizon", "Cross-Sectional Evaluation")
        result["population_limitation"] = disease_info.get(
            "population_limitation",
            "Evaluated on reference training cohort; not validated across all demographic populations."
        )
        # Asynchronously sync prediction to Firebase Firestore audit store
        background_tasks.add_task(firebase_service.save_prediction, result)
        return result
    except Exception as e:
        logger.error(f"Prediction error for {request.disease}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Diagnostic pipeline execution failed: {str(e)}"
        )


@router.post(
    "/batch",
    response_model=BatchPredictionResponse,
    status_code=status.HTTP_200_OK,
    summary="Execute Batch Patient Triage Screening",
    description="Processes multiple patient biomarker profiles in bulk, returning risk stratification, data quality alerts, and triage urgency."
)
async def predict_batch(
    request: BatchPredictionRequest,
    background_tasks: BackgroundTasks,
    service: PredictionService = Depends(get_prediction_service),
    loader: DatasetLoader = Depends(get_dataset_loader)
):
    try:
        disease_info = loader.get_disease_info(request.disease)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Disease module '{request.disease}' not found: {str(e)}"
        )

    valid_feature_names = {f["name"] for f in disease_info["features"]}
    results: List[BatchPatientResult] = []
    summary_counts = {
        "urgent_followup": 0,
        "moderate_monitoring": 0,
        "routine_screening": 0,
        "data_quality_alert": 0,
    }

    manifest_hash = None

    for idx, item in enumerate(request.patients):
        pid = item.patient_id or f"PT-{idx+1:04d}"
        normalized = {}
        for k, v in item.features.items():
            if k in valid_feature_names:
                normalized[k] = float(v)
            else:
                if k in ("Glucose", "FPG") and "FPG_mg_dL" in valid_feature_names:
                    normalized["FPG_mg_dL"] = float(v)
                elif k in ("BloodPressure", "DBP") and "DBP_mmHg" in valid_feature_names:
                    normalized["DBP_mmHg"] = float(v)
                elif k in ("SystolicBP", "SBP") and "SBP_mmHg" in valid_feature_names:
                    normalized["SBP_mmHg"] = float(v)
                elif k in ("FamilyHistory", "family_history") and "family_history_of_diabetes" in valid_feature_names:
                    normalized["family_history_of_diabetes"] = float(v)

        for f in disease_info["features"]:
            name = f["name"]
            if name not in normalized or normalized[name] is None:
                min_v = f.get("min_val", 0.0) if f.get("min_val") is not None else 0.0
                max_v = f.get("max_val", 100.0) if f.get("max_val") is not None else 100.0
                normalized[name] = round((min_v + max_v) / 2.0, 4)

        try:
            pred_res = await service.predict(request.disease, normalized, mode=request.mode)
            if not manifest_hash:
                manifest_hash = pred_res.get("model_manifest_hash")

            status_str = pred_res.get("status", "completed")
            if status_str == "abstained":
                summary_counts["data_quality_alert"] += 1
                results.append(BatchPatientResult(
                    patient_id=pid,
                    status="abstained",
                    triage_priority="data_quality_alert",
                    abstention_reason=pred_res.get("abstention_reason", "Model abstained due to missing sentinel or OOD biomarker"),
                    risk_level=None,
                    risk_probability=None,
                    risk_percentage=None,
                    top_driver=None,
                    consensus_agreement=None,
                ))
            else:
                h_res = pred_res.get("hybrid_result") or {}
                prob = h_res.get("risk_probability") or 0.0
                r_level = h_res.get("risk_level", "low")

                if request.apply_icmr_calibration and request.disease == "diabetes":
                    bmi = normalized.get("BMI", 0.0)
                    if bmi >= 23.0:
                        prob = min(1.0, prob * 1.15)
                        if prob >= 0.50:
                            r_level = "high"
                        elif prob >= 0.25:
                            r_level = "moderate"

                if r_level in ("high", "very_high") or prob >= 0.50:
                    priority = "urgent_followup"
                elif r_level == "moderate" or prob >= 0.25:
                    priority = "moderate_monitoring"
                else:
                    priority = "routine_screening"

                summary_counts[priority] += 1

                top_d = None
                drivers = pred_res.get("explanations", {}).get("classical", {}).get("top_drivers", [])
                if drivers:
                    top_d = drivers[0].get("label") or drivers[0].get("feature")

                agreement = pred_res.get("consensus", {}).get("agreement")

                results.append(BatchPatientResult(
                    patient_id=pid,
                    status="completed",
                    risk_level=r_level,
                    triage_priority=priority,
                    risk_probability=round(prob, 4),
                    risk_percentage=round(prob * 100, 1),
                    abstention_reason=None,
                    top_driver=top_d,
                    consensus_agreement=agreement,
                ))
        except Exception as err:
            summary_counts["data_quality_alert"] += 1
            results.append(BatchPatientResult(
                patient_id=pid,
                status="abstained",
                triage_priority="data_quality_alert",
                abstention_reason=f"Processing error: {str(err)}",
                risk_level=None,
                risk_probability=None,
                risk_percentage=None,
                top_driver=None,
                consensus_agreement=None,
            ))

    pop_note = "Standard Reference Cohort Calibration"
    if request.apply_icmr_calibration and request.disease == "diabetes":
        pop_note = "ICMR-INDIAB South Asian Phenotype Calibration Applied (BMI cut-off >= 23 kg/m2)"

    # Asynchronously record population batch triage summary to Firebase Firestore
    triage_summary = {
        "disease": request.disease,
        "total_patients": len(results),
        "high_risk_count": summary_counts.get("urgent_followup", 0),
        "moderate_risk_count": summary_counts.get("moderate_monitoring", 0),
        "low_risk_count": summary_counts.get("routine_screening", 0),
        "abstained_count": summary_counts.get("data_quality_alert", 0),
        "icmr_recalibrated": bool(request.apply_icmr_calibration and request.disease == "diabetes"),
    }
    background_tasks.add_task(firebase_service.save_batch_triage, triage_summary)

    return BatchPredictionResponse(
        disease=request.disease,
        total_screened=len(results),
        summary=summary_counts,
        patients=results,
        model_manifest_hash=manifest_hash,
        population_note=pop_note,
    )
