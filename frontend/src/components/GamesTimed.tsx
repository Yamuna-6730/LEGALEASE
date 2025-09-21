import React, { useState } from "react";

// Data for the legal dilemmas
interface Dilemma {
  situation: string;
  options: { text: string; consequence: string; isCorrect: boolean }[];
}

const legalDilemmas: Dilemma[] = [
  {
    situation: "Your landlord suddenly raises your rent by 50% with no prior notice. What's your first step?",
    options: [
      { text: "Pay it to avoid conflict.", consequence: "While you avoid conflict, you may be giving up your legal rights. Many jurisdictions have laws about how and when rent can be increased.", isCorrect: false },
      { text: "Check your local tenant laws and lease agreement.", consequence: "Correct! 🎉 This is the best first step. Most places have rules about rent control and require written notice.", isCorrect: true },
      { text: "Refuse to pay and move out immediately.", consequence: "This can lead to a messy legal battle. It's better to know your rights before taking drastic action.", isCorrect: false },
    ],
  },
  {
    situation: "You bought a new appliance, but it broke within a week. The store refuses to replace it. What's your best option?",
    options: [
      { text: "Accept the store's decision.", consequence: "You might be giving up your right to a functioning product. Consumer protection laws exist for a reason!", isCorrect: false },
      { text: "Research your consumer protection rights and demand a replacement or refund.", consequence: "Correct! 🎉 Consumer protection laws often grant you the right to a refund or replacement for faulty goods.", isCorrect: true },
      { text: "Threaten to sue the store immediately.", consequence: "Threatening legal action is often a last resort. It's better to start by asserting your consumer rights first.", isCorrect: false },
    ],
  },
  {
    situation: "Your boss asks you to work overtime without pay, saying it's 'just a part of the job.' What should you do?",
    options: [
      { text: "Work the extra hours to show dedication.", consequence: "Working for free can violate labor laws. Many jobs are legally required to pay for all hours worked.", isCorrect: false },
      { text: "Secretly record a conversation with your boss.", consequence: "While this may provide evidence, some states have laws about recording conversations without consent. It's a risky move.", isCorrect: false },
      { text: "Politely ask to see the company's overtime policy and your employment contract.", consequence: "Correct! 🎉 This is a professional and effective way to understand your rights regarding overtime pay.", isCorrect: true },
    ],
  },
  {
    situation: "You've been offered a scholarship that requires you to maintain a 3.5 GPA. The agreement mentions a penalty for not meeting the requirement. What should you do before signing?",
    options: [
      { text: "Sign it immediately, it's a great opportunity.", consequence: "Signing without understanding the terms could lead to unexpected debt or lost benefits.", isCorrect: false },
      { text: "Look for the specific clause about the GPA requirement and the penalty for not meeting it.", consequence: "Correct! 🎉 Understanding the 'fine print' is crucial. The terms dictate what happens if you can't maintain the GPA.", isCorrect: true },
      { text: "Assume the penalty is small and not worth worrying about.", consequence: "Never assume with legal documents. The penalty could be repaying the full scholarship amount.", isCorrect: false },
    ],
  },
  {
    situation: "You received a new credit card agreement. You notice the introductory APR is 0%, but the regular APR is very high. What's the most important thing to understand?",
    options: [
      { text: "Focus on the rewards program to get the most cash back.", consequence: "While rewards are nice, they won't help if the interest rates are too high. High interest can quickly negate any rewards you earn.", isCorrect: false },
      { text: "Find out when the 0% introductory rate expires and what the standard APR will be afterward.", consequence: "Correct! 🎉 The terms and conditions will tell you exactly when the promotional rate ends and the higher rate kicks in. This is a crucial detail for managing your debt.", isCorrect: true },
      { text: "Trust that the bank will send you a reminder before the interest rate changes.", consequence: "Banks have no obligation to remind you. It's your responsibility to know the terms of the agreement.", isCorrect: false },
    ],
  },
  {
    situation: "Your new employer asks you to sign an NDA (Non-Disclosure Agreement). What should you check before you sign it?",
    options: [
      { text: "Sign it, because NDAs are standard and you don't have a choice.", consequence: "While NDAs are common, you should never sign a document without understanding what information is being protected and for how long. You have the right to ask questions.", isCorrect: false },
      { text: "Check what information is classified as 'confidential' and the duration of the agreement.", consequence: "Correct! 🎉 Understanding what you can't share and for how long is the most critical part of an NDA.", isCorrect: true },
      { text: "Refuse to sign it because it's an invasion of your privacy.", consequence: "Refusing to sign a standard NDA can lead to a job offer being rescinded. It's better to understand it rather than reject it outright.", isCorrect: false },
    ],
  },
  {
    situation: "Your new employment contract includes a non-compete clause. What does this mean for your future job opportunities?",
    options: [
      { text: "It means you can't work for a competitor for 5 years anywhere in the world.", consequence: "Non-compete clauses are usually limited in scope. It's important to check the specific limitations on geography, time, and type of work.", isCorrect: false },
      { text: "It limits your ability to work for a competitor after you leave the company, for a specific period and in a defined geographic area.", consequence: "Correct! 🎉 A legally enforceable non-compete must be reasonable in its limitations. Understanding these limits is key.", isCorrect: true },
      { text: "It prevents you from starting your own business in the same industry.", consequence: "Not necessarily. A non-compete is specifically about working for a competitor, not starting a new business unless it directly competes.", isCorrect: false },
    ],
  },
];

