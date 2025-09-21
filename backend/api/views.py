import base64
from datetime import datetime
from typing import Any, Dict

from django.utils.timezone import now
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status

from .serializers import UploadSerializer, AnalyzeRequestSerializer, ReminderSerializer, VoiceQnASerializer
from .services import gcs, firestore
from .services import vertex
from django.core.files.uploadedfile import UploadedFile


@method_decorator(csrf_exempt, name="dispatch")
class UploadView(APIView):
    permission_classes = [AllowAny]
    authentication_classes: list = []  # Avoid SessionAuthentication -> CSRF enforcement

    def post(self, request):
        serializer = UploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        file_obj = serializer.validated_data["file"]
        category = serializer.validated_data["category"]
        user_id = getattr(getattr(request, "user", None), "uid", None)

        # Use literal "None" folder if user_id is falsy to match existing bucket structure
        folder = str(user_id) if user_id else "None"
        destination_path = f"uploads/{folder}/{now().strftime('%Y/%m/%d')}/{file_obj.name}"
        _, public_url = gcs.upload_file(file_obj, destination_path, file_obj.content_type or "application/octet-stream")

        doc_id = firestore.save_document_metadata(
            user_id,
            {
                "filename": file_obj.name,
                "contentType": file_obj.content_type,
                "category": category,
                "gcsPath": destination_path,
                "publicUrl": public_url,
                "status": "uploaded",
            },
        )
        return Response({"document_id": doc_id, "gcs_path": destination_path})


@method_decorator(csrf_exempt, name="dispatch")
class AnalyzeView(APIView):
    permission_classes = [AllowAny]
    authentication_classes: list = []  # Ensure no SessionAuthentication

    def get(self, request, document_id: str):
        user_id = getattr(getattr(request, "user", None), "uid", None)
        try:
            document = firestore.get_document(user_id, document_id)
        except PermissionError:
            return Response({"error": "Document not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"AnalyzeView document fetch error: {str(e)}")
            return Response({"error": "Failed to fetch document"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        gcs_path = document.get("gcsPath")
        if not gcs_path:
            return Response({"error": "Document path missing"}, status=status.HTTP_400_BAD_REQUEST)
        # Determine if original file was a Word doc and convert if needed
        original_ct = (document.get("contentType") or "").lower()
        try:
            if original_ct in ("application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document") or gcs_path.lower().endswith((".doc", ".docx")):
                # Fetch original bytes, convert to plain text using python-docx
                try:
                    from docx import Document  # type: ignore
                except Exception:
                    return Response({"error": "Word file conversion not available on server (python-docx missing)"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

                file_bytes = gcs.get_blob_bytes(gcs_path)
                # Write to temp and read via python-docx
                import tempfile
                with tempfile.NamedTemporaryFile(suffix=".docx", delete=True) as tmp:
                    tmp.write(file_bytes)
                    tmp.flush()
                    docx_doc = Document(tmp.name)
                    text = "\n".join([p.text for p in docx_doc.paragraphs])
                text_bytes = text.encode("utf-8")
                converted_path = gcs_path.rsplit(".", 1)[0] + ".txt"
                _, gcs_uri = gcs.upload_bytes(text_bytes, converted_path, "text/plain")
                mime_type = "text/plain"
            else:
                gcs_uri = gcs.path_to_uri(gcs_path)
                mime_type = vertex._get_mime_type(gcs_uri)
        except Exception as conv_err:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Document conversion failed: {str(conv_err)}")
            return Response({"error": "Failed to convert document for analysis"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        try:
            summary = vertex.summarize_document(gcs_uri)
            risks = vertex.analyze_risks(gcs_uri)
            glossary = vertex.extract_glossary(gcs_uri)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Vertex analysis failed for {gcs_uri}: {str(e)}")
            return Response({"error": "Analysis failed", "details": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({
            "document_id": document_id,
            "summary": summary,
            "risks": risks,
            "glossary": glossary,
        })


@method_decorator(csrf_exempt, name="dispatch")
class ReminderView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ReminderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        user_id = getattr(getattr(request, "user", None), "uid", None)

        reminder_id = firestore.upsert_reminder(user_id, {
            "title": data["title"],
            "dueDate": data.get("due_date"),
            "notes": data.get("notes", ""),
            "userEmail": getattr(request.user, "email", None) if hasattr(request.user, "email") else None,
        })
        return Response({"reminder_id": reminder_id}, status=status.HTTP_201_CREATED)


@method_decorator(csrf_exempt, name="dispatch")
class FAQView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        faqs = firestore.list_faq(limit=20)
        return Response({"faqs": faqs})


@method_decorator(csrf_exempt, name="dispatch")
class VoiceQnAView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VoiceQnASerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        language = data.get("language", "en")
        question = data.get("question", "")
        audio_b64 = data.get("audio_base64", "")

        if not question and audio_b64:
            question = vertex.stt_transcribe(audio_b64, language=language)

        answer = vertex.answer_question(context_uri="", question=question, language=language)
        answer_audio_b64 = vertex.tts_synthesize(answer, language=language)

        return Response({
            "question": question,
            "answer": answer,
            "answer_audio_base64": answer_audio_b64,
        })


@method_decorator(csrf_exempt, name="dispatch")
class ChatView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data or {}
        messages = data.get("messages", [])
        document_id = data.get("document_id")
        context_uri = None
        if document_id:
            user_id = getattr(getattr(request, "user", None), "uid", None)
            doc = firestore.get_document(user_id, document_id)
            gcs_path = doc.get("gcsPath")
            context_uri = gcs.path_to_uri(gcs_path)
        reply = vertex.chat_with_gemini(messages, context_uri)
        return Response({"reply": reply})


# Function-based chat endpoint for simple connectivity testing and easy future extension
@csrf_exempt
@api_view(["POST"])  # DRF view handling JSON POST
@permission_classes([AllowAny])  # Public access; add auth later if needed
@authentication_classes([])  # Remove SessionAuthentication to avoid CSRF enforcement
def chat_endpoint(request):
    # Accept { "message": "..." } or { "messages": [...], "document_id"?: str }
    try:
        data = request.data or {}
        messages = data.get("messages")
        document_id = data.get("document_id")
        if not messages:
            message = (data.get("message") or "").strip()
            if not message:
                return Response({"error": "'message' is required"}, status=status.HTTP_400_BAD_REQUEST)
            messages = [{"role": "user", "content": message}]

        try:
            context_uri = None
            if document_id:
                try:
                    user_id = getattr(getattr(request, "user", None), "uid", None)
                    doc = firestore.get_document(user_id, document_id)
                    gcs_path = doc.get("gcsPath")
                    context_uri = f"gs://{gcs_path}" if not gcs_path.startswith("gs://") else gcs_path
                except Exception:
                    context_uri = None
            reply_text = vertex.chat_with_gemini(messages, context_uri)
        except Exception as vertex_error:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Vertex AI chat error: {str(vertex_error)}")
            return Response({"error": "Failed to get reply from Vertex AI"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({"reply": reply_text or ""})

    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.exception(f"Unexpected error in chat endpoint: {str(e)}")
        return Response({"error": "Unexpected server error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
