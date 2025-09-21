import React, { useState } from "react";
import { createReminder } from "../services/api";

const Reminders: React.FC = () => {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await createReminder({ title, due_date: dueDate || undefined, notes });
      setCreatedId(res.reminder_id);
      setTitle("");
      setDueDate("");
      setNotes("");
    } catch (e) {
      alert("Failed to create reminder");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 space-y-4 text-white">
      <h1 className="text-2xl font-semibold">Reminders</h1>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input className="w-full border rounded px-3 py-2 bg-gray-800 text-white" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Due Date</label>
          <input type="date" className="w-full border rounded px-3 py-2 bg-gray-800 text-white" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea className="w-full border rounded px-3 py-2 bg-gray-800 text-white" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <button disabled={!title || loading} className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50">{loading ? "Creating..." : "Create Reminder"}</button>
      </form>
      {createdId && <div className="text-green-400">Created reminder: {createdId}</div>}
    </div>
  );
};

export default Reminders;
