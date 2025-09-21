import base64
import json
import os
from typing import Dict, List, Tuple, Optional
import urllib

import vertexai
from vertexai.generative_models import GenerativeModel, Part
from . import gcs as gcs_service
from google.cloud import speech_v1 as speech
from google.cloud import texttospeech_v1 as tts


def _has_gcp() -> bool:
    return bool(os.getenv("GCP_PROJECT_ID"))


def reset_model_cache():
    """Reset the model cache to force reinitialization"""
    global _model, _model_initialized
    _model = None
    _model_initialized = False


def _ensure_credentials():
    """Check that service account credentials are available (but don't set as default)"""
    creds_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    if creds_path and os.path.exists(creds_path):
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"🔧 Service account credentials available: {creds_path}")
    else:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"❌ Credentials not found: {creds_path}")

EXPECTED_SERVICE_ACCOUNT_EMAIL = "legal-service-acc@spry-shade-471512-s6.iam.gserviceaccount.com"

_model: Optional[GenerativeModel] = None
_model_initialized: bool = False


def _load_sa_credentials():
    from google.oauth2 import service_account  # type: ignore
    creds_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    if not creds_path or not os.path.exists(creds_path):
        raise FileNotFoundError(
            f"❌ Service account credentials not found at {creds_path}. "
            "Please set GOOGLE_APPLICATION_CREDENTIALS to a valid service account JSON file."
        )
    credentials = service_account.Credentials.from_service_account_file(
        creds_path,
        scopes=["https://www.googleapis.com/auth/cloud-platform"],
    )
    if getattr(credentials, "service_account_email", None) != EXPECTED_SERVICE_ACCOUNT_EMAIL:
        raise PermissionError(
            f"Unexpected service account: {getattr(credentials, 'service_account_email', 'unknown')}. "
            f"Expected: {EXPECTED_SERVICE_ACCOUNT_EMAIL}"
        )
    return credentials


