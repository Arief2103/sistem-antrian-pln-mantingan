import React, { useState } from "react";
import { User, UserRole } from "../types";
import { Shield, Sparkles, KeyRound, AlertTriangle, Cpu, Radio, LogIn, Monitor } from "lucide-react";

interface LoginScreenProps {
  usersList: User[];
  onLoginSuccess: (user: User) => void;
  onSelectDisplayMode: () => void;
}

export default function LoginScreen({ usersList, onLoginSuccess, onSelectDisplayMode }: LoginScreenProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedUser = username.trim().toLowerCase();
    const inputPassword = password.trim();

    // Check against dynamically registered accounts in Supabase
    const foundUser = usersList.find((u) => u.username.toLowerCase() === normalizedUser);

    if (foundUser) {
      const dbPassword = foundUser.password || "plnmantingan";
      if (inputPassword === dbPassword) {
        onLoginSuccess(foundUser);
        setErrorMsg("");
        return;
      }
    }

    // Hardcoded fallback for default setup
    if (normalizedUser === "admin" && inputPassword === "plnmantingan") {
      onLoginSuccess({
        id: "admin",
        name: "Administrator PLN ULP Mantingan",
        role: "admin",
        username: "admin",
      });
      setErrorMsg("");
    } else if (normalizedUser === "petugas" && inputPassword === "plnmantingan") {
      onLoginSuccess({
        id: "petugas",
        name: "Beni Prasetyo (Petugas Loket)",
        role: "petugas",
        username: "petugas",
      });
      setErrorMsg("");
    } else {
      setErrorMsg("Nama pengguna atau Kata sandi salah! Cek tab Pengguna di Administrator.");
    }
  };

  const handleQuickFill = (role: "admin" | "petugas") => {
    if (role === "admin") {
      setUsername("admin");
      setPassword("plnmantingan");
    } else {
      const firstPetugas = usersList.find((u) => u.role === "petugas");
      if (firstPetugas) {
        setUsername(firstPetugas.username);
        setPassword(firstPetugas.password || "plnmantingan");
      } else {
        setUsername("petugas");
        setPassword("plnmantingan");
      }
    }
    setErrorMsg("");
  };

  return (
    <div 
      className="h-screen w-full flex items-center justify-center bg-[#0d1e2d] bg-center bg-no-repeat relative px-4"
      style={{ backgroundImage: "url('/kantor-new.jpeg')", backgroundSize: "100% 100%" }}
      id="login-portal-card"
    >
      {/* Dark premium overlay with backdrop blur to ensure high contrast & elegant layout */}
      <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-[1px]" />

      <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-white/40 overflow-hidden relative z-10" id="login-frame">
        
        {/* Banner with PLN corporate color theme */}
        <div className="bg-gradient-to-r from-sky-800 to-sky-950 p-8 text-white flex items-center gap-4 relative">
          <img 
            src="/logo-pln.png" 
            alt="PLN Logo" 
            className="w-11 h-16 object-contain shrink-0" 
            referrerPolicy="no-referrer"
          />
          <div>
            <h2 className="text-lg font-bold uppercase tracking-tight leading-tight">Sistem Antrian Pelanggan</h2>
            <p className="text-xs text-sky-200 mt-1 font-semibold">PT PLN (Persero) ULP Mantingan</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="p-8 space-y-5" id="login-form">
          {errorMsg && (
            <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl flex items-start gap-2 border border-rose-100" id="login-error-toast">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Nama Pengguna (Username)</label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username..."
                className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl pl-9 pr-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                required
              />
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Kata Sandi (Password)</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password..."
                className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl pl-9 pr-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                required
              />
              <Shield className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 active:scale-95"
            id="login-submit-btn"
          >
            <LogIn className="w-4 h-4" /> Masuk ke Dashboard
          </button>

          {/* Login Cepat details and display monitor buttons are removed as requested by the user */}
        </form>

      </div>
    </div>
  );
}
