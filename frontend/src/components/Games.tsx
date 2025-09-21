import React, { useState } from "react";
import GamesMCQ from "../components/GamesMCQ";
import GamesScenario from "../components/GamesScenario";
import GamesDragDrop from "../components/GamesDragDrop";
import GamesTimed from "../components/GamesTimed";
import logo from "../assets/logo.png";
import { Link, useNavigate } from "react-router-dom";

const generateLeaderboard = () => {
  const names = ["Alex", "Jessica", "Sam", "Maria", "Chris", "Emma", "Leo", "Sophie", "Ryan", "Grace"];
  const leaderboard = names.map((name) => ({
    name: name,
    points: 100 + Math.floor(Math.random() * 150),
  }));
  leaderboard.sort((a, b) => b.points - a.points);
  return leaderboard;
};

const Games: React.FC = () => {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [leaderboardData] = useState(generateLeaderboard);
  const [userPoints, setUserPoints] = useState(0);
  const [powerUps, setPowerUps] = useState({ secondChance: false, hint: false });
  const navigate = useNavigate();

  const addPoints = (pointsToAdd: number) => {
    setUserPoints(prevPoints => prevPoints + pointsToAdd);
  };

  const unlockPowerUp = (powerUpName: 'secondChance' | 'hint') => {
    setPowerUps(prevPowerUps => ({ ...prevPowerUps, [powerUpName]: true }));
  };

  const renderGame = () => {
    switch (selectedGame) {
      case "mcq":
        return <GamesMCQ addPoints={addPoints} unlockPowerUp={unlockPowerUp} />;
      case "scenario":
        return <GamesScenario addPoints={addPoints} unlockPowerUp={unlockPowerUp} />;
      case "dragdrop":
        return <GamesDragDrop addPoints={addPoints} unlockPowerUp={unlockPowerUp} />;
      case "timed":
        return <GamesTimed addPoints={addPoints} unlockPowerUp={unlockPowerUp} />;
      default:
        return (
          <p className="text-gray-300 text-lg">
            Select a game to start learning with fun!
          </p>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
      <header className="absolute top-0 left-0 w-full flex justify-between items-center py-2 px-20 z-20">
        <img src={logo} alt="LegalScan Logo" className="h-22 md:h-24 cursor-pointer" onClick={() => navigate("/")} />
        <nav className="flex space-x-10 text-lg">
          <Link to="/" className="text-white font-semibold hover:text-yellow-400 transition-colors duration-300">Home</Link>
          <Link to="/games" className="text-white font-semibold hover:text-yellow-400 transition-colors duration-300">Games</Link>
          <Link to="/login" className="text-white font-semibold hover:text-blue-400 transition-colors duration-300">Login</Link>
        </nav>
      </header>

      <div className="p-6 md:p-12 flex flex-col md:flex-row gap-6">
        {/* Left: Game Selection */}
        <div className="md:w-4/5 flex flex-col gap-6">
          <h2 className="text-3xl font-bold text-yellow-400 mb-4">
            Gamified Legal Learning
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setSelectedGame("mcq")}
              className="bg-gray-800 rounded-2xl p-6 hover:scale-105 transition-transform shadow-lg hover:shadow-yellow-400/50"
            >
              Puzzle Challenge
            </button>
            <button
              onClick={() => setSelectedGame("scenario")}
              className="bg-gray-800 rounded-2xl p-6 hover:scale-105 transition-transform shadow-lg hover:shadow-blue-400/50"
            >
              Match the Definition
            </button>
            <button
              onClick={() => setSelectedGame("dragdrop")}
              className="bg-gray-800 rounded-2xl p-6 hover:scale-105 transition-transform shadow-lg hover:shadow-green-400/50"
            >
              Drag & Drop Challenge
            </button>
            <button
              onClick={() => setSelectedGame("timed")}
              className="bg-gray-800 rounded-2xl p-6 hover:scale-105 transition-transform shadow-lg hover:shadow-red-400/50"
            >
              Legal Dilemma
            </button>
          </div>

          <div className="mt-6 bg-gray-900/60 rounded-3xl p-6 shadow-xl min-h-[400px] transition-all duration-500">
            {renderGame()}
          </div>
        </div>

        {/* Right: Leaderboard & Stats */}
        <div className="md:w-1/5 flex flex-col gap-6">
          <div className="bg-gray-900/70 rounded-3xl p-6 shadow-xl flex flex-col items-center gap-4 animate-fadeIn">
            <h3 className="text-2xl font-bold text-green-400 mb-2">
              📊 Your Stats
            </h3>
            <div className="w-full text-center text-xl font-semibold border-b border-gray-700 pb-2">
              <p>Legal Points: <span className="text-yellow-300">{userPoints}</span></p>
            </div>
            <div className="w-full text-center text-lg mt-2">
              <p className="font-bold mb-1">Power-Ups Unlocked:</p>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${powerUps.secondChance ? 'bg-purple-600' : 'bg-gray-600'}`}>
                Second Chance
              </span>
              <span className={`ml-2 inline-block px-3 py-1 rounded-full text-sm font-semibold ${powerUps.hint ? 'bg-purple-600' : 'bg-gray-600'}`}>
                Hint
              </span>
            </div>
          </div>
          <div className="bg-gray-900/70 rounded-3xl p-6 shadow-xl flex flex-col items-center gap-4 animate-fadeIn">
            <h3 className="text-2xl font-bold text-yellow-400 mb-4">
              🏆 Leaderboard
            </h3>
            {leaderboardData.map((player, idx) => (
              <div
                key={idx}
                className={`w-full p-4 rounded-xl flex justify-between items-center border-b border-gray-700
                  ${
                    idx === 0
                      ? "text-yellow-300 font-extrabold animate-pulse text-lg"
                      : "text-white"
                  }`}
              >
                <span>
                  {idx === 0 ? "👑 " : idx === 1 ? "🥈 " : idx === 2 ? "🥉 " : "✨ "}
                  {idx + 1}. {player.name}
                </span>
                <span>{player.points} pts</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Games;