def _get_model() -> GenerativeModel:
    global _model, _model_initialized
    
    # Always try to reinitialize if there was a previous failure
    if _model is not None and _model_initialized:
        try:
            # Test if the model is still working
            test_response = _model.generate_content("test")
            return _model
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"⚠️ Cached model failed, reinitializing: {str(e)}")
            _model = None
            _model_initialized = False
    
    if _model is not None:
        return _model
        
    project = os.getenv("GCP_PROJECT_ID")
    location = os.getenv("VERTEX_LOCATION", "us-central1")
    model_name = os.getenv("VERTEX_MODEL", "gemini-2.5-pro")
    
    if not project:
        raise ValueError("❌ GCP_PROJECT_ID environment variable is not set")
    
    # Check service account credentials
    creds_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    if not creds_path or not os.path.exists(creds_path):
        raise FileNotFoundError(
            f"❌ Service account credentials not found at {creds_path}. "
            "Please set GOOGLE_APPLICATION_CREDENTIALS to a valid service account JSON file."
        )
    
    try:
        import logging
        from google.oauth2 import service_account
        
        logger = logging.getLogger(__name__)
        logger.info(f"🔍 Initializing Vertex AI with project: {project}, location: {location}")
        logger.info(f"🔧 Using model: {model_name}")
        
        # Initialize Vertex AI with service account credentials
        try:
            # Load credentials from file with explicit scopes and enforce expected SA email
            credentials = _load_sa_credentials()
            
            # Clear any existing Vertex AI initialization
            try:
                vertexai.uninit()
            except:
                pass
            
            # Initialize Vertex AI with explicit credentials (no default environment setting)
            vertexai.init(
                project=project,
                location=location,
                credentials=credentials
            )
            
            logger.info("✅ Successfully initialized Vertex AI with explicit service account")
            logger.info(f"✅ Using service account: {credentials.service_account_email}")
            logger.info("✅ Vertex AI initialized without setting default credentials")
        except Exception as init_error:
            logger.error(f"❌ Failed to initialize Vertex AI: {str(init_error)}")
            raise
        
        # Test model access
        try:
            logger.info(f"🔍 Attempting to access model: {model_name}")
            # Create model with explicit credentials to ensure it uses the right service account
            _model = GenerativeModel(model_name)
            # Test with a simple prompt to verify model access
            test_prompt = "Hello, can you hear me?"
            response = _model.generate_content(test_prompt)
            if not getattr(response, "text", "").strip():
                logger.warning("⚠️ Model responded with empty content")
            logger.info("✅ Successfully connected to model and received response")
            _model_initialized = True
            return _model
            
        except Exception as model_error:
            logger.error(f"❌ Failed to access model {model_name}: {str(model_error)}")
            
            # Try to list available models
            try:
                from google.cloud import aiplatform
                client = aiplatform.gapic.PredictionServiceClient(
                    client_options={"api_endpoint": f"{location}-aiplatform.googleapis.com"}
                )
                parent = f"projects/{project}/locations/{location}"
                models = client.list_models(parent=parent)
                available_models = [m.display_name for m in models]
                logger.info(f"📋 Available models in {location}: {', '.join(available_models) if available_models else 'None found'}")
            except Exception as list_error:
                logger.error(f"❌ Failed to list available models: {str(list_error)}")
            
            raise ValueError(
                f"Failed to access model '{model_name}'. "
                f"Please verify that the model exists in location '{location}' and your service account has the 'aiplatform.endpoints.predict' permission."
            )
        
    except Exception as e:
        logger.error(f"❌ Critical error initializing Vertex AI: {str(e)}")
        logger.info("\nTroubleshooting steps:")
        logger.info("1. Verify your service account has the 'Vertex AI User' role")
        logger.info("2. Check if the Vertex AI API is enabled in your GCP project")
        logger.info("3. Verify the model name is correct and available in the specified region")
        logger.info(f"4. Check service account permissions at: https://console.cloud.google.com/iam-admin/iam?project={project}")
        logger.info(f"5. Verify Vertex AI API is enabled at: https://console.cloud.google.com/apis/library/aiplatform.googleapis.com?project={project}")
        raise


def _get_mime_type(gcs_uri: str) -> str:
    """Determine MIME type based on file extension."""
    uri_lower = gcs_uri.lower()
    if uri_lower.endswith('.pdf'):
        return "application/pdf"
    elif uri_lower.endswith(('.docx', '.doc')):
        return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    elif uri_lower.endswith('.txt'):
        return "text/plain"
    elif uri_lower.endswith('.rtf'):
        return "application/rtf"
    elif uri_lower.endswith('.csv'):
        return "text/csv"
    elif uri_lower.endswith('.json'):
        return "application/json"
    elif uri_lower.endswith('.html') or uri_lower.endswith('.htm'):
        return "text/html"
    else:
        return "application/octet-stream"  # Default to binary

def _part_from_gcs_uri(gcs_uri: str) -> Part:
    """Create a Part pointing to GCS using Vertex service account.
    
    Automatically fixes missing bucket prefix and URL-encodes special characters
    including spaces and folder names like 'None'.
    """
    mime_type = _get_mime_type(gcs_uri)
    use_uri = os.getenv("VERTEX_USE_URI", "true").lower() != "false"

    # Ensure bucket prefix
    if not gcs_uri.startswith("gs://"):
        gcs_uri = f"gs://legal-ease-docs/{gcs_uri.lstrip('/')}"

    # URL-encode path except the 'gs://' prefix
    scheme, path = gcs_uri.split("://", 1)
    path_encoded = urllib.parse.quote(path, safe="/")  # encode spaces, keep slashes
    gcs_uri = f"{scheme}://{path_encoded}"

    if use_uri:
        return Part.from_uri(gcs_uri, mime_type=mime_type)

    # fallback: embed bytes (not recommended if large)
    data = gcs_service.get_blob_bytes(gcs_uri)
    return Part.from_data(mime_type=mime_type, data=data)


