
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import Login from "./components/Login";
import Games from "./components/Games";
import Chatbot from "./components/Chatbot";
import Upload from "./components/Upload";
import Analysis from "./components/Analysis";
import VoiceQnA from "./components/VoiceQnA";
import Reminders from "./components/Reminders";
import FAQ from "./components/FAQ";
import Simulator from "./components/Simulator";
import Learning from "./components/Learning";

import { useEffect, useMemo, useState } from "react";
import { LangContext, LangSetterContext } from "./i18n";

const App = () => {
  const [lang, setLang] = useState<"en" | "hi" | "ta" | "te">(() => {
    return (localStorage.getItem("lang") as any) || "en";
  });
  useEffect(() => {
    localStorage.setItem("lang", lang);
    try {
      localStorage.setItem("lang_update_ts", Date.now().toString());
    } catch {}
  }, [lang]);

  const LangSwitcher = useMemo(() => {
    return (
      <div style={{ position: "fixed", top: 10, right: 10, zIndex: 9999 }}>
        <select
          aria-label="Language"
          value={lang}
          onChange={(e) => setLang(e.target.value as any)}
          style={{ padding: 6, borderRadius: 6 }}
        >
          <option value="en">English</option>
          <option value="hi">हिंदी</option>
          <option value="ta">தமிழ்</option>
          <option value="te">తెలుగు</option>
        </select>
      </div>
    );
  }, [lang]);

  return (
    <BrowserRouter>
      <LangContext.Provider value={lang}>
        <LangSetterContext.Provider value={setLang}>
          {LangSwitcher}
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/games" element={<Games />} />
            <Route path="/chatbot" element={<Chatbot />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/analysis/:documentId" element={<Analysis />} />
            <Route path="/voice" element={<VoiceQnA />} />
            <Route path="/reminders" element={<Reminders />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/simulator" element={<Simulator />} />
            <Route path="/learning" element={<Learning />} />
          </Routes>
        </LangSetterContext.Provider>
      </LangContext.Provider>
    </BrowserRouter>
  );
};

export default App;
