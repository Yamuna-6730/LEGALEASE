import React, { useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import passportIllustration from "../assets/passport.png";
import { useAuth } from "../context/AuthContext";

const REDIRECT_DELAY_MS = 5000;

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const nextPath = useMemo(() => new URLSearchParams(location.search).get("next") || "/", [location.search]);
  const { loginWithEmail, registerWithEmail, signInWithGoogle } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [showAuth, setShowAuth] = useState(true);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regPassword2, setRegPassword2] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regDOB, setRegDOB] = useState("");

  const [message, setMessage] = useState<string>("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");

  if (!showAuth) return null; // Close button hides modal

  const closeAndGoHome = () => {
    setShowAuth(false);
    navigate("/");
  };

  const showSuccess = (text: string) => {
    setMessage(text);
    setMessageType("success");
    setTimeout(() => setMessage(""), REDIRECT_DELAY_MS);
  };

  const showError = (text: string) => {
    setMessage(text);
    setMessageType("error");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await loginWithEmail(loginEmail, loginPassword);
      showSuccess("Logged in successfully. Redirecting...");
      setTimeout(() => navigate(nextPath), REDIRECT_DELAY_MS);
    } catch (err: any) {
      showError(err?.message || "Incorrect email or password");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regPassword !== regPassword2) {
      showError("Passwords do not match!");
      return;
    }
    try {
      await registerWithEmail(regName, regEmail, regPassword, regPhone, regDOB);
      showSuccess("Account created. Redirecting...");
      setTimeout(() => navigate(nextPath), REDIRECT_DELAY_MS);
    } catch (err: any) {
      showError(err?.message || "Registration failed");
    }
  };

  const handleGoogle = async () => {
    try {
      await signInWithGoogle();
      showSuccess("Signed in with Google. Redirecting...");
      setTimeout(() => navigate(nextPath), REDIRECT_DELAY_MS);
    } catch (err: any) {
      showError(err?.message || "Google sign-in failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black flex items-center justify-center px-4 relative overflow-hidden">
      <div className="relative flex flex-col md:flex-row bg-gray-900/70 rounded-3xl shadow-2xl overflow-hidden transform hover:scale-105 transition-transform duration-500 perspective-1000 w-full max-w-4xl">
        
        {/* Close Button */}
        <button
          onClick={closeAndGoHome}
          className="absolute top-4 right-4 text-white text-xl font-bold hover:text-red-500 transition-colors z-10"
        >
          ✕
        </button>

        {/* Illustration */}
        <div className="md:w-1/2 flex items-center justify-center p-8 bg-gray-800/50 relative overflow-hidden">
          <img
            src={passportIllustration}
            alt="Passport Illustration"
            className="w-64 md:w-80 animate-bounce-slow hover:rotate-6 transition-transform duration-500"
          />
        </div>

        {/* Auth Form */}
        <div className="md:w-1/2 p-8 md:p-16 flex flex-col justify-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold text-yellow-400 drop-shadow-lg text-center md:text-left">
            {isRegister ? "Create Account" : "Welcome Back"}
          </h2>
          <p className="text-gray-300 text-center md:text-left">
            {isRegister
              ? "Register to create your LegalEase account"
              : "Login to access your LegalEase account"}
          </p>

          {message && (
            <div className={`rounded-xl px-4 py-3 text-sm ${messageType === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}>
              {message}
            </div>
          )}

          {!isRegister ? (
            <form onSubmit={handleLogin} className="flex flex-col space-y-4">
              <input
                type="email"
                placeholder="Email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="px-4 py-3 rounded-xl bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all duration-300"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="px-4 py-3 rounded-xl bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all duration-300"
                required
              />
              <button
                type="submit"
                className="bg-gradient-to-r from-yellow-400 to-blue-500 text-black font-bold py-3 rounded-2xl shadow-xl transform hover:scale-105 hover:shadow-[0_0_20px_rgba(0,200,255,0.9)] transition-all duration-300"
              >
                Login
              </button>
              <button type="button" onClick={handleGoogle} className="bg-white text-black font-semibold py-3 rounded-2xl hover:bg-gray-200">
                Sign in with Google
              </button>
              <div className="flex justify-between text-sm text-gray-400 mt-2">
                <button type="button" onClick={() => setIsRegister(true)} className="hover:text-blue-400 transition-colors">
                  New user? Register
                </button>
                <a href="#" className="hover:text-yellow-400 transition-colors">
                  Forgot password?
                </a>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="flex flex-col space-y-4">
              <input
                type="text"
                placeholder="Full Name"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                className="px-4 py-3 rounded-xl bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all duration-300"
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                className="px-4 py-3 rounded-xl bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all duration-300"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                className="px-4 py-3 rounded-xl bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all duration-300"
                required
              />
              <input
                type="password"
                placeholder="Confirm Password"
                value={regPassword2}
                onChange={(e) => setRegPassword2(e.target.value)}
                className="px-4 py-3 rounded-xl bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all duration-300"
                required
              />
              <input
                type="tel"
                placeholder="Phone Number"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                className="px-4 py-3 rounded-xl bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all duration-300"
              />
              <input
                type="date"
                placeholder="Date of Birth"
                value={regDOB}
                onChange={(e) => setRegDOB(e.target.value)}
                className="px-4 py-3 rounded-xl bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all duration-300"
              />
              <p className="text-gray-400 text-sm">
                Your data is safe with us. We will never share your personal information without consent.
              </p>
              <button
                type="submit"
                className="bg-gradient-to-r from-yellow-400 to-blue-500 text-black font-bold py-3 rounded-2xl shadow-xl transform hover:scale-105 hover:shadow-[0_0_20px_rgba(0,200,255,0.9)] transition-all duration-300"
              >
                Register
              </button>
              <div className="flex justify-center text-sm text-gray-400 mt-2">
                <button type="button" onClick={() => setIsRegister(false)} className="hover:text-yellow-400 transition-colors">
                  Already have an account? Login
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Glow background */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-yellow-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
    </div>
  );
};

export default Login;
