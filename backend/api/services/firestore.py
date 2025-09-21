import os
from datetime import datetime
from typing import Any, Dict, List

_USE_GCP = bool(os.getenv("GCP_PROJECT_ID"))

if _USE_GCP:
    from google.cloud import firestore  # type: ignore
    from google.oauth2 import service_account

    def get_db():
        # Use explicit service account credentials (not default) and enforce expected SA email
        expected_email = "legal-service-acc@spry-shade-471512-s6.iam.gserviceaccount.com"
        creds_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
        if not creds_path or not os.path.exists(creds_path):
            raise FileNotFoundError(
                f"❌ Service account credentials not found at {creds_path}. Please set GOOGLE_APPLICATION_CREDENTIALS."
            )
        credentials = service_account.Credentials.from_service_account_file(
            creds_path,
            scopes=["https://www.googleapis.com/auth/cloud-platform"]
        )
        if getattr(credentials, "service_account_email", None) != expected_email:
            raise PermissionError(
                f"Unexpected service account: {getattr(credentials, 'service_account_email', 'unknown')}. Expected: {expected_email}"
            )
        return firestore.Client(project=os.getenv("GCP_PROJECT_ID"), credentials=credentials)
else:
    _DB: Dict[str, Dict[str, Dict[str, Any]]] = {"documents": {}, "reminders": {}, "faqs": {}}

    class _DocRef:
        def __init__(self, collection: str, doc_id: str):
            self.collection = collection
            self.id = doc_id

        def set(self, data: Dict[str, Any]):
            _DB[self.collection][self.id] = data

        def get(self):
            class _Doc:
                def __init__(self, id: str, data: Dict[str, Any]):
                    self.id = id
                    self._data = data

                def to_dict(self):
                    return self._data

            data = _DB[self.collection].get(self.id, {})
            return _Doc(self.id, data)

    class _Collection:
        def __init__(self, name: str):
            self.name = name

        def document(self, doc_id: str | None = None):
            if doc_id is None:
                doc_id = f"local-{len(_DB[self.name]) + 1}"
            return _DocRef(self.name, doc_id)

        def order_by(self, *_args, **_kwargs):
            return self

        def limit(self, _n: int):
            return self

        def stream(self):
            class _Doc:
                def __init__(self, id: str, data: Dict[str, Any]):
                    self.id = id
                    self._data = data

                def to_dict(self):
                    return self._data

            return [_Doc(i, d) for i, d in _DB[self.name].items()]

    class _DBClient:
        def collection(self, name: str):
            return _Collection(name)

    def get_db():
        return _DBClient()


def save_document_metadata(user_id: str, data: Dict[str, Any]) -> str:
    try:
        db = get_db()
        ref = db.collection("documents").document()
        ref.set({"userId": user_id, **data, "createdAt": datetime.utcnow()})
        return ref.id
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Failed to save document metadata: {str(e)}")
        raise Exception(f"Failed to save document metadata. Please check Firestore permissions. Error: {str(e)}")


def get_document(user_id: str, document_id: str) -> Dict[str, Any]:
    db = get_db()
    ref = db.collection("documents").document(document_id)
    doc = ref.get()
    data = doc.to_dict() or {}
    # Allow access in public/unauthenticated mode when user_id is None
    if not data:
        raise PermissionError("Document not found")
    if user_id and data.get("userId") != user_id:
        raise PermissionError("Document not found")
    return {"id": doc.id, **data}


def upsert_reminder(user_id: str, reminder: Dict[str, Any]) -> str:
    try:
        db = get_db()
        ref = db.collection("reminders").document()
        ref.set({"userId": user_id, **reminder, "createdAt": datetime.utcnow()})
        return ref.id
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Failed to save reminder: {str(e)}")
        raise Exception(f"Failed to save reminder. Please check Firestore permissions. Error: {str(e)}")


def list_faq(limit: int = 20) -> List[Dict[str, Any]]:
    if _USE_GCP:
        db = get_db()
        docs = (
            db.collection("faqs").order_by("popularity", direction=firestore.Query.DESCENDING).limit(limit).stream()
        )
        return [{"id": d.id, **(d.to_dict() or {})} for d in docs]
    else:
        # Seed a few FAQ entries in local dev
        if not _DB["faqs"]:
            _DB["faqs"]["local-1"] = {"question": "What is EMI?", "answer": "Equated Monthly Instalment."}
            _DB["faqs"]["local-2"] = {"question": "What happens if I default?", "answer": "Penalties and credit score impact."}
        return [{"id": i, **d} for i, d in list(_DB["faqs"].items())[:limit]]

