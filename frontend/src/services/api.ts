export type UploadResponse = {
  document_id: string;
  gcs_path: string;
};

export type AnalyzeResponse = {
  document_id: string;
  summary: string;
  risks: { clause: string; risk: string; explanation: string }[];
  glossary: { term: string; definition: string }[];
};

export type VoiceQnAResponse = {
  question: string;
  answer: string;
  answer_audio_base64: string;
};

export type ReminderCreateResponse = { reminder_id: string };
export type FAQItem = { id: string; question?: string; answer?: string; popularity?: number };

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

async function getAuthToken(): Promise<string | null> {
  try {
    const { getAuth } = await import("firebase/auth");
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return null;
    return await user.getIdToken();
  } catch (_e) {
    return null;
  }
}

async function authorizedFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const token = await getAuthToken();
  const headers = new Headers(init.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}

export async function uploadDocument(category: string, file: File): Promise<UploadResponse> {
  const form = new FormData();
  form.append("category", category);
  form.append("file", file);

  const resp = await authorizedFetch(`${API_BASE}/api/upload/`, {
    method: "POST",
    body: form,
  });
  if (!resp.ok) throw new Error(`Upload failed: ${resp.status}`);
  return resp.json();
}

export async function analyzeDocument(documentId: string): Promise<AnalyzeResponse> {
  const resp = await authorizedFetch(`${API_BASE}/api/analyze/${documentId}/`);
  if (!resp.ok) throw new Error(`Analyze failed: ${resp.status}`);
  return resp.json();
}

export async function voiceQnA(payload: { question?: string; audio_base64?: string; language?: string }): Promise<VoiceQnAResponse> {
  const resp = await authorizedFetch(`${API_BASE}/api/voice-qna/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) throw new Error(`Voice QnA failed: ${resp.status}`);
  return resp.json();
}

export async function createReminder(reminder: { title: string; due_date?: string; notes?: string }): Promise<ReminderCreateResponse> {
  const resp = await authorizedFetch(`${API_BASE}/api/reminders/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(reminder),
  });
  if (!resp.ok) throw new Error(`Create reminder failed: ${resp.status}`);
  return resp.json();
}

export async function listFAQ(): Promise<{ faqs: FAQItem[] }> {
  const resp = await authorizedFetch(`${API_BASE}/api/faq/`);
  if (!resp.ok) throw new Error(`FAQ fetch failed: ${resp.status}`);
  return resp.json();
}

export async function chat(messages: { role: "user" | "assistant"; content: string }[], documentId?: string): Promise<{ reply: string }> {
  const resp = await authorizedFetch(`${API_BASE}/api/chat/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, document_id: documentId }),
  });
  if (!resp.ok) throw new Error(`Chat failed: ${resp.status}`);
  return resp.json();
}