interface GamesTimedProps {
  addPoints: (points: number) => void;
  unlockPowerUp: (powerUpName: 'secondChance' | 'hint') => void;
}

const GamesTimed: React.FC<GamesTimedProps> = ({ addPoints}) => {
  const [currentDilemmaIndex, setCurrentDilemmaIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isGameComplete, setIsGameComplete] = useState(false);

  const currentDilemma = legalDilemmas[currentDilemmaIndex];

  const handleChoice = (option: { text: string; consequence: string; isCorrect: boolean }) => {
    if (isAnswered) return;
    
    setIsAnswered(true);
    setSelectedOption(option.text);
    if (option.isCorrect) {
      setScore(score + 1);
      addPoints(10); // Add 10 points for each correct answer
    }
  };

  const handleNext = () => {
    if (currentDilemmaIndex === legalDilemmas.length - 1) {
      setIsGameComplete(true);
    } else {
      setIsAnswered(false);
      setSelectedOption(null);
      setCurrentDilemmaIndex(prevIndex => prevIndex + 1);
    }
  };

  const handleReset = () => {
    setCurrentDilemmaIndex(0);
    setScore(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setIsGameComplete(false);
  };

  const getOptionClass = (optionText: string) => {
    if (!isAnswered) {
      return "bg-gray-700 hover:bg-gray-600";
    }
    const selectedOptionData = currentDilemma.options.find(opt => opt.text === optionText);
    
    if (selectedOptionData?.isCorrect) {
      return "bg-green-600 text-white font-bold";
    }
    if (optionText === selectedOption) {
      return "bg-red-600 text-white font-bold";
    }
    return "bg-gray-700 opacity-50";
  };

  return (
    <div className="p-6 bg-gray-900 text-white rounded-2xl shadow-xl flex flex-col items-center gap-6">
      <h2 className="text-2xl font-bold text-yellow-400">Legal Dilemma</h2>
      <p className="text-lg text-gray-300">
        Legal Mind Score: <span className="font-bold text-green-400">{score}</span>
      </p>

      {isGameComplete ? (
        <div className="flex flex-col items-center text-center p-8">
          <h3 className="text-3xl font-bold mb-4">You've Completed the Game! 🎉</h3>
          <p className="text-lg">Your final score is **{score}** out of {legalDilemmas.length}.</p>
          <p className="text-lg mt-2">You're on your way to becoming a legal expert!</p>
          <button
            onClick={handleReset}
            className="mt-6 px-6 py-3 bg-purple-600 rounded-lg font-bold hover:bg-purple-700 transition-colors"
          >
            Play Again
          </button>
        </div>
      ) : (
        <>
          <div className="w-full max-w-lg bg-gray-800 p-6 rounded-lg shadow-inner">
            <div className="text-center">
              <p className="text-xl font-semibold mb-4">{currentDilemma.situation}</p>
            </div>

            <div className="mt-6 flex flex-col gap-4">
              {currentDilemma.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleChoice(option)}
                  disabled={isAnswered}
                  className={`w-full px-4 py-3 rounded-lg text-left transition-colors duration-200 ${getOptionClass(option.text)}`}
                >
                  {option.text}
                </button>
              ))}
            </div>
          </div>
          
          {isAnswered && (
            <div className="w-full max-w-lg p-4 bg-gray-700 rounded-lg shadow-inner">
              <p className="font-bold mb-2">Consequence:</p>
              <p>{currentDilemma.options.find(opt => opt.text === selectedOption)?.consequence}</p>
              <button
                onClick={handleNext}
                className="mt-4 w-full px-6 py-3 bg-purple-600 rounded-lg font-bold hover:bg-purple-700 transition-colors"
              >
                {currentDilemmaIndex === legalDilemmas.length - 1 ? "Show Final Score" : "Next Dilemma"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default GamesTimed;
