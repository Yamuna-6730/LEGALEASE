from django.urls import path
from .views import UploadView, AnalyzeView, FAQView, ReminderView, VoiceQnAView, ChatView, chat_endpoint

urlpatterns = [
    path("upload/", UploadView.as_view(), name="upload"),
    path("analyze/<str:document_id>/", AnalyzeView.as_view(), name="analyze"),
    path("faq/", FAQView.as_view(), name="faq"),
    path("reminders/", ReminderView.as_view(), name="reminders"),
    path("voice-qna/", VoiceQnAView.as_view(), name="voice_qna"),
    # Function-based endpoint for CSRF-exempt connectivity test
    path("chat/", chat_endpoint, name="chat"),
]

