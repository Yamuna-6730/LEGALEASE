# LegalEase

AI-powered web app to help users understand and manage complex legal documents.

**Link to LegalEase:** [Demo Link](https://spry-shade-471512-s6.web.app/games)

## Monorepo Layout

- backend/ (Django + DRF + GCP + Firebase auth)
- frontend/ (React + Vite + Tailwind)

## Prerequisites

- Python 3.11+
- Node 18+
- Google Cloud project with: Storage, Firestore, Vertex AI, Speech-to-Text, Text-to-Speech
- Firebase project for Authentication

## Backend Setup

1. Create and activate a virtualenv
2. Install dependencies

```bash
cd backend
pip install -r requirements.txt
```

3. Environment variables (create `.env` in `backend/`):

```
DJANGO_SECRET_KEY=dev-secret
DEBUG=true
ALLOWED_HOSTS=*
GCP_PROJECT_ID=your-project
GCS_BUCKET_NAME=your-bucket
GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/service-account.json
FIREBASE_CREDENTIALS_JSON={"type":"service_account",...}
VERTEX_LOCATION=us-central1
VERTEX_MODEL=gemini-1.5-pro
```

4. Run server

```bash
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

## Frontend Setup

```bash
cd frontend
npm install
# .env for frontend (create `frontend/.env`)
# VITE_API_BASE_URL=http://localhost:8000
# VITE_FB_* for Firebase web config
npm run dev
```

## Core Flows

- Upload: `/upload` → uploads file (dev uses placeholders) → redirect to `/analysis/:id`
- Analysis: `/analysis/:id` → summary, risks, glossary
- Voice Q&A: `/voice` → ask questions, hear answers
- Reminders: `/reminders` → create reminders (stored in Firestore)
- FAQ: `/faq` → popular questions
- Simulator: `/simulator` → decision outcomes
- Learning: `/learning` → modules, badges, leaderboard

## Tests

```bash
cd backend
python manage.py test
```

## Notes

- Vertex AI, STT, and TTS are stubbed for local dev; integrate real clients in `backend/api/services/vertex.py`.
- Firebase auth is minimal; pass ID token as `Authorization: Bearer <token>` when securing endpoints.
