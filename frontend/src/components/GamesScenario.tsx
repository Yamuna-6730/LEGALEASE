import React, { useState, useEffect } from "react";

interface LegalPair {
  term: string;
  definition: string;
}

interface Item {
  id: number;
  content: string;
  pairId: number;
  isMatched: boolean;
  type: string;
}

// Data for the matching game.
const legalPairs: LegalPair[] = [
  { term: "TORT", definition: "A wrongful act causing civil liability." },
  { term: "DEED", definition: "A legal document that transfers property ownership." },
  { term: "LIEN", definition: "A legal claim on property as security for a debt." },
  { term: "LEASE", definition: "A contract to rent property." },
  { term: "LOAN", definition: "A sum of money lent at interest." },
  { term: "AGENT", definition: "A person who acts on behalf of another." },
  { term: "CONTRACT", definition: "A legally binding agreement between parties." },
  { term: "ESTATE", definition: "A person's total property, assets, and liabilities." },
];

interface GamesScenarioProps {
  addPoints: (points: number) => void;
  unlockPowerUp: (powerUpName: 'secondChance' | 'hint') => void;
}

const GamesScenario: React.FC<GamesScenarioProps> = ({ addPoints}) => {
  const [terms, setTerms] = useState<Item[]>([]);
  const [definitions, setDefinitions] = useState<Item[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<Item | null>(null);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState("");
  const [isGameComplete, setIsGameComplete] = useState(false);

  useEffect(() => {
    startGame();
  }, []);

  const startGame = () => {
    // Reset game state
    setSelectedTerm(null);
    setScore(0);
    setMessage("");
    setIsGameComplete(false);

    // Create and shuffle the terms and definitions
    const initialTerms = legalPairs.map((pair, index) => ({
      id: index,
      content: pair.term,
      pairId: index,
      isMatched: false,
      type: "term",
    }));

    const shuffledDefinitions = legalPairs.map((pair, index) => ({
      id: index,
      content: pair.definition,
      pairId: index,
      isMatched: false,
      type: "definition",
    }));

    // Simple shuffle function
    for (let i = shuffledDefinitions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledDefinitions[i], shuffledDefinitions[j]] = [shuffledDefinitions[j], shuffledDefinitions[i]];
    }

    setTerms(initialTerms);
    setDefinitions(shuffledDefinitions);
  };

  const handleTermClick = (term: Item) => {
    if (term.isMatched) return;

    if (selectedTerm && selectedTerm.id === term.id) {
      // Deselect the term if it's clicked again
      setSelectedTerm(null);
    } else {
      setSelectedTerm(term);
      setMessage("Now select the matching definition.");
    }
  };

  const handleDefinitionClick = (definition: Item) => {
    if (!selectedTerm || definition.isMatched) return;

    if (selectedTerm.pairId === definition.pairId) {
      // Correct match
      setMessage("Correct! 🎉");
      setScore(score + 1);
      addPoints(10); // Add 10 points for a correct match

      const newTerms = terms.map(t =>
        t.id === selectedTerm.id ? { ...t, isMatched: true } : t
      );
      setTerms(newTerms);

      const newDefinitions = definitions.map(d =>
        d.id === definition.id ? { ...d, isMatched: true } : d
      );
      setDefinitions(newDefinitions);

      setSelectedTerm(null);

      // Check for game completion
      if (newTerms.every(t => t.isMatched)) {
        setIsGameComplete(true);
      }
    } else {
      // Incorrect match
      setMessage("Incorrect. Try again! 😢");
      setSelectedTerm(null);
    }
  };

  const getTermClass = (term: Item) => {
    if (term.isMatched) {
      return "bg-green-600 text-white opacity-50";
    }
    if (selectedTerm?.id === term.id) {
      return "bg-purple-600 ring-2 ring-purple-400";
    }
    return "bg-gray-700 hover:bg-gray-600";
  };

  const getDefinitionClass = (definition: Item) => {
    if (definition.isMatched) {
      return "bg-green-600 text-white opacity-50";
    }
    return "bg-gray-700 hover:bg-gray-600";
  };

  return (
    <div className="p-6 bg-gray-900 text-white rounded-2xl shadow-xl flex flex-col items-center gap-6">
      <h2 className="text-2xl font-bold text-yellow-400">Match the Legal Definition</h2>
      
      {isGameComplete ? (
        <div className="flex flex-col items-center text-center p-8">
          <h3 className="text-3xl font-bold mb-4">Case Closed! You Win! 🎉</h3>
          <p className="text-lg">You matched all the pairs with a final score of **{score}**.</p>
          <p className="text-lg mt-2">You're a master of legal terms. Keep up the great work!</p>
          <button onClick={startGame} className="mt-6 px-6 py-3 bg-purple-600 rounded-lg font-bold hover:bg-purple-700 transition-colors">
            Play Again
          </button>
        </div>
      ) : (
        <>
          <div className="w-full text-center">
            <p className="text-lg mt-6">Score: <span className="font-bold">{score}</span></p>
            <p className="text-md mt-2 h-6">{message}</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-16 w-full max-w-4xl">
            {/* Terms Column */}
            <div className="flex flex-col gap-3 p-4 bg-gray-800 rounded-lg shadow-inner">
              <h3 className="text-xl font-bold text-center text-yellow-300">Terms</h3>
              {terms.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleTermClick(item)}
                  disabled={item.isMatched}
                  className={`px-4 py-3 rounded-lg text-center transition-colors duration-200 ${getTermClass(item)}`}
                >
                  {item.content}
                </button>
              ))}
            </div>

            {/* Definitions Column */}
            <div className="flex flex-col gap-3 p-4 bg-gray-800 rounded-lg shadow-inner">
              <h3 className="text-xl font-bold text-center text-yellow-300">Definitions</h3>
              {definitions.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleDefinitionClick(item)}
                  disabled={item.isMatched || !selectedTerm}
                  className={`px-4 py-3 rounded-lg text-left transition-colors duration-200 ${getDefinitionClass(item)}`}
                >
                  {item.content}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default GamesScenario;
