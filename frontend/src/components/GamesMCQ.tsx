import React, { useState, useRef, useEffect } from "react";

interface Hint {
  number: number;
  direction: "Across" | "Down";
  text: string;
  answer: string;
  row: number;
  col: number;
}

type Cell = {
  letter: string;
  isBlack: boolean;
  hintNumbers: number[];
};

const rows = 8;
const cols = 8;

const hints: Hint[] = [
  // Across words based on user input
  { number: 1, direction: "Across", text: "A contract for renting property", answer: "LEASE", row: 0, col: 0 },
  { number: 4, direction: "Across", text: "Official account of something", answer: "RECORD", row: 4, col: 2 },
  { number: 5, direction: "Across", text: "A legal document transferring property ownership", answer: "DEED", row: 6, col: 1 },

  // Down words based on user input
  { number: 2, direction: "Down", text: "A legal professional", answer: "ATTORNEY", row: 0, col: 2 },
  { number: 3, direction: "Down", text: "A formal written agreement", answer: "CONTRACT", row: 0, col: 6 },
  { number: 6, direction: "Down", text: "An official order or decision", answer: "DECREE", row: 2, col: 0 },
];

const createGrid = (): Cell[][] => {
  const grid: Cell[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ letter: "", isBlack: true, hintNumbers: [] }))
  );

  hints.forEach((hint) => {
    const { row, col, answer, number, direction } = hint;
    for (let i = 0; i < answer.length; i++) {
      const r = direction === "Down" ? row + i : row;
      const c = direction === "Across" ? col + i : col;
      if (r < rows && c < cols) {
        grid[r][c].isBlack = false;
      }
    }
    grid[row][col].hintNumbers.push(number);
  });
  return grid;
};

interface GamesMCQProps {
  addPoints: (points: number) => void;
  unlockPowerUp: (powerUpName: 'secondChance' | 'hint') => void;
}

