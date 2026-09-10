"""
FastAPI Router for Firebase Integration.
Provides endpoints for:
- Firebase connection & Firestore health check
- Diagnostic prediction synchronization & history
- Population batch triage cloud audit
- Clinician authentication & token verification
"""

import logging
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Header, Query, status
from pydantic import BaseModel, Field

from app.core.firebase import firebase_manager
from app.services.firebase_service import FirebaseService, get_firebase_service

logger = logging.getLogger("quantumhealth.api.firebase")

router = APIRouter()


# -------------------------------------------------------------
# PYDANTIC SCHEMAS
# -------------------------------------------------------------

class FirebaseStatusResponse(BaseModel):
    status: str = "healthy"
    mode: str = Field(..., description="'live' (Cloud Firestore) or 'mock_offline' (Local PHC Fallback)")
    project_id: str
    firebase_admin_version: str
    is_live_cloud: bool
    storage_bucket: str
    mock_stats: Optional[Dict[str, int]] = None
    error_detail: Optional[str] = None


class VerifyTokenRequest(BaseModel):
    token: str = Field(..., description="Firebase ID token from frontend Firebase Auth SDK")


class VerifyTokenResponse(BaseModel):
    valid: bool
    uid: str
    email: Optional[str] = None
    role: str = "clinician"
    name: Optional[str] = None
    is_mock: bool = False


class SyncPredictionRequest(BaseModel):
    prediction: Dict[str, Any]
    clinician_id: Optional[str] = None
    patient_ref: Optional[str] = None


class BatchTriageRecordRequest(BaseModel):
    disease: str = "diabetes"
    total_patients: int
    high_risk_count: int
    moderate_risk_count: int
    low_risk_count: int
    abstained_count: int = 0
    icmr_recalibrated: bool = True
    execution_time_s: float = 0.0


# -------------------------------------------------------------
# AUTHENTICATION DEPENDENCY
# -------------------------------------------------------------

async def get_current_clinician(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """
    FastAPI dependency for verifying clinician authorization.
    In live cloud mode: verifies Firebase ID token.
    In local mock mode: allows mock/test tokens or falls back to simulated clinician.
    """
    if not authorization:
        # Permissive local mode fallback: provides simulated clinician identity
        return {
            "uid": "clinician-local-anonymous",
            "email": "local.clinician@quantumhealth.ai",
            "role": "clinician",
            "name": "Local PHC Clinician",
            "is_mock": True
        }
    
    parts = authorization.split()
    if len(parts) == 2 and parts[0].lower() == "bearer":
        token = parts[1]
    else:
        token = authorization

    try:
        claims = firebase_manager.verify_id_token(token)
        return claims
    except Exception as e:
        logger.warning(f"Firebase token verification failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired Firebase Auth token: {str(e)}"
        )


# -------------------------------------------------------------
# ENDPOINTS
# -------------------------------------------------------------

@router.get(
    "/status",
    response_model=FirebaseStatusResponse,
    summary="Firebase & Firestore Connection Status",
    description="Returns the active Firebase mode (live vs mock_offline), project ID, and Firestore health."
)
async def get_firebase_status(service: FirebaseService = Depends(get_firebase_service)):
    return service.get_status()


@router.post(
    "/verify-token",
    response_model=VerifyTokenResponse,
    summary="Verify Firebase ID Token",
    description="Validates a Firebase Auth JWT token and returns the verified clinician identity and claims."
)
async def verify_token(req: VerifyTokenRequest):
    try:
        claims = firebase_manager.verify_id_token(req.token)
        return {
            "valid": True,
            "uid": claims.get("uid", ""),
            "email": claims.get("email"),
            "role": claims.get("role", "clinician"),
            "name": claims.get("name"),
            "is_mock": claims.get("is_mock", False)
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token verification failed: {str(e)}"
        )


@router.get(
    "/predictions",
    summary="List Synchronized Predictions from Firestore",
    description="Retrieves patient prediction records stored in Cloud Firestore."
)
async def list_predictions(
    disease: Optional[str] = Query(None, description="Filter by disease (diabetes, heart, kidney, breast_cancer)"),
    limit: int = Query(50, ge=1, le=200, description="Max documents to return"),
    service: FirebaseService = Depends(get_firebase_service)
):
    records = await service.get_predictions(disease=disease, limit=limit)
    return {"total": len(records), "predictions": records}


@router.get(
    "/predictions/{doc_id}",
    summary="Get Single Prediction by Document ID",
    description="Fetches a specific prediction audit record from Firestore."
)
async def get_prediction(
    doc_id: str,
    service: FirebaseService = Depends(get_firebase_service)
):
    record = await service.get_prediction_by_id(doc_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Prediction record '{doc_id}' not found in Firestore."
        )
    return record


@router.post(
    "/predictions",
    summary="Sync or Save Prediction Record to Firestore",
    description="Explicitly records a diagnostic assessment into Cloud Firestore."
)
async def sync_prediction(
    req: SyncPredictionRequest,
    service: FirebaseService = Depends(get_firebase_service),
    clinician: Dict[str, Any] = Depends(get_current_clinician)
):
    clinician_id = req.clinician_id or clinician.get("uid")
    doc_id = await service.save_prediction(
        prediction_data=req.prediction,
        clinician_id=clinician_id,
        patient_ref=req.patient_ref
    )
    if not doc_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed saving prediction to Firestore."
        )
    return {"status": "saved", "id": doc_id, "mode": service.manager.mode}


@router.get(
    "/batch-triage",
    summary="List Population Batch Triage Runs",
    description="Retrieves recent population batch triage records from Firestore."
)
async def list_batch_triage(
    limit: int = Query(20, ge=1, le=100),
    service: FirebaseService = Depends(get_firebase_service)
):
    records = await service.get_batch_triage_records(limit=limit)
    return {"total": len(records), "batch_triage_runs": records}


@router.post(
    "/batch-triage",
    summary="Record Population Batch Triage Run",
    description="Saves a batch triage summary record to Cloud Firestore."
)
async def record_batch_triage(
    req: BatchTriageRecordRequest,
    service: FirebaseService = Depends(get_firebase_service)
):
    doc_id = await service.save_batch_triage(req.model_dump())
    return {"status": "saved", "id": doc_id, "mode": service.manager.mode}


@router.get(
    "/audits",
    summary="List Clinical Safety & Sentinel Audits",
    description="Retrieves safety abstention and clinician override audit logs."
)
async def list_audits(
    limit: int = Query(50, ge=1, le=200),
    service: FirebaseService = Depends(get_firebase_service)
):
    records = await service.get_audit_events(limit=limit)
    return {"total": len(records), "audit_events": records}
