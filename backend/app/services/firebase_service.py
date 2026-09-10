"""
Firebase Firestore Service for QuantumHealth AI.
High-level service providing persistent storage for:
- Clinical diagnostic risk predictions
- Sentinel safety abstention audits
- Population batch triage logs
- Clinician overrides & ABDM audit trails
"""

import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from app.core.firebase import firebase_manager

logger = logging.getLogger("quantumhealth.firebase_service")


class FirebaseService:
    """Service layer for Firestore database operations."""

    def __init__(self):
        self.manager = firebase_manager

    @property
    def db(self):
        return self.manager.get_db()

    def is_live(self) -> bool:
        return self.manager.mode == "live"

    def get_status(self) -> Dict[str, Any]:
        return self.manager.get_status()

    # -------------------------------------------------------------
    # PREDICTION RECORDS
    # -------------------------------------------------------------
    async def save_prediction(
        self,
        prediction_data: Dict[str, Any],
        clinician_id: Optional[str] = None,
        patient_ref: Optional[str] = None
    ) -> str:
        """
        Saves a diagnostic prediction record to Firestore collection 'predictions'.
        Supports both completed predictions and safety abstentions.
        """
        try:
            doc_id = str(uuid.uuid4())
            now_iso = datetime.now(timezone.utc).isoformat()

            # Extract key fields safely
            disease = prediction_data.get("disease", "unknown")
            status = prediction_data.get("status", "unknown")
            
            hybrid = prediction_data.get("hybrid_result") or {}
            quantum = prediction_data.get("quantum_result") or {}
            consensus = prediction_data.get("consensus") or {}
            
            record = {
                "id": doc_id,
                "disease": disease,
                "status": status,
                "created_at": now_iso,
                "clinician_id": clinician_id or "anonymous_clinician",
                "patient_ref": patient_ref or f"PT-{uuid.uuid4().hex[:6].upper()}",
                "risk_probability": hybrid.get("risk_probability"),
                "risk_percentage": hybrid.get("risk_percentage"),
                "risk_level": hybrid.get("risk_level"),
                "consensus_agreement": consensus.get("agreement"),
                "consensus_recommendation": consensus.get("recommendation"),
                "final_vote": consensus.get("final_vote"),
                "quantum_qubits": quantum.get("qubits_used"),
                "quantum_backend": quantum.get("backend"),
                "quantum_execution_ms": quantum.get("execution_time_ms"),
                "abstention_reason": prediction_data.get("abstention_reason"),
                "disagreement_spread": (prediction_data.get("disagreement_range") or {}).get("spread"),
                "schema_version": prediction_data.get("schema_version", "v2.0"),
                "cohort": prediction_data.get("cohort"),
                "is_live_firebase": self.is_live()
            }

            col = self.db.collection("predictions")
            col.document(doc_id).set(record)
            logger.info(f"Saved prediction {doc_id} for disease '{disease}' to Firestore (status={status}).")
            return doc_id
        except Exception as e:
            logger.error(f"Error saving prediction to Firestore: {e}", exc_info=True)
            # Never raise to avoid breaking CDS workflows
            return ""

    async def get_predictions(
        self,
        disease: Optional[str] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Retrieves recent predictions from Firestore collection 'predictions'."""
        try:
            query = self.db.collection("predictions")
            
            try:
                if disease:
                    query = query.where("disease", "==", disease)
                query = query.order_by("created_at", direction="DESCENDING").limit(limit)
                docs = list(query.stream())
            except Exception as query_err:
                logger.warning(f"Firestore composite query notice: {query_err}. Falling back to single-field order_by.")
                fallback_query = self.db.collection("predictions").order_by("created_at", direction="DESCENDING").limit(limit * 2)
                raw_docs = list(fallback_query.stream())
                docs = []
                for d in raw_docs:
                    if not disease or d.to_dict().get("disease") == disease:
                        docs.append(d)
                    if len(docs) >= limit:
                        break
            
            results = []
            for doc in docs:
                data = doc.to_dict()
                data["id"] = doc.id
                results.append(data)
            return results
        except Exception as e:
            logger.error(f"Error querying predictions from Firestore: {e}")
            return []

    async def get_prediction_by_id(self, doc_id: str) -> Optional[Dict[str, Any]]:
        """Fetch single prediction document by ID."""
        try:
            doc = self.db.collection("predictions").document(doc_id).get()
            if doc.exists:
                data = doc.to_dict()
                data["id"] = doc.id
                return data
            return None
        except Exception as e:
            logger.error(f"Error fetching prediction {doc_id} from Firestore: {e}")
            return None

    # -------------------------------------------------------------
    # BATCH POPULATION TRIAGE RECORDS
    # -------------------------------------------------------------
    async def save_batch_triage(self, triage_summary: Dict[str, Any]) -> str:
        """Saves population batch triage summary to collection 'batch_triage'."""
        try:
            doc_id = str(uuid.uuid4())
            now_iso = datetime.now(timezone.utc).isoformat()
            
            record = {
                "id": doc_id,
                "cohort_id": triage_summary.get("cohort_id", f"COHORT-{uuid.uuid4().hex[:6].upper()}"),
                "disease": triage_summary.get("disease", "diabetes"),
                "total_patients": triage_summary.get("total_patients", 0),
                "high_risk_count": triage_summary.get("high_risk_count", 0),
                "moderate_risk_count": triage_summary.get("moderate_risk_count", 0),
                "low_risk_count": triage_summary.get("low_risk_count", 0),
                "abstained_count": triage_summary.get("abstained_count", 0),
                "icmr_recalibrated": triage_summary.get("icmr_recalibrated", True),
                "execution_time_s": triage_summary.get("execution_time_s", 0.0),
                "created_at": now_iso,
                "is_live_firebase": self.is_live()
            }

            self.db.collection("batch_triage").document(doc_id).set(record)
            logger.info(f"Saved batch triage run {doc_id} to Firestore.")
            return doc_id
        except Exception as e:
            logger.error(f"Error saving batch triage to Firestore: {e}")
            return ""

    async def get_batch_triage_records(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Retrieves recent batch triage runs."""
        try:
            query = self.db.collection("batch_triage").order_by("created_at", direction="DESCENDING").limit(limit)
            docs = query.stream()
            results = []
            for doc in docs:
                data = doc.to_dict()
                data["id"] = doc.id
                results.append(data)
            return results
        except Exception as e:
            logger.error(f"Error querying batch triage from Firestore: {e}")
            return []

    # -------------------------------------------------------------
    # CLINICAL AUDITS & SAFETY SENTINEL LOGS
    # -------------------------------------------------------------
    async def log_audit_event(
        self,
        event_type: str,
        details: Dict[str, Any],
        clinician_id: Optional[str] = None
    ) -> str:
        """Logs safety events, model conflict abstentions, or doctor overrides."""
        try:
            doc_id = str(uuid.uuid4())
            record = {
                "id": doc_id,
                "event_type": event_type,
                "details": details,
                "clinician_id": clinician_id or "system",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "is_live_firebase": self.is_live()
            }
            self.db.collection("clinical_audits").document(doc_id).set(record)
            logger.info(f"Logged clinical audit event '{event_type}' to Firestore ({doc_id}).")
            return doc_id
        except Exception as e:
            logger.error(f"Error logging audit event to Firestore: {e}")
            return ""

    async def get_audit_events(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Retrieves audit events from Firestore."""
        try:
            query = self.db.collection("clinical_audits").order_by("timestamp", direction="DESCENDING").limit(limit)
            docs = query.stream()
            results = []
            for doc in docs:
                data = doc.to_dict()
                data["id"] = doc.id
                results.append(data)
            return results
        except Exception as e:
            logger.error(f"Error fetching audit events: {e}")
            return []


# Global singleton instance
firebase_service = FirebaseService()


def get_firebase_service() -> FirebaseService:
    """Dependency helper for FastAPI."""
    return firebase_service
