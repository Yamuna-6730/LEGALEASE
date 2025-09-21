import os
from typing import BinaryIO, Tuple
from google.cloud import storage  # type: ignore
from django.conf import settings


def _use_gcp() -> bool:
    return bool(os.getenv("GCP_PROJECT_ID") and os.getenv("GCS_BUCKET_NAME"))


def get_bucket():
    # Use explicit service account credentials (not default) and enforce expected SA email
    from google.oauth2 import service_account

    expected_email = "legal-service-acc@spry-shade-471512-s6.iam.gserviceaccount.com"

    creds_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    if not creds_path or not os.path.exists(creds_path):
        raise FileNotFoundError(
            f"❌ Service account credentials not found at {creds_path}. Please set GOOGLE_APPLICATION_CREDENTIALS."
        )

    credentials = service_account.Credentials.from_service_account_file(
        creds_path,
        scopes=["https://www.googleapis.com/auth/cloud-platform"],
    )
    if getattr(credentials, "service_account_email", None) != expected_email:
        raise PermissionError(
            f"Unexpected service account: {getattr(credentials, 'service_account_email', 'unknown')}. Expected: {expected_email}"
        )
    client = storage.Client(project=os.getenv("GCP_PROJECT_ID"), credentials=credentials)
    
    # Use configured bucket or default to legal-ease-docs
    from .gcs import get_bucket_name  # type: ignore
    return client.bucket(get_bucket_name())


def upload_file(file_obj: BinaryIO, destination_path: str, content_type: str) -> Tuple[str, str]:
    if not _use_gcp():
        # Save to local media for dev/test
        local_path = os.path.join(settings.MEDIA_ROOT, destination_path)
        os.makedirs(os.path.dirname(local_path), exist_ok=True)
        with open(local_path, "wb") as f:
            f.write(file_obj.read())
        return destination_path, f"/media/{destination_path}"

    bucket = get_bucket()
    blob = bucket.blob(destination_path)
    blob.upload_from_file(file_obj, content_type=content_type)
    
    # Keep files private - Vertex AI will access them using IAM permissions
    # This is the secure approach recommended by Google Cloud
    gcs_uri = f"gs://{bucket.name}/{blob.name}"
    return blob.name, gcs_uri


def upload_bytes(data: bytes, destination_path: str, content_type: str) -> Tuple[str, str]:
    if not _use_gcp():
        local_path = os.path.join(settings.MEDIA_ROOT, destination_path)
        os.makedirs(os.path.dirname(local_path), exist_ok=True)
        with open(local_path, "wb") as f:
            f.write(data)
        return destination_path, f"/media/{destination_path}"

    bucket = get_bucket()
    blob = bucket.blob(destination_path)
    blob.upload_from_string(data, content_type=content_type)
    gcs_uri = f"gs://{bucket.name}/{blob.name}"
    return blob.name, gcs_uri


def get_blob_bytes(gcs_path: str) -> bytes:
    if not _use_gcp():
        local_path = os.path.join(settings.MEDIA_ROOT, gcs_path)
        with open(local_path, "rb") as f:
            return f.read()
    # gcs_path is like "uploads/..." or full "gs://bucket/key"
    bucket = get_bucket()
    if gcs_path.startswith("gs://"):
        # Strip bucket prefix
        _, _, rest = gcs_path.partition("gs://")
        bucket_name, _, key = rest.partition("/")
        if bucket_name != bucket.name:
            client = bucket.client  # type: ignore
            b = client.bucket(bucket_name)
            blob = b.blob(key)
        else:
            blob = bucket.blob(key)
    else:
        blob = bucket.blob(gcs_path)
    return blob.download_as_bytes()


def get_bucket_name() -> str:
    # Default to the correct bucket if env not set
    return os.getenv("GCS_BUCKET_NAME", "legal-ease-docs")


def path_to_uri(path: str) -> str:
    """Convert a bucket-relative path or existing gs:// URI into a full gs:// URI.
    Ensures the correct bucket name is used.
    """
    if not path:
        return ""
    if path.startswith("gs://"):
        return path
    # Normalize leading slashes
    normalized = path.lstrip("/")
    return f"gs://{get_bucket_name()}/{normalized}"

