import React, { useState } from "react";

const steps = {
  start: {
    text: "Loan Scenario: You miss this month's EMI. What next?",
    options: [
      { label: "Pay within grace period", next: "grace" },
      { label: "Skip again", next: "skip" },
    ],
  },
  grace: {
    text: "Bank may not report a default. Small late fee applied.",
    options: [{ label: "Acknowledge", next: "end" }],
  },
  skip: {
    text: "Credit score impact and penalties increase. Bank may call.",
    options: [
      { label: "Negotiate with bank", next: "negotiate" },
      { label: "Ignore calls", next: "default" },
    ],
  },
  negotiate: {
    text: "Restructuring possible. New schedule created.",
    options: [{ label: "End", next: "end" }],
  },
  default: {
    text: "Legal notice risk. Asset repossession possible.",
    options: [{ label: "End", next: "end" }],
  },
  end: { text: "Simulation complete.", options: [] },
} as const;

type StepKey = keyof typeof steps;

const Simulator: React.FC = () => {
  const [step, setStep] = useState<StepKey>("start");
  const s = steps[step];

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Decision Simulator</h1>
      <div className="border rounded p-4 bg-gray-50">{s.text}</div>
      <div className="flex gap-3 flex-wrap">
        {s.options.map((o, idx) => (
          <button key={idx} onClick={() => setStep(o.next as StepKey)} className="bg-blue-600 text-white px-3 py-2 rounded">
            {o.label}
          </button>
        ))}
        {step !== "start" && (
          <button onClick={() => setStep("start")} className="bg-gray-200 px-3 py-2 rounded">Reset</button>
        )}
      </div>
    </div>
  );
};

export default Simulator;
