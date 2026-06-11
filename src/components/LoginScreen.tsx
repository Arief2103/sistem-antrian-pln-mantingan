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
    <div className="h-screen flex items-center justify-center bg-slate-50 px-4"id="login-portal-card">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden" id="login-frame">
        
        {/* Banner with PLN corporate color theme */}
        <div className="bg-gradient-to-r from-sky-800 to-sky-950 p-8 text-white relative">
          

          
          <h2 className="text-xl font-bold uppercase tracking-tight">Sistem Antrian Pelanggan</h2>
          <p className="text-xs text-sky-200 mt-1">PT PLN (Persero) ULP Mantingan</p>
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

          {/* Quick Demo Assist Links (Indonesian Instruction) */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50 space-y-3" id="credential-suggestions">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block">Login Cepat</span>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill("admin")}
                className="text-left p-2 rounded-xl bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-950 border border-slate-200 transition-all text-[11px]"
              >
                <div className="font-bold text-sky-700">Administrator</div>
                <div className="text-[9px] text-slate-400">admin / plnmantingan</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill("petugas")}
                className="text-left p-2 rounded-xl bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-950 border border-slate-200 transition-all text-[11px]"
              >
                <div className="font-bold text-violet-700 font-semibold text-xs leading-none mb-0.5">Petugas Desk</div>
                <div className="text-[9px] text-slate-400">petugas / plnmantingan</div>
              </button>
            </div>
            
            <button
              type="button"
              onClick={onSelectDisplayMode}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-[10px] rounded-xl flex items-center justify-center gap-1.5 text-center transition-all cursor-pointer shadow-sm border border-slate-700"
            >
              <Monitor className="w-3.5 h-3.5" /> LIHAT TAMPILAN MONITOR
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
