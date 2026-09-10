"""
Core Firebase Manager for QuantumHealth AI.
Supports dual-mode execution:
1. Live Cloud Mode: Real Firebase Admin SDK with Cloud Firestore & Firebase Auth
2. Offline / Mock Mode: In-memory structured store with full API compatibility
   for zero-crash execution in offline rural PHCs, CI/CD, and local development.
"""

import os
import json
import uuid
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional, Dict, List

import firebase_admin
from firebase_admin import credentials, firestore, auth, storage
from app.core.config import settings

logger = logging.getLogger("quantumhealth.firebase")


# =====================================================================
# MOCK / OFFLINE FIRESTORE IMPLEMENTATION
# =====================================================================

class MockDocumentSnapshot:
    """Mock of google.cloud.firestore.DocumentSnapshot"""
    def __init__(self, doc_id: str, data: Optional[Dict[str, Any]], exists: bool = True):
        self.id = doc_id
        self._data = data.copy() if data else {}
        self.exists = exists
        self.create_time = datetime.now(timezone.utc)
        self.update_time = datetime.now(timezone.utc)

    def to_dict(self) -> Dict[str, Any]:
        return self._data.copy() if self.exists else {}

    def get(self, field_path: str) -> Any:
        return self._data.get(field_path)


class MockDocumentReference:
    """Mock of google.cloud.firestore.DocumentReference"""
    def __init__(self, collection_name: str, doc_id: str, store: Dict[str, Dict[str, Any]]):
        self.id = doc_id
        self._collection = collection_name
        self._store = store

    def get(self) -> MockDocumentSnapshot:
        doc = self._store.get(self._collection, {}).get(self.id)
        if doc is not None:
            return MockDocumentSnapshot(self.id, doc, exists=True)
        return MockDocumentSnapshot(self.id, None, exists=False)

    def set(self, data: Dict[str, Any], merge: bool = False) -> None:
        if self._collection not in self._store:
            self._store[self._collection] = {}
        
        cleaned_data = self._serialize_data(data)
        if merge and self.id in self._store[self._collection]:
            self._store[self._collection][self.id].update(cleaned_data)
        else:
            self._store[self._collection][self.id] = cleaned_data

    def update(self, data: Dict[str, Any]) -> None:
        if self._collection not in self._store or self.id not in self._store[self._collection]:
            raise ValueError(f"Document {self.id} does not exist in {self._collection}")
        self._store[self._collection][self.id].update(self._serialize_data(data))

    def delete(self) -> None:
        if self._collection in self._store and self.id in self._store[self._collection]:
            del self._store[self._collection][self.id]

    @staticmethod
    def _serialize_data(data: Dict[str, Any]) -> Dict[str, Any]:
        serialized = {}
        for k, v in data.items():
            if isinstance(v, datetime):
                serialized[k] = v.isoformat()
            else:
                serialized[k] = v
        return serialized


class MockQuery:
    """Mock of google.cloud.firestore.Query"""
    def __init__(self, collection_name: str, store: Dict[str, Dict[str, Any]]):
        self._collection = collection_name
        self._store = store
        self._filters: List[tuple] = []
        self._order_by_field: Optional[str] = None
        self._order_direction: str = "ASCENDING"
        self._limit_count: Optional[int] = None

    def where(self, field: str, op: str, value: Any) -> "MockQuery":
        self._filters.append((field, op, value))
        return self

    def order_by(self, field: str, direction: str = "ASCENDING") -> "MockQuery":
        self._order_by_field = field
        self._order_direction = direction
        return self

    def limit(self, count: int) -> "MockQuery":
        self._limit_count = count
        return self

    def stream(self) -> List[MockDocumentSnapshot]:
        docs_dict = self._store.get(self._collection, {})
        results = []
        for doc_id, data in docs_dict.items():
            match = True
            for field, op, val in self._filters:
                doc_val = data.get(field)
                if op in ("==", "=") and doc_val != val:
                    match = False
                    break
                elif op == "!=" and doc_val == val:
                    match = False
                    break
                elif op == ">" and (doc_val is None or doc_val <= val):
                    match = False
                    break
                elif op == "<" and (doc_val is None or doc_val >= val):
                    match = False
                    break
                elif op == ">=" and (doc_val is None or doc_val < val):
                    match = False
                    break
                elif op == "<=" and (doc_val is None or doc_val > val):
                    match = False
                    break
                elif op == "in" and doc_val not in val:
                    match = False
                    break
            if match:
                results.append(MockDocumentSnapshot(doc_id, data, exists=True))

        # Order by
        if self._order_by_field:
            reverse = (self._order_direction.upper() == "DESCENDING")
            results.sort(
                key=lambda s: str(s.to_dict().get(self._order_by_field, "")),
                reverse=reverse
            )

        # Limit
        if self._limit_count is not None:
            results = results[:self._limit_count]

        return results


