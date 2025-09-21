import json
import os
from typing import Optional, Tuple

import firebase_admin
from firebase_admin import auth as fb_auth, credentials
from rest_framework import authentication, exceptions

_initialized = False


def _ensure_firebase_initialized() -> None:
    global _initialized
    if _initialized:
        return
        
    creds_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    try:
        if creds_path and os.path.exists(creds_path):
            cred = credentials.Certificate(creds_path)
            firebase_admin.initialize_app(cred)
        else:
            # Fall back to application default, may work if env is configured
            firebase_admin.initialize_app()
        _initialized = True
    except Exception as exc:  # noqa: BLE001
        # As a last resort initialize without explicit creds (dev only)
        if not firebase_admin._apps:  # type: ignore[attr-defined]
            firebase_admin.initialize_app()
        _initialized = True


class FirebaseAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request) -> Optional[Tuple[object, None]]:
        auth_header = request.META.get("HTTP_AUTHORIZATION", "")
        if not auth_header.startswith("Bearer "):
            raise exceptions.AuthenticationFailed("Missing bearer token")
        token = auth_header.split(" ", 1)[1]
        try:
            _ensure_firebase_initialized()
            decoded = fb_auth.verify_id_token(token)
            uid = decoded.get("uid")
            user = type("FirebaseUser", (), {"uid": uid, "is_authenticated": True})()
            return user, None
        except Exception as exc:  # noqa: BLE001
            raise exceptions.AuthenticationFailed("Invalid Firebase token") from exc

