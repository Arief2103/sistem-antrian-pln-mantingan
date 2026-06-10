import React from "react";
import { User } from "../types";
import { Users, LogOut, CheckCircle, Menu, X } from "lucide-react";

interface NavbarProps {
  currentUser: User | null;
  onLogout: () => void;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export default function Navbar({
  currentUser,
  onLogout,
  isSidebarOpen = true,
  onToggleSidebar,
}: NavbarProps) {
  if (!currentUser) return null;

  return (
    <header className="bg-white border-b border-slate-150 sticky top-0 z-30 w-full" id="global-navbar">
      <div className="w-full px-5 py-3 flex items-center justify-between gap-4">
        
        {/* Left Side: Hamburger (Admins only) + Logo and Corporate Location Info */}
        <div className="flex items-center gap-3 select-none">
          {currentUser.role === "admin" && onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-1.5 mr-1 bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg transition-all cursor-pointer flex items-center justify-center shrink-0 active:scale-95"
              title={isSidebarOpen ? "Sembunyikan Sidebar" : "Tampilkan Sidebar"}
              id="navbar-sidebar-toggle"
            >
              {isSidebarOpen ? <X className="w-4.5 h-4.5" /> : <Menu className="w-4.5 h-4.5" />}
            </button>
          )}

          <div className="w-9 h-9 shrink-0">
            <img
              src="/logo-pln.png"
              alt="Logo PLN"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-slate-900 tracking-tight text-xs sm:text-sm">PT PLN ULP Mantingan</span>
              <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] sm:text-[10px] font-bold rounded-full">Mantingan</span>
            </div>
            <p className="text-[9px] sm:text-[10px] text-slate-500 font-semibold uppercase tracking-wider leading-none">Sistem Antrian Pelanggan</p>
          </div>
        </div>

        {/* Middle Section: Informational Banner/Decorative text */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-lg text-slate-500 text-[11px] sm:text-xs font-semibold">
          
          <span></span>
        </div>

        {/* Right Side: Logged-in User Information & Exit Control */}
        <div className="flex items-center gap-3 shrink-0" id="navbar-user-actions">
          <div className="text-right hidden sm:block select-none">
            <span className="text-xs font-extrabold text-slate-900 block leading-tight">{currentUser.name}</span>
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider leading-none block mt-0.5">
              {currentUser.role === "admin" ? "ADMINISTRATOR UTAMA" : "PETUGAS LOKET"}
            </span>
          </div>

          <button
            onClick={onLogout}
            className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-105 rounded-xl transition-all cursor-pointer font-bold text-xs flex items-center gap-1.5"
            title="Keluar dari sistem"
            id="navbar-logout-btn"
          >
            <LogOut className="w-4 h-4" />
            <span className="xs:inline hidden">Keluar</span>
          </button>
        </div>

      </div>
    </header>
  );
}
