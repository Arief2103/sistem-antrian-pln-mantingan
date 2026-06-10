import React from "react";
import { 
  LayoutDashboard, 
  Layers, 
  Tv, 
  Printer, 
  Users, 
  LogOut, 
  RefreshCw, 
  Settings2,
  X,
  PlusCircle,
  FolderOpen,
  Database
} from "lucide-react";

interface SidebarProps {
  activeTab: "dashboard" | "kiosk" | "tv" | "loket" | "monitor" | "print" | "users" | "rekap";
  setActiveTab: (tab: "dashboard" | "kiosk" | "tv" | "loket" | "monitor" | "print" | "users" | "rekap") => void;
  onResetQueues?: () => void;
  resetConfirmed?: boolean;
  onLogout?: () => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  onResetQueues,
  resetConfirmed = false,
  onLogout,
  isOpen,
  setIsOpen,
}: SidebarProps) {
  if (!isOpen) return null;

  return (
    <aside
      className="w-full md:w-64 bg-white text-slate-755 flex flex-col justify-between shrink-0 border-r border-slate-200 select-none h-full"
      id="elegant-app-sidebar"
    >
      <div className="flex-1 flex flex-col pt-2">
        
        {/* Navigation Items list - styled like Gambar 3 with flat sharp borders */}
        <nav className="flex-1 space-y-0.5" id="sidebar-navigation">
          
          {/* 1. DATA ANTRIAN */}
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`w-full flex items-center gap-3 px-5 py-3.5 text-xs font-bold transition-all text-left border-b border-slate-100 ${
              activeTab === "dashboard"
                ? "bg-slate-100 border-l-4 border-sky-600 text-sky-800"
                : "border-l-4 border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0 text-slate-500" />
            <span>Data Antrian</span>
          </button>

          {/* 1.1 REKAP DATA PELANGGAN */}
          <button
            onClick={() => setActiveTab("rekap")}
            className={`w-full flex items-center gap-3 px-5 py-3.5 text-xs font-bold transition-all text-left border-b border-slate-100 ${
              activeTab === "rekap"
                ? "bg-slate-100 border-l-4 border-sky-600 text-sky-800"
                : "border-l-4 border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Database className="w-4 h-4 shrink-0 text-slate-500" />
            <span>Rekap Data Pelanggan</span>
          </button>

          {/* 2. SETELAN LOKET */}
          <button
            onClick={() => setActiveTab("loket")}
            className={`w-full flex items-center gap-3 px-5 py-3.5 text-xs font-bold transition-all text-left border-b border-slate-100 ${
              activeTab === "loket"
                ? "bg-slate-100 border-l-4 border-sky-600 text-sky-800"
                : "border-l-4 border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <PlusCircle className="w-4 h-4 shrink-0 text-slate-500" />
            <span>Pengaturan Loket</span>
          </button>

          {/* 6. PENGATURAN PRINTER */}
          <button
            onClick={() => setActiveTab("print")}
            className={`w-full flex items-center gap-3 px-5 py-3.5 text-xs font-bold transition-all text-left border-b border-slate-100 ${
              activeTab === "print"
                ? "bg-slate-100 border-l-4 border-sky-600 text-sky-800"
                : "border-l-4 border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Printer className="w-4 h-4 shrink-0 text-slate-500" />
            <span>Pengaturan Struk Antrian</span>
          </button>

          {/* 5. PENGATURAN MONITOR */}
          <button
            onClick={() => setActiveTab("monitor")}
            className={`w-full flex items-center gap-3 px-5 py-3.5 text-xs font-bold transition-all text-left border-b border-slate-100 ${
              activeTab === "monitor"
                ? "bg-slate-100 border-l-4 border-sky-600 text-sky-800"
                : "border-l-4 border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Settings2 className="w-4 h-4 shrink-0 text-slate-500" />
            <span>Pengaturan Monitor</span>
          </button>

          {/* 3. MONITOR DISPLAY TV */}
          <button
            onClick={() => setActiveTab("tv")}
            className={`w-full flex items-center gap-3 px-5 py-3.5 text-xs font-bold transition-all text-left border-b border-slate-100 ${
              activeTab === "tv"
                ? "bg-slate-100 border-l-4 border-sky-600 text-sky-800"
                : "border-l-4 border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Tv className="w-4 h-4 shrink-0 text-slate-500" />
            <span>Tampilan Monitor</span>
          </button>

          {/* 4. KIOS CETAK TIKET */}
          <button
            onClick={() => setActiveTab("kiosk")}
            className={`w-full flex items-center gap-3 px-5 py-3.5 text-xs font-bold transition-all text-left border-b border-slate-100 ${
              activeTab === "kiosk"
                ? "bg-slate-100 border-l-4 border-sky-600 text-sky-800"
                : "border-l-4 border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Printer className="w-4 h-4 shrink-0 text-slate-500" />
            <span>Tampilan Cetak Tiket</span>
          </button>

          {/* 7. PENGGUNA */}
          <button
            onClick={() => setActiveTab("users")}
            className={`w-full flex items-center gap-3 px-5 py-3.5 text-xs font-bold transition-all text-left border-b border-slate-100 ${
              activeTab === "users"
                ? "bg-slate-100 border-l-4 border-sky-600 text-sky-800"
                : "border-l-4 border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Users className="w-4 h-4 shrink-0 text-slate-500" />
            <span>Pengaturan Pengguna</span>
          </button>

        </nav>

        {/* Logout Button as a flat footer action */}
        {onLogout && (
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-5 py-4 border-t border-slate-200 text-xs font-bold text-red-650 hover:bg-red-50 text-red-650 transition-all text-left select-none outline-none"
          >
            <LogOut className="w-4 h-4 shrink-0 text-red-500" />
            <span>Log Out</span>
          </button>
        )}

      </div>
    </aside>
  );
}

