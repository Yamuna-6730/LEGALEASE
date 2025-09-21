from rest_framework import serializers


class UploadSerializer(serializers.Serializer):
    category = serializers.ChoiceField(choices=["Bank", "Health", "School/College", "Government", "Other"])
    file = serializers.FileField()


class AnalyzeRequestSerializer(serializers.Serializer):
    document_id = serializers.CharField()


class ReminderSerializer(serializers.Serializer):
    title = serializers.CharField()
    due_date = serializers.DateField(required=False, allow_null=True)
    notes = serializers.CharField(required=False, allow_blank=True)


class VoiceQnASerializer(serializers.Serializer):
    question = serializers.CharField(required=False, allow_blank=True)
    audio_base64 = serializers.CharField(required=False, allow_blank=True)
    language = serializers.ChoiceField(default="en", choices=["en", "hi", "ta", "te"])
