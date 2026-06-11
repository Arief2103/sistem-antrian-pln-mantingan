import React, { useState, useEffect } from "react";
import { LoketItem, QueueItem, PrintSettings, MonitorSettings, User } from "../../types";
import Sidebar from "../../components/Sidebar";
import SetelanLoket from "./SetelanLoket";
import PengaturanMonitor from "./PengaturanMonitor";
import PengaturanPrinter from "./PengaturanPrinter";
import Pengguna from "./Pengguna";
import RekapDataPelanggan from "./RekapDataPelanggan";
import TicketPrinter from "../../components/TicketPrinter";
import DisplayMonitor from "../../components/DisplayMonitor";
import { 
  FileText, 
  Calendar, 
  Search, 
  Database, 
  RefreshCw, 
  Layers, 
  Tv, 
  Printer,
  Menu,
  X,
  Briefcase,
  Users,
  CheckCircle,
  Clock,
  UserCheck,
  ClipboardList,
  ShieldAlert,
  UserCircle
} from "lucide-react";

interface AdminDashboardProps {
  loketList: LoketItem[];
  queues: QueueItem[];
  printSettings: PrintSettings;
  monitorSettings: MonitorSettings;
  usersList: User[];
  onUpdateUsersList: (list: User[]) => void;
  onUpdateLoket: (newLoketList: LoketItem[]) => void;
  onUpdatePrintSettings: (settings: PrintSettings) => void;
  onUpdateMonitorSettings: (settings: MonitorSettings) => void;
  onResetQueues: () => void;
  onAddNewQueue: (
    prefix: string, 
    serviceName: string,
    customerData?: {
      pelangganNama?: string;
      pelangganId?: string;
      pelangganAlamat?: string;
      pelangganHp?: string;
      pelangganKeterangan?: string;
    }
  ) => QueueItem;
  lastCreatedQueue: QueueItem | null;
  setIsFullscreenDisplay: (fs: boolean) => void;
  onLogout: () => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  onDeleteQueue?: (id: string) => void;
}

