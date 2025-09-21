import React, { useState } from "react";

const modules = [
  { id: "rental-basics", title: "Rental Agreement Basics", points: 50 },
  { id: "loan-terms", title: "Loan Terms & EMI", points: 60 },
  { id: "insurance", title: "Health Insurance Essentials", points: 40 },
];

const initialProgress: Record<string, boolean> = {
  "rental-basics": false,
  "loan-terms": false,
  "insurance": false,
};

const leaderboard = [
  { name: "Asha", points: 180 },
  { name: "Ravi", points: 120 },
  { name: "Meera", points: 90 },
];

const Learning: React.FC = () => {
  const [progress, setProgress] = useState<Record<string, boolean>>(initialProgress);

  const totalPoints = modules.reduce((sum, m) => sum + (progress[m.id] ? m.points : 0), 0);
  const badges = [
    { id: "starter", title: "Starter", earned: totalPoints >= 40 },
    { id: "achiever", title: "Achiever", earned: totalPoints >= 120 },
    { id: "expert", title: "Expert", earned: totalPoints >= 200 },
  ];

  const toggleModule = (id: string) => {
    setProgress((p) => ({ ...p, [id]: !p[id] }));
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Learning Pathways</h1>

      <section className="space-y-3">
        <h2 className="text-xl font-medium">Modules</h2>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {modules.map((m) => (
            <li key={m.id} className="border rounded p-4 flex items-center justify-between">
              <div>
                <div className="font-semibold">{m.title}</div>
                <div className="text-sm text-gray-600">{m.points} pts</div>
              </div>
              <button
                onClick={() => toggleModule(m.id)}
                className={`px-3 py-2 rounded ${progress[m.id] ? "bg-green-600 text-white" : "bg-gray-200"}`}
              >
                {progress[m.id] ? "Completed" : "Mark Complete"}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-medium">Badges</h2>
        <div className="flex gap-3 flex-wrap">
          {badges.map((b) => (
            <div key={b.id} className={`border rounded p-3 ${b.earned ? "bg-yellow-100 border-yellow-300" : "bg-gray-50"}`}>
              <div className="font-semibold">{b.title}</div>
              <div className="text-sm">{b.earned ? "Earned" : "Locked"}</div>
            </div>
          ))}
        </div>
        <div className="text-sm text-gray-700">Total Points: {totalPoints}</div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-medium">Leaderboard</h2>
        <ol className="space-y-2">
          {leaderboard.map((row, idx) => (
            <li key={idx} className="border rounded p-3 flex items-center justify-between">
              <div>
                <span className="font-semibold mr-2">#{idx + 1}</span>
                {row.name}
              </div>
              <div className="text-sm">{row.points} pts</div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
};

export default Learning;
