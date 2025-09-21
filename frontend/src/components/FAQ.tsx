import React, { useEffect, useState } from "react";
import { listFAQ } from "../services/api";
import type { FAQItem } from "../services/api";

const FAQ: React.FC = () => {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await listFAQ();
        setFaqs(res.faqs || []);
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">People's Legal FAQ</h1>
      <ul className="space-y-3">
        {faqs.map((q) => (
          <li key={q.id} className="border rounded p-3">
            <div className="font-semibold">{q.question || "Question"}</div>
            <div className="text-sm mt-1">{q.answer || "Answer coming soon."}</div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FAQ;
