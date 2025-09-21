import React from "react";
import { Link, useNavigate } from "react-router-dom";
import Spline from "@splinetool/react-spline";
import logo from "../assets/logo.png";
import { useAuth } from "../context/AuthContext";

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const goChat = () => {
    if (!user) {
      navigate("/login?next=/chatbot");
      return;
    }
    navigate("/chatbot");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white relative overflow-hidden">
      {/* Header */}
      <header className="absolute top-0 left-0 w-full flex justify-between items-center py-2 px-20 z-20">
        <img src={logo} alt="LegalScan Logo" className="h-22 md:h-24 cursor-pointer" onClick={() => navigate("/") } />

        <nav className="flex space-x-10 text-lg">
          <Link
            to="/games"
            className="relative group font-semibold text-white"
          >
            <span className="absolute -bottom-1 left-0 w-0 h-1 bg-yellow-400 transition-all group-hover:w-full"></span>
            <span className="relative group-hover:text-yellow-400 transition-colors duration-300">
              Games
            </span>
          </Link>
          <Link
            to="/login"
            className="relative group font-semibold text-white"
          >
            <span className="absolute -bottom-1 left-0 w-0 h-1 bg-blue-400 transition-all group-hover:w-full"></span>
            <span className="relative group-hover:text-blue-400 transition-colors duration-300">
              Login
            </span>
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex flex-col md:flex-row items-center justify-center min-h-screen text-center md:text-left relative z-10 px-4 md:px-16 gap-12">
        {/* Spline Scene */}
        <div className="w-full md:w-1/2 h-[600px] md:h-[800px]">
          <Spline scene="https://prod.spline.design/LtOqn-XyFsIBUCZQ/scene.splinecode" />
        </div>

        {/* Text + Button */}
        <div className="md:w-1/2 flex flex-col justify-center items-center md:items-start animate-fadeIn">
          <h2 className="text-4xl md:text-6xl font-bold mb-4 text-yellow-400 drop-shadow animate-fadeIn-100">
            Legal Learning
          </h2>
          <p className="max-w-lg text-gray-300 text-base md:text-lg mb-8 animate-fadeIn">
            LegalEase makes legal learning fun and interactive. Upload your
            documents, chat with our friendly robo, and play short games to
            master your rights.
          </p>
          <button
            onClick={goChat}
            className="bg-gradient-to-r from-yellow-400 to-blue-500 text-black font-bold py-3 px-6 rounded-2xl shadow-xl hover:scale-105 transition-all"
          >
            Talk to LegalEase
          </button>
        </div>
      </main>

      {/* Glow Effects */}
      <div className="absolute top-40 left-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-yellow-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
    </div>
  );
};

export default Home;
