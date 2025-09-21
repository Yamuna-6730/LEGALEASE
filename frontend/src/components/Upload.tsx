import React, { useEffect, useState } from "react";
import { uploadDocument } from "../services/api";
import { useNavigate } from "react-router-dom";
import { useT } from "../i18n";

const categories = ["Bank", "Health", "School/College", "Government", "Other"] as const;

const Upload: React.FC = () => {
  const [category, setCategory] = useState<string>(categories[0]);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [lang, setLang] = useState<"en" | "hi" | "ta" | "te">(() => (localStorage.getItem("lang") as any) || "en");
  useEffect(() => {
    const handler = () => setLang(((localStorage.getItem("lang") as any) || "en"));
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);
  const { t } = useT(lang);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    try {
      const res = await uploadDocument(category, file);
      navigate(`/analysis/${res.document_id}`);
    } catch (e) {
      alert("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 text-white">
      <h1 className="text-2xl font-semibold mb-4">{t("upload_title")}</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">{t("category")}</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border rounded px-3 py-2 bg-gray-800 text-white"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t("choose_file")}</label>
          <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="w-full text-white" />
        </div>
        <button disabled={!file || loading} className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50">
          {loading ? "Uploading..." : t("submit")}
        </button>
      </form>
    </div>
  );
};

export default Upload;
