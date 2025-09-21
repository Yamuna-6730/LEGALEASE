import { createContext, useContext, useMemo } from "react";

export type Lang = "en" | "hi" | "ta" | "te";

const dict: Record<Lang, Record<string, string>> = {
  en: {
    upload_title: "Upload Document",
    category: "Category",
    choose_file: "Choose File",
    submit: "Submit",
    analysis_title: "Document Analysis",
    summary: "Summary",
    risks: "Risks",
    glossary: "Glossary",
    voice_title: "Voice Q&A",
    reminders_title: "Reminders",
    faq_title: "People's Legal FAQ",
    simulator_title: "Decision Simulator",
    learning_title: "Learning Pathways",
  },
  hi: {
    upload_title: "दस्तावेज़ अपलोड करें",
    category: "श्रेणी",
    choose_file: "फाइल चुनें",
    submit: "जमा करें",
    analysis_title: "दस्तावेज़ विश्लेषण",
    summary: "सारांश",
    risks: "जोखिम",
    glossary: "शब्दावली",
    voice_title: "वॉइस प्रश्नोत्तर",
    reminders_title: "रिमाइंडर",
    faq_title: "जनता के कानूनी प्रश्न",
    simulator_title: "निर्णय सिम्युलेटर",
    learning_title: "सीखने के मार्ग",
  },
  ta: {
    upload_title: "ஆவணத்தை பதிவேற்று",
    category: "வகை",
    choose_file: "கோப்பை தேர்ந்தெடு",
    submit: "சமர்ப்பிக்க",
    analysis_title: "ஆவண பகுப்பாய்வு",
    summary: "சுருக்கம்",
    risks: "அபாயங்கள்",
    glossary: "சொற்களஞ்சியம்",
    voice_title: "குரல் கேள்வி & பதில்",
    reminders_title: "நினைவூட்டல்கள்",
    faq_title: "மக்களின் சட்ட கேள்விகள்",
    simulator_title: "முடிவு சிமுலேட்டர்",
    learning_title: "கற்றல் பாதைகள்",
  },
  te: {
    upload_title: "పత్రాన్ని అప్‌లోడ్ చేయండి",
    category: "వర్గం",
    choose_file: "ఫైల్ ఎంచుకోండి",
    submit: "సమర్పించండి",
    analysis_title: "పత్ర విశ్లేషణ",
    summary: "సారాంశం",
    risks: "ప్రమాదాలు",
    glossary: "పదకోశం",
    voice_title: "వాయిస్ ప్రశ్నలు-జవాబులు",
    reminders_title: "స్మరణికలు",
    faq_title: "ప్రజల న్యాయ ప్రశ్నలు",
    simulator_title: "నిర్ణయ సిమ్యులేటర్",
    learning_title: "అభ్యాస మార్గాలు",
  },
};

export const LangContext = createContext<Lang>("en");
export const LangSetterContext = createContext<((l: Lang) => void) | null>(null);

export function useCurrentLang(): Lang {
  return useContext(LangContext);
}

export function useSetLang(): (l: Lang) => void {
  const setter = useContext(LangSetterContext);
  return setter || (() => {});
}

export function useT(lang?: Lang) {
  const ctxLang = useCurrentLang();
  const effectiveLang = lang || ctxLang || "en";
  return useMemo(() => {
    const t = (key: string) => dict[effectiveLang][key] || dict.en[key] || key;
    return { t };
  }, [effectiveLang]);
}
