import React, { useState } from "react";

interface DraggableItem {
  id: string;
  text: string;
  isCorrect: "safe" | "risky";
  emoji: string;
}

interface DropZone {
  id: "safe" | "risky";
  label: string;
}

interface GamesDragDropProps {
  addPoints: (points: number) => void;
  unlockPowerUp: (powerUpName: 'secondChance' | 'hint') => void;
}

const GamesDragDrop: React.FC<GamesDragDropProps> = ({ addPoints}) => {
  const [score, setScore] = useState(0);
  const [droppedItems, setDroppedItems] = useState<DraggableItem[]>([]);
  const [message, setMessage] = useState("");
  const [isGameOver, setIsGameOver] = useState(false);

  const items: DraggableItem[] = [
    { id: "1", text: "Read the fine print", isCorrect: "safe", emoji: "🔍" },
    { id: "2", text: "Pay without a receipt", isCorrect: "risky", emoji: "💸" },
    { id: "3", text: "Sign a contract blank", isCorrect: "risky", emoji: "✍️" },
    { id: "4", text: "Get an agreement in writing", isCorrect: "safe", emoji: "📝" },
    { id: "5", text: "Take photos of property damage", isCorrect: "safe", emoji: "📸" },
    { id: "6", text: "Ignore late payment notices", isCorrect: "risky", emoji: "🔔" },
  ];

  const dropZones: DropZone[] = [
    { id: "safe", label: "Safe Legal Practices" },
    { id: "risky", label: "Risky Legal Practices" },
  ];

  const handleDragStart = (event: React.DragEvent<HTMLDivElement>, item: DraggableItem) => {
    event.dataTransfer.setData("application/json", JSON.stringify(item));
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>, zoneId: string) => {
    event.preventDefault();
    const data = event.dataTransfer.getData("application/json");
    const droppedItem: DraggableItem = JSON.parse(data);

    if (droppedItems.find(item => item.id === droppedItem.id)) {
      setMessage("You've already placed that item!");
      return;
    }

    const isCorrectDrop = droppedItem.isCorrect === zoneId;

    if (isCorrectDrop) {
      setScore(prevScore => prevScore + 1);
      setMessage("Correct! 🎉");
      addPoints(10); // Add 10 points for a correct drop
    } else {
      setScore(prevScore => Math.max(0, prevScore - 1));
      setMessage("Incorrect. Try again! 😢");
    }

    const updatedDroppedItems = [...droppedItems, droppedItem];
    setDroppedItems(updatedDroppedItems);

    if (updatedDroppedItems.length === items.length) {
      setIsGameOver(true);
      setMessage(""); // Clear the message to show the final score message
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleReset = () => {
    setScore(0);
    setDroppedItems([]);
    setMessage("Game reset!");
    setIsGameOver(false);
  };

  const getItemsForZone = (zoneId: string) => {
    return droppedItems.filter(item => item.isCorrect === zoneId);
  };

  const availableItems = items.filter(item => !droppedItems.find(d => d.id === item.id));

  return (
    <div className="p-6 bg-gray-900 text-white rounded-2xl shadow-xl flex flex-col gap-6">
      <h2 className="text-2xl font-bold text-yellow-400">Drag & Drop Legal Challenge</h2>
      <p className="font-semibold text-center">Score: {score}</p>

      {isGameOver ? (
        <div className="flex flex-col items-center justify-center text-center p-8">
          <h3 className="text-3xl font-bold mb-4">You've officially leveled up your legal knowledge!</h3>
          <p className="text-lg">You're now a contract closer, a fine print fanatic, and a pro at spotting legal landmines. 🚀</p>
          <button onClick={handleReset} className="mt-6 px-6 py-3 bg-purple-600 rounded-lg font-bold hover:bg-purple-700 transition-colors">
            Play Again
          </button>
        </div>
      ) : (
        <>
          <div className="flex justify-center">
            <button onClick={handleReset} className="px-4 py-2 bg-purple-600 rounded-lg font-bold hover:bg-purple-700 transition-colors">
              Reset Game
            </button>
          </div>
          <p className="text-center mt-2">{message}</p>

          <div className="flex flex-wrap justify-center gap-4">
            {availableItems.map(item => (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => handleDragStart(e, item)}
                className={`p-3 rounded-lg cursor-grab font-semibold transition-transform duration-200 hover:scale-105 bg-gray-600`}
              >
                {item.emoji} {item.text}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {dropZones.map(zone => (
              <div
                key={zone.id}
                className={`flex flex-col items-center p-6 border-2 border-dashed border-gray-500 rounded-lg min-h-[150px] transition-colors duration-300`}
                onDrop={(e) => handleDrop(e, zone.id)}
                onDragOver={handleDragOver}
              >
                <h3 className="text-lg font-bold mb-2">{zone.label}</h3>
                {getItemsForZone(zone.id).map(item => (
                  <div
                    key={item.id}
                    className={`p-2 my-1 rounded-lg bg-gray-600`}
                  >
                    {item.emoji} {item.text}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default GamesDragDrop;