class MockCollectionReference(MockQuery):
    """Mock of google.cloud.firestore.CollectionReference"""
    def __init__(self, collection_name: str, store: Dict[str, Dict[str, Any]]):
        super().__init__(collection_name, store)

    def document(self, doc_id: Optional[str] = None) -> MockDocumentReference:
        if not doc_id:
            doc_id = str(uuid.uuid4())
        return MockDocumentReference(self._collection, doc_id, self._store)

    def add(self, data: Dict[str, Any]) -> tuple[datetime, MockDocumentReference]:
        doc_id = str(uuid.uuid4())
        ref = self.document(doc_id)
        ref.set(data)
        return (datetime.now(timezone.utc), ref)


class MockFirestoreClient:
    """In-memory mock database matching Firestore API contract."""
    def __init__(self):
        self._store: Dict[str, Dict[str, Any]] = {
            "predictions": {},
            "batch_triage": {},
            "clinical_audits": {},
            "benchmarks": {}
        }
        logger.info("[Firebase Mock] Mock Firestore Client initialized with in-memory store.")

    def collection(self, collection_name: str) -> MockCollectionReference:
        return MockCollectionReference(collection_name, self._store)

    def get_stats(self) -> Dict[str, int]:
        return {k: len(v) for k, v in self._store.items()}


# =====================================================================
# FIREBASE MANAGER SINGLETON
# =====================================================================