def _parse_json_array(text: str) -> List[Dict[str, str]]:
    """Best-effort parse for a JSON array present in model output.
    Tries direct json.loads, then falls back to extracting the first top-level array.
    """
    try:
        data = json.loads(text)
        if isinstance(data, list):
            return data  # type: ignore[return-value]
    except Exception:
        pass
    # Fallback: extract content between the first '[' and the last ']'
    start = text.find('[')
    end = text.rfind(']')
    if start != -1 and end != -1 and end > start:
        snippet = text[start:end + 1]
        try:
            data = json.loads(snippet)
            if isinstance(data, list):
                return data  # type: ignore[return-value]
        except Exception:
            return []
    return []

def summarize_document(gcs_uri: str, language: str = "en") -> str:
    if not _has_gcp():
        return "This is a placeholder summary generated in development mode."
    
    try:
        model = _get_model()
        part = _part_from_gcs_uri(gcs_uri)
        prompt = (
            "You are a legal assistant. Read the attached file and provide a concise 3-line summary "
            "in plain language. Focus on obligations, fees, and important dates."
        )
        parts: List[object] = [part, prompt]
        resp = model.generate_content(parts)
        return (getattr(resp, "text", "") or "").strip()
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Failed to summarize document from {gcs_uri}: {str(e)}")
        # If it's a credential error, try to reset and retry once
        if "403" in str(e) and "service-382380612989" in str(e):
            logger.warning("🔄 Detected credential issue, forcing model reset...")
            # Force reset everything
            reset_model_cache()
            # Reset model cache to force reinitialization
            try:
                model = _get_model()
                resp = model.generate_content(parts)
                return (getattr(resp, "text", "") or "").strip()
            except Exception as retry_error:
                logger.error(f"Retry failed: {str(retry_error)}")
        return f"Unable to analyze document. Error: {str(e)}"


def analyze_risks(gcs_uri: str) -> List[Dict[str, str]]:
    if not _has_gcp():
        return [
            {"clause": "Late payment fee", "risk": "High", "explanation": "Potential heavy penalties for delays."}
        ]
    
    try:
        # Ensure credentials are set before processing
        _ensure_credentials()
        model = _get_model()
        part = _part_from_gcs_uri(gcs_uri)
        prompt = (
            "Identify risky clauses from the attached legal document."
            " Return STRICT JSON array of objects with keys: clause, risk (Low|Medium|High), explanation."
            " Output ONLY the JSON array, no extra commentary. Keep at most 6 items."
        )
        parts = [part, prompt]
        resp = model.generate_content(parts)
        text = getattr(resp, "text", "") or "[]"
        arr = _parse_json_array(text)
        cleaned: List[Dict[str, str]] = []
        for item in arr[:6]:
            if isinstance(item, dict):
                cleaned.append({
                    "clause": str(item.get("clause", "")),
                    "risk": str(item.get("risk", "")),
                    "explanation": str(item.get("explanation", "")),
                })
        return cleaned
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Failed to analyze risks from {gcs_uri}: {str(e)}")
        return [{"clause": "Document access error", "risk": "Unknown", "explanation": f"Unable to analyze document: {str(e)}"}]


def extract_glossary(gcs_uri: str, language: str = "en") -> List[Dict[str, str]]:
    if not _has_gcp():
        return [
            {"term": "EMI", "definition": "Equated Monthly Installment."},
            {"term": "Indemnity", "definition": "Security against legal liability."},
        ]
    
    try:
        # Ensure credentials are set before processing
        _ensure_credentials()
        model = _get_model()
        part = _part_from_gcs_uri(gcs_uri)
        prompt = (
            "From the attached document, extract up to 10 domain-specific legal terms that may be confusing."
            " Return STRICT JSON array with objects {term, definition} in plain language."
            " Output ONLY the JSON array, no extra commentary."
        )
        parts = [part, prompt]
        resp = model.generate_content(parts)
        text = getattr(resp, "text", "") or "[]"
        arr = _parse_json_array(text)
        out: List[Dict[str, str]] = []
        for i in arr[:10]:
            if isinstance(i, dict):
                out.append({"term": str(i.get("term", "")), "definition": str(i.get("definition", ""))})
        return out
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Failed to extract glossary from {gcs_uri}: {str(e)}")
        return [{"term": "Document access error", "definition": f"Unable to extract terms: {str(e)}"}]


