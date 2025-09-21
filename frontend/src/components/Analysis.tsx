import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { analyzeDocument } from "../services/api";
import type { AnalyzeResponse } from "../services/api";
import { useT } from "../i18n";

const Analysis: React.FC = () => {
  const { documentId } = useParams();
  const [data, setData] = useState<AnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<"en" | "hi" | "ta" | "te">(
    () => (localStorage.getItem("lang") as any) || "en"
  );

  useEffect(() => {
    const handler = () =>
      setLang((localStorage.getItem("lang") as any) || "en");
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);
  const { t } = useT(lang);

  useEffect(() => {
    if (!documentId) return;
    (async () => {
      try {
        const res = await analyzeDocument(documentId);
        setData(res);
      } catch (e) {
        alert("Failed to analyze");
      } finally {
        setLoading(false);
      }
    })();
  }, [documentId]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (!data) return <div className="p-6">No data</div>;

  return (
    <div className="w-full p-8 space-y-10">
      <h1 className="text-3xl font-bold text-center">{t("analysis_title")}</h1>

      {/* Summary Full Width */}
      <section className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold mb-4 text-center">
          {t("summary")}
        </h2>
        <div className="bg-gray-50 border rounded-2xl shadow p-6 text-lg leading-relaxed whitespace-pre-wrap text-center">
          {data.summary}
        </div>
      </section>

      {/* Risks + Glossary Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Risks */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">{t("risks")}</h2>
          <ul className="space-y-3">
            {data.risks.map((r, idx) => (
              <li key={idx} className="border rounded-lg p-4 shadow-sm">
                <div className="font-semibold text-red-600">
                  {r.clause} ({r.risk})
                </div>
                <div className="text-sm">{r.explanation}</div>
              </li>
            ))}
          </ul>
        </section>

        {/* Glossary */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">{t("glossary")}</h2>
          <ul className="space-y-3">
            {data.glossary.map((g, idx) => (
              <li key={idx} className="border rounded-lg p-4 shadow-sm">
                <div className="font-semibold">{g.term}</div>
                <div className="text-sm">{g.definition}</div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
};

export default Analysis;
