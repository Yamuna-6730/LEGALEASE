from django.test import TestCase
from rest_framework.test import APIClient
from django.core.files.uploadedfile import SimpleUploadedFile
import base64


class ApiEndpointsTest(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_upload_and_analyze_flow(self):
        # Upload a small text file
        upload_file = SimpleUploadedFile(
            "sample.txt", b"This is a sample legal document.", content_type="text/plain"
        )
        resp = self.client.post(
            "/api/upload/", {"category": "Bank", "file": upload_file}, format="multipart"
        )
        self.assertEqual(resp.status_code, 200)
        document_id = resp.data.get("document_id")
        self.assertTrue(document_id)

        # Analyze uploaded document (dev stubs)
        analyze_resp = self.client.get(f"/api/analyze/{document_id}/")
        self.assertEqual(analyze_resp.status_code, 200)
        self.assertIn("summary", analyze_resp.data)
        self.assertIn("risks", analyze_resp.data)
        self.assertIn("glossary", analyze_resp.data)

    def test_reminders(self):
        resp = self.client.post(
            "/api/reminders/",
            {"title": "Renew policy", "notes": "Due next month"},
            format="json",
        )
        self.assertEqual(resp.status_code, 201)
        self.assertIn("reminder_id", resp.data)

    def test_faq_list(self):
        resp = self.client.get("/api/faq/")
        self.assertEqual(resp.status_code, 200)
        self.assertIn("faqs", resp.data)

    def test_voice_qna(self):
        # Provide text question to avoid STT
        resp = self.client.post(
            "/api/voice-qna/",
            {"question": "What happens if I don't pay my EMI?", "language": "en"},
            format="json",
        )
        self.assertEqual(resp.status_code, 200)
        self.assertIn("answer", resp.data)
        self.assertIn("answer_audio_base64", resp.data)
