import React, { useRef, useState } from "react";
import logo from "../assets/logo.png";
import { Link, useNavigate } from "react-router-dom";
import { uploadDocument, analyzeDocument, voiceQnA, chat } from "../services/api";
import type { AnalyzeResponse } from "../services/api";
import { useCurrentLang, useSetLang } from "../i18n";

type ChatMessage = { role: "user" | "assistant"; content: string };

const blobToBase64 = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const b64 = dataUrl.split(",")[1] || "";
      resolve(b64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

// 🛠 Funny loading one-liners
const loadingOneLiners = [
  "Compiling sarcasm… please hold.",
  "Loading like Windows 98 on dial-up.",
  "Just arguing with my inner code.",
  "Charging neurons with double espresso shots.",
  "Searching for wisdom in the cookie jar.",
  "Debugging my thoughts… this may take forever.",
  "Almost done… just kidding.",
  "Contacting alien servers for advice.",
  "Slowly reinventing the wheel.",
  "Running on potato Wi-Fi right now.",
  "Calibrating sarcasm levels.",
  "Assembling words from the void.",
  "Still faster than government paperwork.",
  "Reticulating splines… wait, wrong game.",
  "Negotiating with the cloud overlords.",
  "Taking a scenic route through your data.",
  "Cooking up answers in the microwave.",
  "Pretending to think deeply.",
  "Polishing the digital crystal ball.",
  "Almost there… unless I crash dramatically.",
];

const Chatbot: React.FC = () => {
  // Chat state
  const [messages, setMessages] = useState<{ type: "user" | "bot"; text: string }[]>([]);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [waiting, setWaiting] = useState(false);

  // Upload + Analyze state
  const [showUploadPanel, setShowUploadPanel] = useState(false);
  const [category, setCategory] = useState<string>("Bank");
  const [file, setFile] = useState<File | null>(null);
  const [lastDocumentId, setLastDocumentId] = useState<string | undefined>(undefined);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null);

  // Voice Q&A state
  const [asking, setAsking] = useState(false);
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const recognitionRef = useRef<any>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();
  const lang = useCurrentLang();
  const setLang = useSetLang();

  const resetChat = () => {
    setMessages([]);
    setHistory([]);
    setInput("");
    setWaiting(false);
    setShowUploadPanel(false);
    setFile(null);
    setLastDocumentId(undefined);
    setAnalyzing(false);
    setAnalysis(null);
    setAsking(false);
    setRecording(false);
    if (fileInputRef.current) (fileInputRef.current as HTMLInputElement).value = "";
  };

  const getRandomLoadingLine = () =>
    loadingOneLiners[Math.floor(Math.random() * loadingOneLiners.length)];

  const sendChat = async (q: string) => {
    setMessages((prev) => [...prev, { type: "user", text: q }]);
    const nextHistory: ChatMessage[] = [...history, { role: "user" as const, content: q }];
    setHistory(nextHistory);
    try {
      setWaiting(true);
      const res = await chat(nextHistory, lastDocumentId);
      setHistory((h) => [...h, { role: "assistant" as const, content: res.reply || "" }]);
      setMessages((prev) => [...prev, { type: "bot", text: res.reply || "" }]);
    } catch (_e) {
      setMessages((prev) => [...prev, { type: "bot", text: "Couldn't reach chat service." }]);
    } finally {
      setWaiting(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const q = input.trim();
    setInput("");
    await sendChat(q);
  };

  const runUploadAndAnalyze = async () => {
    if (!file) return;
    setAnalyzing(true);
    setAnalysis(null);
    setMessages((prev) => [...prev, { type: "bot", text: "File received. Running analysis..." }]);
    try {
      const up = await uploadDocument(category, file);
      setLastDocumentId(up.document_id);
      const res = await analyzeDocument(up.document_id);
      setAnalysis(res);
      setMessages((prev) => [
        ...prev,
        { type: "bot", text: "Analysis complete. Summary and risks shown below." },
      ]);
    } catch (_e) {
      setMessages((prev) => [...prev, { type: "bot", text: "Upload/Analyze failed. Please try again." }]);
    } finally {
      setAnalyzing(false);
      setShowUploadPanel(false);
      if (fileInputRef.current) (fileInputRef.current as HTMLInputElement).value = "";
      setFile(null);
    }
  };

  const stopRecordingAndSend = async () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    recorder.stop();
  };

  const onMicClick = async () => {
    if (input.trim()) {
      const q = input.trim();
      setInput("");
      await sendChat(q);
      return;
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      try {
        const rec = new SR();
        recognitionRef.current = rec;
        rec.lang = "en-US";
        rec.interimResults = false;
        rec.maxAlternatives = 1;
        rec.onresult = async (e: any) => {
          const transcript = e.results[0][0].transcript || "";
          setInput(transcript);
          await sendChat(transcript);
        };
        rec.onend = () => setRecording(false);
        rec.onerror = () => setRecording(false);
        rec.start();
        setRecording(true);
        return;
      } catch {
        // fallback
      }
    }

    if (!recording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mr = new MediaRecorder(stream);
        mediaRecorderRef.current = mr;
        chunksRef.current = [];
        mr.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
        };
        mr.onstop = async () => {
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          chunksRef.current = [];
          try {
            const b64 = await blobToBase64(blob);
            setAsking(true);
            const stt = await voiceQnA({ audio_base64: b64, language: "en" });
            const q = stt.question || "";
            if (q) await sendChat(q);
            else setMessages((prev) => [...prev, { type: "bot", text: "Could not recognize speech." }]);
          } catch {
            setMessages((prev) => [...prev, { type: "bot", text: "Could not process voice input." }]);
          } finally {
            setAsking(false);
            setRecording(false);
            stream.getTracks().forEach((t) => t.stop());
          }
        };
        mr.start();
        setRecording(true);
      } catch {
        setMessages((prev) => [...prev, { type: "bot", text: "Microphone not available. Type your question instead." }]);
      }
    } else {
      await stopRecordingAndSend();
    }
  };

  const onClickPaperclip = () => setShowUploadPanel((v) => !v);

  const onHiddenFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    if (f) setFile(f);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white relative overflow-hidden">
      {/* Header */}
      <header className="absolute top-0 left-0 w-full flex justify-between items-center py-2 px-20 z-20">
        <img src={logo} alt="LegalScan Logo" className="h-22 md:h-24 cursor-pointer" onClick={() => navigate("/")} />
        <nav className="flex space-x-10 text-lg items-center">
          <Link to="/" className="text-white font-semibold hover:text-yellow-400 transition-colors duration-300">Home</Link>
          <Link to="/games" className="text-white font-semibold hover:text-yellow-400 transition-colors duration-300">Games</Link>
          <Link to="/login" className="text-white font-semibold hover:text-blue-400 transition-colors duration-300">Login</Link>
          <select aria-label="Language" value={lang} onChange={(e) => setLang(e.target.value as any)} className="bg-gray-800 text-white rounded px-2 py-1 border border-gray-700">
            <option value="en">EN</option>
            <option value="hi">हि</option>
            <option value="ta">த</option>
            <option value="te">తె</option>
          </select>
        </nav>
      </header>

      <main className="flex flex-col items-center justify-start min-h-screen relative z-10 px-4 md:px-8 pt-28">
        {/* New Chat Button */}
        <div className="w-full max-w-6xl mb-6 flex justify-center">
          <button 
            onClick={resetChat}
            className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-semibold transition-colors duration-300 shadow-lg"
          >
            📝 New Chat
          </button>
        </div>

        {/* Full Width Chat Container */}
        <div className="w-full max-w-6xl">
          <div className="flex flex-col w-full h-[600px] bg-gray-900/50 rounded-2xl p-6 shadow-xl overflow-y-auto">
            <div className="flex-1 space-y-4 mb-4 mt-2">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`${msg.type === "user" ? "bg-blue-500 text-white ml-auto rounded-br-sm" : "bg-yellow-400 text-black mr-auto rounded-bl-sm"} p-3 rounded-2xl max-w-[80%] shadow`}
                >
                  {msg.text}
                </div>
              ))}
              {waiting && (
                <div className="bg-yellow-400 text-black mr-auto rounded-bl-sm p-3 rounded-2xl max-w-[80%] shadow animate-pulse">
                  🤖 {getRandomLoadingLine()}
                </div>
              )}
            </div>

            {/* Upload quick form */}
            {showUploadPanel && (
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-3 mb-3">
                <div className="flex gap-2 items-center mb-2">
                  <label className="text-sm">Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="bg-gray-900 text-white border border-gray-700 rounded px-2 py-1">
                    {["Bank", "Health", "School/College", "Government", "Other"].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input ref={fileInputRef} type="file" onChange={onHiddenFileChange} className="text-white" />
                  <button onClick={runUploadAndAnalyze} disabled={!file || analyzing} className="bg-blue-600 text-white px-3 py-1 rounded disabled:opacity-50">
                    {analyzing ? "Analyzing..." : "Analyze"}
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center mt-auto gap-2">
              <button title="Upload & Analyze" onClick={onClickPaperclip} className="bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded">📎</button>
              <button title={recording ? "Stop" : "Voice Ask"} onClick={onMicClick} disabled={asking} className={`px-3 py-2 rounded ${recording ? "bg-red-600" : "bg-gray-800 hover:bg-gray-700"}`}>{recording ? "■" : "🎤"}</button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question..."
                className="flex-1 rounded-xl px-4 py-2 text-white placeholder-gray-300 bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button onClick={handleSend} className="bg-blue-500 px-4 py-2 rounded-xl font-bold hover:bg-blue-600 transition-colors">Send</button>
            </div>
          </div>
        </div>

        {/* Full Width Analysis Results */}
        {analysis && (
          <div className="w-full max-w-6xl mt-6 space-y-6">
            <section>
              <h2 className="text-2xl font-medium mb-4 text-center">Analysis Results</h2>
            </section>
            <section className="bg-gray-900/50 rounded-2xl p-6 shadow-xl">
              <h3 className="text-xl font-medium mb-4">Summary</h3>
              <p className="bg-gray-50 text-black rounded-xl p-4 whitespace-pre-wrap text-lg leading-relaxed">{analysis?.summary}</p>
            </section>
            <section className="bg-gray-900/50 rounded-2xl p-6 shadow-xl">
              <h3 className="text-xl font-medium mb-4">Risks</h3>
              <ul className="space-y-4">
                {analysis?.risks?.map((r, idx) => (
                  <li key={idx} className="border border-gray-600 rounded-xl p-4 bg-gray-800/30">
                    <div className="font-semibold text-red-400 text-lg mb-2">{r.clause} ({r.risk})</div>
                    <div className="text-gray-200 leading-relaxed">{r.explanation}</div>
                  </li>
                ))}
              </ul>
            </section>
            <section className="bg-gray-900/50 rounded-2xl p-6 shadow-xl">
              <h3 className="text-xl font-medium mb-4">Glossary</h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analysis?.glossary?.map((g, idx) => (
                  <li key={idx} className="border border-gray-600 rounded-xl p-4 bg-gray-800/30">
                    <div className="font-semibold text-yellow-400 mb-2">{g.term}</div>
                    <div className="text-sm text-gray-200 leading-relaxed">{g.definition}</div>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}
      </main>

      {/* Glow Effects */}
      <div className="absolute top-40 left-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-yellow-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
    </div>
  );
};

export default Chatbot;