export default function AdminDashboard({
  loketList,
  queues,
  printSettings,
  monitorSettings,
  usersList,
  onUpdateUsersList,
  onUpdateLoket,
  onUpdatePrintSettings,
  onUpdateMonitorSettings,
  onResetQueues,
  onAddNewQueue,
  lastCreatedQueue,
  setIsFullscreenDisplay,
  onLogout,
  isSidebarOpen,
  setIsSidebarOpen,
  onDeleteQueue,
}: AdminDashboardProps) {
  // Navigation active tab managed in unified flat sidebar
  const [activeTab, setActiveTab] = useState<"dashboard" | "kiosk" | "tv" | "loket" | "monitor" | "print" | "users" | "rekap">("dashboard");
  const [resetConfirmed, setResetConfirmed] = useState(false);

  // Search and display pagination filters for the Indonesian history tables
  const [historySearch, setHistorySearch] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Indonesian clock updates dynamically to replicate Screenshot 4's high accuracy
  const [timeString, setTimeString] = useState("");
  const [dateString, setDateString] = useState("");

  // Compute daily history dynamically from the queues loaded from Supabase
  const computedHistoryFromDb = React.useMemo(() => {
    const groups: { [date: string]: { countA: number; countB: number } } = {};
    const today = new Date().toDateString();
    
    queues.forEach((q) => {
      if (!q.createdAt) return;
      const qDate = new Date(q.createdAt);
      const qDateStr = qDate.toDateString();
      
      // Filter out queues from today so we only display previous days in History
      if (qDateStr === today) return;
      
      const yyyy = qDate.getFullYear();
      const mm = String(qDate.getMonth() + 1).padStart(2, '0');
      const dd = String(qDate.getDate()).padStart(2, '0');
      const dateFormatted = `${yyyy}-${mm}-${dd}`;
      
      if (!groups[dateFormatted]) {
        groups[dateFormatted] = { countA: 0, countB: 0 };
      }
      if (q.prefix === "A") {
        groups[dateFormatted].countA++;
      } else if (q.prefix === "B") {
        groups[dateFormatted].countB++;
      }
    });
    
    return Object.keys(groups).map((date) => ({
      textA: String(groups[date].countA),
      textB: String(groups[date].countB),
      date,
    })).sort((a, b) => b.date.localeCompare(a.date));
  }, [queues]);

  // History list dynamically loaded and merged from both Supabase and pre-existing local storage
  const [historyList, setHistoryList] = useState<{ textA: string; textB: string; date: string }[]>([]);

  // Keep history synchronised and merged during resets, loads or changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem("pln_queue_history_days");
      const localHistory: { textA: string; textB: string; date: string }[] = saved ? JSON.parse(saved) : [];
      
      const mergedMap = new Map<string, { textA: string; textB: string; date: string }>();
      
      // Feed first from computed db history (absolute truth from database)
      computedHistoryFromDb.forEach((item) => {
        mergedMap.set(item.date, item);
      });
      
      // Overlay/union with pre-existing local history
      localHistory.forEach((item) => {
        if (!mergedMap.has(item.date)) {
          mergedMap.set(item.date, item);
        }
      });
      
      const mergedList = Array.from(mergedMap.values()).sort((a, b) => b.date.localeCompare(a.date));
      setHistoryList(mergedList);
    } catch {
      setHistoryList(computedHistoryFromDb);
    }
  }, [queues, computedHistoryFromDb]);

  useEffect(() => {
    const updateIndoClock = () => {
      const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
      const months = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
      ];
      
      const now = new Date();
      const dayName = days[now.getDay()];
      const dateVal = String(now.getDate()).padStart(2, '0');
      const monthName = months[now.getMonth()];
      const yearVal = now.getFullYear();
      
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');

      setDateString(`${dayName}, ${dateVal} ${monthName} ${yearVal}`);
      setTimeString(`${hours}.${minutes}.${seconds} WIB`);
    };

    updateIndoClock();
    const interval = setInterval(updateIndoClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const triggerReset = () => {
    onResetQueues();
    setResetConfirmed(true);
    setTimeout(() => setResetConfirmed(false), 2000);
  };

  // Filter queues to only include those created today (Daily Reset visual isolation)
  const todayStr = new Date().toDateString();
  const todayQueues = queues.filter((q) => {
    if (!q.createdAt) return false;
    return new Date(q.createdAt).toDateString() === todayStr;
  });

  // Live queue statistics
  const totalQueues = todayQueues.length;
  const numUsers = usersList.length;
  const completedQueuesCount = todayQueues.filter((q) => q.status === "completed" || q.status === "calling").length;
  const incompletedQueuesCount = todayQueues.filter((q) => q.status === "waiting" || q.status === "skipped").length;

  const totalA = todayQueues.filter((q) => q.prefix === "A").length;
  const waitingA = todayQueues.filter((q) => q.prefix === "A" && q.status === "waiting").length;
  const calledA = todayQueues.filter((q) => q.prefix === "A" && q.status !== "waiting").length;

  const totalB = todayQueues.filter((q) => q.prefix === "B").length;
  const waitingB = todayQueues.filter((q) => q.prefix === "B" && q.status === "waiting").length;
  const calledB = todayQueues.filter((q) => q.prefix === "B" && q.status !== "waiting").length;

  // Search filter implementation for history table
  const filteredHistory = historyList.filter((item) => {
    const searchLower = historySearch.toLowerCase();
    return (
      item.date.includes(searchLower) ||
      item.textA.includes(searchLower) ||
      item.textB.includes(searchLower)
    );
  });

  // Pagination calculations for history list
  const totalEntries = filteredHistory.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage);
  const indexOfLastHistory = currentPage * entriesPerPage;
  const indexOfFirstHistory = indexOfLastHistory - entriesPerPage;
  const currentHistoryEntries = filteredHistory.slice(indexOfFirstHistory, indexOfLastHistory);

  return (
    <div className="flex-1 bg-white font-sans text-slate-800 flex flex-col overflow-hidden" id="admin-workspace-grid-clean">
      
      {/* 2. FLEX ROW BODY CONTAINING SIDEBAR & VIEWPORT CONTAINER (FLAT, EDGE-TO-EDGE) */}
      <div className="flex flex-1 flex-row overflow-hidden">
        
        {/* RECONCILED FLAT COLLAPSIBLE SIDEBAR */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            // Auto close sidebar on mobile to save screen width
            if (window.innerWidth < 768) {
              setIsSidebarOpen(false);
            }
          }}
          onResetQueues={triggerReset}
          resetConfirmed={resetConfirmed}
          onLogout={onLogout}
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
        />

        {/* COHESIVE MAIN PORTLET VIEWPORT - SOLID BACKGROUND WITH WHITE PANELS */}
        <main className="flex-1 bg-slate-50 p-6 md:p-8 overflow-y-auto flex flex-col justify-between" id="admin-viewport-content">
          <div className="space-y-6">

            {/* VIEWPORT CONTROLLER BASED ON SELECTED TAB */}
            {activeTab === "dashboard" && (
              <div className="space-y-6 animate-fade-in" id="panel-dashboard-retrogravity">
                
                {/* 1. BLUE DATE BANNER MATCHING GAMBAR 1 EXACTLY */}
                <div className="bg-[#bce4fa] text-[#1e3a8a] text-sm font-bold p-3 px-4 rounded mb-5 select-none font-mono" id="repl-date-banner-g1">
                  Tanggal: {(() => {
                    const now = new Date();
                    return `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;
                  })()}
                </div>

                {/* 2. RINGKASAN ANTREAN HARI INI - SIMPLE & HIGH CONTRAST */}
                <div className="bg-white border border-slate-200 rounded shadow-xs overflow-hidden">
                  <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                    <h3 className="font-extrabold text-slate-800 text-xs tracking-wider uppercase select-none">
                      Ringkasan Antrean Pelanggan Hari Ini
                    </h3>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-[#1e293b] text-white font-extrabold border-b border-slate-700 text-[10px] uppercase tracking-wider select-none">
                          <th className="p-3 w-16 text-center border-r border-slate-700">No</th>
                          <th className="p-3 border-r border-slate-700">Jenis Antrian</th>
                          <th className="p-3 text-center border-r border-slate-700">Total Antrian</th>
                          <th className="p-3 text-center border-r border-slate-700 text-rose-300">Belum Dipanggil</th>
                          <th className="p-3 text-center text-emerald-300">Sudah Dipanggil</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150 text-slate-700 bg-white">
                        {(() => {
                          const configuredPrefixes = Array.from(new Set(loketList.map((l) => l.prefix))).sort();
                          
                          const getPrefixName = (prefix: string) => {
                            const matches = loketList.filter((l) => l.prefix === prefix);
                            if (matches.length > 0) {
                              const serviceNames = Array.from(new Set(matches.map((m) => m.serviceName)));
                              return `Antrian ${prefix} - Layanan ${serviceNames.join(" / ")}`;
                            }
                            return `Antrian ${prefix}`;
                          };

                          if (configuredPrefixes.length === 0) {
                            return (
                              <tr>
                                <td colSpan={5} className="p-8 text-center text-slate-400 font-bold italic bg-white select-none">
                                  Belum ada loket dan layanan terdaftar di sistem. Silakan kelola di menu "Setelan Loket" terlebih dahulu.
                                </td>
                              </tr>
                            );
                          }

                          return configuredPrefixes.map((prefix, index) => {
                            const prefixQueues = todayQueues.filter((q) => q.prefix === prefix);
                            const total = prefixQueues.length;
                            const waiting = prefixQueues.filter((q) => q.status === "waiting").length;
                            const called = prefixQueues.filter((q) => q.status !== "waiting").length;

                            return (
                              <tr key={prefix} className="hover:bg-slate-50 transition-colors">
                                <td className="p-3.5 font-mono font-bold text-center text-slate-400 border-r border-slate-150">
                                  {index + 1}
                                </td>
                                <td className="p-3.5 font-bold text-slate-800 border-r border-slate-150">
                                  {getPrefixName(prefix)}
                                </td>
                                <td className="p-3.5 font-bold text-center text-slate-700 border-r border-slate-150 font-mono">
                                  {total}
                                </td>
                                <td className="p-3.5 font-bold text-center text-rose-600 border-r border-slate-150 font-mono">
                                  {waiting}
                                </td>
                                <td className="p-3.5 font-bold text-center text-emerald-600 font-mono">
                                  {called}
                                </td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 3. HISTORY ANTRIAN SECTION */}
                <div>
                  <h3 className="font-bold text-slate-800 text-base tracking-wide mt-8 mb-4 select-none">
                    History Antrian
                  </h3>

                  <div className="bg-white border border-slate-200 rounded shadow-xs overflow-hidden">
                    {/* Filter and Search Box Inputs matching Gambar 1 style exactly */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center p-4 border-b border-slate-150 text-xs bg-slate-50/50">
                      <div className="flex items-center gap-2 text-slate-650">
                        <span>Tampilkan</span>
                        <select
                          value={entriesPerPage}
                          onChange={(e) => {
                            setEntriesPerPage(Number(e.target.value));
                            setCurrentPage(1);
                          }}
                          className="px-2.5 py-1 bg-white border border-slate-300 rounded text-slate-800 font-bold outline-none cursor-pointer focus:border-slate-400"
                        >
                          <option value={5}>5</option>
                          <option value={10}>10</option>
                          <option value={20}>20</option>
                        </select>
                        <span>entri per halaman</span>
                      </div>

                      <div className="relative w-full sm:w-64">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <Search className="w-4 h-4 text-slate-400" />
                        </span>
                        <input
                          type="text"
                          placeholder="Cari data..."
                          value={historySearch}
                          onChange={(e) => {
                            setHistorySearch(e.target.value);
                            setCurrentPage(1);
                          }}
                          className="w-full pl-9 pr-4 py-1.5 bg-white border border-slate-300 rounded text-slate-750 font-medium placeholder-slate-420 outline-none text-xs focus:border-slate-500"
                        />
                      </div>
                    </div>

                    {/* History table list */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-[#1e293b] text-white font-extrabold border-b border-slate-700 text-[10px] uppercase tracking-wider select-none">
                            <th className="p-3 w-16 text-center border-r border-slate-700">No</th>
                            <th className="p-3 border-r border-slate-700">Jumlah Antrian Layanan A</th>
                            <th className="p-3 border-r border-slate-700">Jumlah Antrian Layanan B</th>
                            <th className="p-3">Tanggal Operasional</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-150 text-slate-700 bg-white">
                          {currentHistoryEntries.length > 0 ? (
                            currentHistoryEntries.map((row, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-3 font-mono font-bold text-center text-slate-400 border-r border-slate-150">
                                  {indexOfFirstHistory + idx + 1}
                                </td>
                                <td className="p-3 font-semibold text-slate-800 border-r border-slate-150">
                                  {row.textA} antrean
                                </td>
                                <td className="p-3 font-semibold text-slate-800 border-r border-slate-150">
                                  {row.textB} antrean
                                </td>
                                <td className="p-3 font-mono text-slate-600">
                                  {(() => {
                                    if (row.date && /^\d{4}-\d{2}-\d{2}$/.test(row.date)) {
                                      const [yyyy, mm, dd] = row.date.split("-");
                                      return `${dd}/${mm}/${yyyy}`;
                                    }
                                    return row.date;
                                  })()}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={4} className="p-8 text-center text-slate-400 font-bold italic bg-white select-none">
                                Belum ada antrean
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination footer */}
                    {totalPages > 1 && (
                      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 font-medium select-none">
                        <span>Menampilkan {indexOfFirstHistory + 1} - {Math.min(indexOfLastHistory, totalEntries)} dari {totalEntries} entri</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1 bg-white hover:bg-slate-100 disabled:opacity-55 text-slate-705 border border-slate-300 rounded font-bold transition-all cursor-pointer"
                          >
                            Sebelumnya
                          </button>
                          <span className="px-3 font-mono font-bold text-slate-800">Halaman {currentPage} / {totalPages}</span>
                          <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 bg-white hover:bg-slate-100 disabled:opacity-55 text-slate-705 border border-slate-300 rounded font-bold transition-all cursor-pointer"
                          >
                            Selanjutnya
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* TAB: KIOS CETAK TIKET */}
            {activeTab === "kiosk" && (
              <div className="space-y-6" id="panel-kiosk-simulation">
                <div className="bg-sky-50 text-sky-950 p-5 rounded border border-sky-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="font-extrabold text-sm uppercase">Cetak Kiosk Antrean</h3>
                    <p className="text-xs text-sky-850 mt-1">Halaman cetak tiket mandiri loket pelayanan untuk melayani kebutuhan pelanggan di ruang tunggu lobby.</p>
                  </div>
                  <span className="px-3 py-1 font-mono font-bold text-xs bg-sky-600 text-white rounded uppercase">Thermal Printer Mode</span>
                </div>

                <TicketPrinter
                  printSettings={printSettings}
                  loketList={loketList}
                  onAddQueue={onAddNewQueue}
                  lastCreatedQueue={lastCreatedQueue}
                />
              </div>
            )}

            {/* TAB: TV MONITOR DISPLAY */}
            {activeTab === "tv" && (
              <div className="space-y-6" id="panel-tv-monitor">
                <div className="bg-emerald-50 text-emerald-950 p-5 rounded border border-emerald-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <button
                    onClick={() => setIsFullscreenDisplay(true)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded border border-emerald-500 cursor-pointer shadow-xs transition-colors"
                  >
                    Buka Mode TV Fullscreen
                  </button>
                </div>

                <DisplayMonitor
                  settings={monitorSettings}
                  loketList={loketList}
                  activeQueues={queues}
                />
              </div>
            )}

            {/* TAB: SETELAN LOKET */}
            {activeTab === "loket" && (
              <div className="space-y-6">
                <div className="p-4 bg-violet-50 text-violet-955 rounded border border-violet-200">
                  <h3 className="font-extrabold text-sm uppercase">Pengaturan Nama Pelayanan Loket</h3>
                </div>
                <SetelanLoket loketList={loketList} onUpdateLoket={onUpdateLoket} />
              </div>
            )}

            {/* TAB: PENGATURAN MONITOR */}
            {activeTab === "monitor" && (
              <PengaturanMonitor monitorSettings={monitorSettings} onUpdateMonitorSettings={onUpdateMonitorSettings} />
            )}

            {/* TAB: PENGATURAN PRINTER */}
            {activeTab === "print" && (
              <PengaturanPrinter printSettings={printSettings} onUpdatePrintSettings={onUpdatePrintSettings} />
            )}

            {/* TAB: PENGGUNA */}
            {activeTab === "users" && (
              <Pengguna usersList={usersList} onUpdateUsersList={onUpdateUsersList} />
            )}

            {/* TAB: REKAP DATA PELANGGAN */}
            {activeTab === "rekap" && (
              <RekapDataPelanggan queues={queues} onDeleteQueue={onDeleteQueue} />
            )}

          </div>

          {/* Simple crisp system credentials footer matching the requested theme */}
          <div className="mt-8 pt-4 border-t border-slate-200 flex justify-center items-center text-[10px] text-slate-400 font-bold gap-2 select-none uppercase tracking-wider">
            <span className="text-center">
              @2026 PT PLN (PERSERO) ULP MANTINGAN - SISTEM ANTRIAN PELANGGAN
            </span>
          </div>

        </main>

      </div>
    </div>
  );
}