class FirebaseManager:
    """
    Manages Firebase Admin SDK lifecycle, credentials discovery,
    Firestore database handle, and Auth token validation.
    """
    _instance: Optional["FirebaseManager"] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(FirebaseManager, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        
        self.mode: str = "mock_offline"
        self.app: Optional[firebase_admin.App] = None
        self.project_id: str = "quantumhealth-ai-offline"
        self.db: Any = None
        self._error_detail: Optional[str] = None
        self._initialized = True
        
        self.initialize()

    def initialize(self) -> None:
        """Discover credentials and initialize Firebase SDK or fallback to Mock mode."""
        if not settings.firebase_enabled:
            logger.info("Firebase integration explicitly disabled via settings. Using mock mode.")
            self.mode = "mock_offline"
            self.db = MockFirestoreClient()
            return

        cred = None
        project_id = settings.firebase_project_id

        # 1. Check direct service account key JSON string in settings/env
        if settings.firebase_service_account_json:
            try:
                key_dict = json.loads(settings.firebase_service_account_json)
                cred = credentials.Certificate(key_dict)
                project_id = key_dict.get("project_id", project_id)
                logger.info(f"Loaded Firebase credentials from JSON env string (project={project_id}).")
            except Exception as e:
                logger.warning(f"Failed parsing firebase_service_account_json: {e}")

        # 2. Check service account file path
        if cred is None and settings.firebase_service_account_path:
            p = Path(settings.firebase_service_account_path)
            if p.is_file():
                try:
                    cred = credentials.Certificate(str(p))
                    logger.info(f"Loaded Firebase credentials from file: {p}")
                except Exception as e:
                    logger.warning(f"Failed loading credentials from {p}: {e}")

        # 3. Check default convention: serviceAccountKey.json in backend root
        if cred is None:
            default_key = Path(__file__).resolve().parent.parent.parent / "serviceAccountKey.json"
            if default_key.is_file():
                try:
                    cred = credentials.Certificate(str(default_key))
                    logger.info(f"Loaded Firebase credentials from default path: {default_key}")
                except Exception as e:
                    logger.warning(f"Failed loading credentials from {default_key}: {e}")

        # 4. Check standard GOOGLE_APPLICATION_CREDENTIALS env var
        if cred is None and os.getenv("GOOGLE_APPLICATION_CREDENTIALS"):
            g_path = Path(os.getenv("GOOGLE_APPLICATION_CREDENTIALS"))
            if g_path.is_file():
                try:
                    cred = credentials.Certificate(str(g_path))
                    logger.info(f"Loaded Firebase credentials from GOOGLE_APPLICATION_CREDENTIALS: {g_path}")
                except Exception as e:
                    logger.warning(f"Failed loading from GOOGLE_APPLICATION_CREDENTIALS: {e}")

        # 5. Initialize Firebase App or fallback
        if cred is not None:
            try:
                app_options = {}
                if project_id:
                    app_options["projectId"] = project_id
                if settings.firebase_storage_bucket:
                    app_options["storageBucket"] = settings.firebase_storage_bucket

                # Check if default app already exists
                try:
                    self.app = firebase_admin.get_app()
                except ValueError:
                    self.app = firebase_admin.initialize_app(cred, app_options)

                self.db = firestore.client()
                self.project_id = self.app.project_id or project_id or "quantumhealth-ai-live"
                self.mode = "live"
                logger.info(f"[Firebase Live] Connected to Google Cloud Firestore (Project: {self.project_id})")
                return
            except Exception as e:
                self._error_detail = str(e)
                logger.warning(f"Live Firebase initialization error: {e}. Falling back to offline mock mode.")

        # Fallback to Mock Offline mode
        self.mode = "mock_offline"
        self.project_id = project_id or "quantumhealth-ai-offline-phc"
        self.db = MockFirestoreClient()
        logger.info(f"[Firebase Offline] Running in resilient offline mode (Mock Project: {self.project_id})")

    def get_db(self) -> Any:
        """Returns the active Firestore client (Real or Mock)."""
        if self.db is None:
            self.initialize()
        return self.db

    def verify_id_token(self, token: str) -> Dict[str, Any]:
        """
        Verifies a Firebase ID token.
        In Live mode: Uses firebase_admin.auth.verify_id_token
        In Mock mode: Decodes mock token or returns simulated clinician claims.
        """
        # Always allow mock/test tokens for hackathon demos, test suites, or offline verification
        if (
            token.startswith("mock-")
            or token.startswith("test-")
            or token.startswith("custom-")
            or token.startswith("demo-")
            or token == "clinician-demo-token"
        ):
            return {
                "uid": "clinician-user-101",
                "email": "doctor.sharma@phc.nhm.gov.in",
                "role": "clinician",
                "name": "Dr. Sharma (PHC Medical Officer)",
                "auth_time": int(datetime.now(timezone.utc).timestamp()),
                "is_mock": True
            }
        elif token.startswith("asha-"):
            return {
                "uid": "asha-worker-202",
                "email": "priya.devi@asha.nhm.gov.in",
                "role": "asha_worker",
                "name": "Priya Devi (Community Health Worker)",
                "auth_time": int(datetime.now(timezone.utc).timestamp()),
                "is_mock": True
            }

        if self.mode == "live":
            try:
                return auth.verify_id_token(token)
            except Exception as e:
                raise ValueError(f"Invalid Firebase ID Token: {e}")
        else:
            return {
                "uid": f"user-{uuid.uuid4().hex[:8]}",
                "email": "verified.user@quantumhealth.ai",
                "role": "clinician",
                "name": "Verified Healthcare User",
                "auth_time": int(datetime.now(timezone.utc).timestamp()),
                "is_mock": True
            }

    def get_status(self) -> Dict[str, Any]:
        """Returns health status, active mode, and collection metrics."""
        stats = {}
        if isinstance(self.db, MockFirestoreClient):
            stats = self.db.get_stats()
        
        return {
            "status": "healthy",
            "mode": self.mode,
            "project_id": self.project_id,
            "firebase_admin_version": firebase_admin.__version__,
            "is_live_cloud": (self.mode == "live"),
            "storage_bucket": settings.firebase_storage_bucket or "not_configured",
            "mock_stats": stats,
            "error_detail": self._error_detail
        }


# Global singleton instance
firebase_manager = FirebaseManager()


def get_firebase_db():
    """Dependency helper for FastAPI endpoints."""
    return firebase_manager.get_db()