const GamesMCQ: React.FC<GamesMCQProps> = ({ addPoints}) => {
  const [grid, setGrid] = useState<Cell[][]>(createGrid());
  const [message, setMessage] = useState("");
  const [currentWord, setCurrentWord] = useState<Hint | null>(null);
  const [solvedHints, setSolvedHints] = useState<Set<number>>(new Set());
  const [isGameComplete, setIsGameComplete] = useState(false);

  const inputRefs = useRef<Array<Array<HTMLInputElement | null>>>(
    Array.from({ length: rows }, () => Array(cols).fill(null))
  );

  useEffect(() => {
    // If a currentWord is set, focus on the first cell of that word
    if (currentWord) {
      const { row, col } = currentWord;
      inputRefs.current[row]?.[col]?.focus();
    }
  }, [currentWord]);

  const resetGame = () => {
    setGrid(createGrid());
    setMessage("");
    setCurrentWord(null);
    setSolvedHints(new Set());
    setIsGameComplete(false);
  };

  const handleChange = (row: number, col: number, value: string) => {
    if (!/^[a-zA-Z]?$/.test(value)) return;
    const newGrid = grid.map((r) => r.map((c) => ({ ...c })));
    newGrid[row][col].letter = value.toUpperCase();
    setGrid(newGrid);
  };
  
  const handleCellClick = (row: number, col: number) => {
    // Find the hint associated with the clicked cell
    const clickedHint = hints.find((h) => {
      if (h.direction === "Across") {
        return row === h.row && col >= h.col && col < h.col + h.answer.length;
      }
      return col === h.col && row >= h.row && row < h.row + h.answer.length;
    });

    if (clickedHint && !solvedHints.has(clickedHint.number)) {
      setCurrentWord(clickedHint);
      setMessage(`You are working on: ${clickedHint.number} ${clickedHint.direction}. Press Enter to check.`);
    } else {
      setCurrentWord(null);
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, row: number, col: number) => {
    const moveFocus = (r: number, c: number) => {
      if (r >= 0 && r < rows && c >= 0 && c < cols) {
        const nextInput = inputRefs.current[r]?.[c];
        if (nextInput) nextInput.focus();
      }
    };

    switch (e.key) {
      case "ArrowUp":
        moveFocus(row - 1, col);
        e.preventDefault();
        break;
      case "ArrowDown":
        moveFocus(row + 1, col);
        e.preventDefault();
        break;
      case "ArrowLeft":
        moveFocus(row, col - 1);
        e.preventDefault();
        break;
      case "ArrowRight":
        moveFocus(row, col + 1);
        e.preventDefault();
        break;
      case "Enter":
        e.preventDefault();
        checkWord(row, col);
        break;
    }
  };

  const checkWord = (row: number, col: number) => {
    const hint = hints.find((h) => {
      if (h.direction === "Across") {
        return row === h.row && col >= h.col && col < h.col + h.answer.length;
      }
      return col === h.col && row >= h.row && row < h.row + h.answer.length;
    });

    if (!hint || solvedHints.has(hint.number)) {
      setMessage("Please select a word to check.");
      return;
    }

    const letters: string[] = [];
    for (let i = 0; i < hint.answer.length; i++) {
      const r = hint.direction === "Down" ? hint.row + i : hint.row;
      const c = hint.direction === "Across" ? hint.col + i : hint.col;
      if (r < rows && c < cols) {
        letters.push(grid[r][c].letter);
      }
    }

    if (letters.join("") === hint.answer) {
      setMessage(`Correct! 🎉 The word "${hint.answer}" is a perfect match.`);
      addPoints(10);
      setSolvedHints(new Set(solvedHints).add(hint.number));

      if (solvedHints.size + 1 === hints.length) {
        setIsGameComplete(true);
        setMessage("Case Closed! You've solved the entire crossword! 🎉");
      }
    } else {
      setMessage("Incorrect. Try again! 😢");
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 p-4 bg-gray-900 text-white rounded-2xl shadow-xl">
      <h2 className="text-2xl font-bold text-yellow-400">Legal Terms Crossword</h2>
      
      {isGameComplete ? (
        <div className="flex flex-col items-center text-center p-8">
          <h3 className="text-3xl font-bold mb-4">You Win! 🎉</h3>
          <p className="text-lg">{message}</p>
          <button onClick={resetGame} className="mt-6 px-6 py-3 bg-purple-600 rounded-lg font-bold hover:bg-purple-700 transition-colors">
            Play Again
          </button>
        </div>
      ) : (
        <>
          <p className="text-white font-semibold">Score: {solvedHints.size * 10}</p>
          <p className="text-white h-6">{message}</p>

          {/* Crossword Grid */}
          <div className={`grid gap-1`} style={{ gridTemplateRows: `repeat(${rows}, 1fr)`, gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
            {grid.map((row, rIdx) =>
              row.map((cell, cIdx) => {
                const isSolved = cell.hintNumbers.some(hintNumber => solvedHints.has(hintNumber));
                
                let letterToDisplay = cell.letter;
                if (isSolved) {
                  const solvedHint = hints.find(h => solvedHints.has(h.number) && 
                    ((h.direction === 'Across' && rIdx === h.row && cIdx >= h.col && cIdx < h.col + h.answer.length) ||
                     (h.direction === 'Down' && cIdx === h.col && rIdx >= h.row && rIdx < h.row + h.answer.length))
                  );
                  if (solvedHint) {
                    letterToDisplay = solvedHint.answer[solvedHint.direction === "Down" ? rIdx - solvedHint.row : cIdx - solvedHint.col];
                  }
                }

                const isHighlighted =
                  currentWord &&
                  ((currentWord.direction === "Across" &&
                    rIdx === currentWord.row &&
                    cIdx >= currentWord.col &&
                    cIdx < currentWord.col + currentWord.answer.length) ||
                    (currentWord.direction === "Down" &&
                      cIdx === currentWord.col &&
                      rIdx >= currentWord.row &&
                      rIdx < currentWord.row + currentWord.answer.length));
                      
                return (
                  <div key={`${rIdx}-${cIdx}`} className="relative">
                    {cell.isBlack ? (
                      <div className="w-10 h-10 bg-black border"></div>
                    ) : (
                      <>
                        {cell.hintNumbers.length > 0 && (
                          <span className="absolute top-0 left-0 text-xs text-yellow-300 z-10 p-0.5">
                            {cell.hintNumbers.join(", ")}
                          </span>
                        )}
                        <input
                          ref={(el) => { inputRefs.current[rIdx][cIdx] = el; }}
                          type="text"
                          maxLength={1}
                          value={letterToDisplay}
                          onChange={(e) => handleChange(rIdx, cIdx, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, rIdx, cIdx)}
                          onClick={() => handleCellClick(rIdx, cIdx)}
                          className={`w-10 h-10 text-center font-bold border rounded ${
                            isSolved ? "bg-green-700 text-green-200" : isHighlighted ? "bg-purple-300 text-black" : "bg-gray-100 text-black"
                          }`}
                          readOnly={isSolved}
                        />
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>
          
          {/* Hints */}
          <div className="w-full max-w-2xl mt-4 bg-gray-800 p-4 rounded-xl shadow-lg text-white">
            <h3 className="text-xl font-semibold mb-2 text-yellow-300">Hints</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <h4 className="font-bold text-lg mb-1">Across:</h4>
                <ul className="list-disc list-inside">
                  {hints
                    .filter((h) => h.direction === "Across")
                    .map((h) => (
                      <li key={h.number} className={solvedHints.has(h.number) ? "line-through text-gray-500" : ""}>
                        {h.number}. {h.text}
                      </li>
                    ))}
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-lg mb-1">Down:</h4>
                <ul className="list-disc list-inside">
                  {hints
                    .filter((h) => h.direction === "Down")
                    .map((h) => (
                      <li key={h.number} className={solvedHints.has(h.number) ? "line-through text-gray-500" : ""}>
                        {h.number}. {h.text}
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default GamesMCQ;