def answer_question(context_uri: str, question: str, language: str = "en") -> str:
    if not _has_gcp():
        return f"For question: '{question}', please review repayment terms and late fee clauses."
    model = _get_model()
    system = (
        "You are a helpful legal assistant. Answer based on the provided document if present. "
        "Be concise and non-technical. If unsure, say what to check in the document."
    )
    parts: List[object] = []
    if context_uri:
        parts.append(_part_from_gcs_uri(context_uri))
    parts.extend([system, f"Question: {question}"])
    resp = model.generate_content(parts)
    return (getattr(resp, "text", "") or "").strip()


def stt_transcribe(audio_base64: str, language: str = "en") -> str:
    if not _has_gcp():
        return "What happens if I don't pay my EMI?"
    # Ensure we use the expected service account for STT
    credentials = _load_sa_credentials()
    client = speech.SpeechClient(credentials=credentials)
    audio_bytes = base64.b64decode(audio_base64)
    audio = speech.RecognitionAudio(content=audio_bytes)
    config = speech.RecognitionConfig(
        encoding=speech.RecognitionConfig.AudioEncoding.WEBM_OPUS,
        language_code="en-US" if language == "en" else language,
        enable_automatic_punctuation=True,
    )
    response = client.recognize(config=config, audio=audio)
    for result in response.results:
        if result.alternatives:
            return result.alternatives[0].transcript
    return ""


def tts_synthesize(text: str, language: str = "en") -> str:
    # Ensure we use the expected service account for TTS
    credentials = _load_sa_credentials()
    client = tts.TextToSpeechClient(credentials=credentials)
    input_text = tts.SynthesisInput(text=text)
    voice = tts.VoiceSelectionParams(
        language_code="en-US" if language == "en" else language,
        ssml_gender=tts.SsmlVoiceGender.NEUTRAL,
    )
    audio_config = tts.AudioConfig(audio_encoding=tts.AudioEncoding.MP3)
    resp = client.synthesize_speech(input=input_text, voice=voice, audio_config=audio_config)
    return base64.b64encode(resp.audio_content).decode("utf-8")


def chat_with_gemini(messages: List[Dict[str, str]], context_uri: Optional[str] = None) -> str:
    if not _has_gcp():
        last = messages[-1]["content"] if messages else ""
        return f"[Dev Chat] You said: {last}."
    
    try:
        model = _get_model()
        parts: List[object] = []
        if context_uri:
            parts.append(_part_from_gcs_uri(context_uri))
        # Simple conversation stitching
        convo = []
        for m in messages[-12:]:  # last 12 turns
            role = "User" if m.get("role") == "user" else "Assistant"
            convo.append(f"{role}: {m.get('content','')}")
        parts.append("\n".join(convo) + "\nAssistant:")
        resp = model.generate_content(parts)
        return (getattr(resp, "text", "") or "").strip()
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Failed to chat with Gemini: {str(e)}")
        # If it's a credential error, try to reset and retry once
        if "403" in str(e) and "service-382380612989" in str(e):
            logger.warning("🔄 Detected credential issue, forcing model reset...")
            # Force reset everything
            reset_model_cache()
            # Reset model cache to force reinitialization
            try:
                model = _get_model()
                resp = model.generate_content(parts)
                return (getattr(resp, "text", "") or "").strip()
            except Exception as retry_error:
                logger.error(f"Retry failed: {str(retry_error)}")
        return f"Sorry, I'm having trouble responding right now. Error: {str(e)}"
