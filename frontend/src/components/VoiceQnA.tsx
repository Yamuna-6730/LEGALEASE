import React, { useState } from "react";
import { voiceQnA } from "../services/api";

const VoiceQnA: React.FC = () => {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const ask = async () => {
    if (!question) return;
    setLoading(true);
    try {
      const res = await voiceQnA({ question, language: "en" });
      setAnswer(res.answer);
      if (res.answer_audio_base64) {
        const audio = new Audio(`data:audio/mp3;base64,${res.answer_audio_base64}`);
        audio.play();
      }
    } catch (e) {
      alert("Failed to get answer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4 text-white">
      <h1 className="text-2xl font-semibold">Voice Q&A</h1>
      <textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        className="w-full border rounded p-3 bg-gray-800 text-white"
        rows={3}
        placeholder="Ask a question about your document..."
      />
      <button onClick={ask} disabled={!question || loading} className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50">
        {loading ? "Asking..." : "Ask"}
      </button>
      {answer && (
        <div className="border rounded p-3 bg-gray-900/50">
          <div className="font-semibold mb-1">Answer</div>
          <div>{answer}</div>
        </div>
      )}
    </div>
  );
};

export default VoiceQnA;
