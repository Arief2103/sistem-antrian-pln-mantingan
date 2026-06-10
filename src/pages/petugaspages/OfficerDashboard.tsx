import React, { useState, useEffect } from "react";
import { LoketItem, QueueItem, User as UserType, PrintSettings } from "../../types";
import { printThermalReceipt } from "../../utils/printReceipt";
import { 
  PlusCircle, 
  Volume2, 
  CheckCircle, 
  RotateCcw, 
  Users, 
  LogOut, 
  ArrowLeft, 
  Clock, 
  Sparkles, 
  ChevronRight, 
  Inbox,
  AlertCircle,
  Printer,
  ChevronLeft,
  Flame,
  Check,
  User,
  Phone,
  MapPin,
  ClipboardList,
  Bolt,
  ArrowRight,
  Edit2
} from "lucide-react";

interface OfficerDashboardProps {
  loketList: LoketItem[];
  queues: QueueItem[];
  currentUser: UserType | null;
  onCallQueue: (queueId: string, loketId: string, loketName: string) => void;
  onCompleteQueue: (queueId: string) => void;
  onSkipQueue: (queueId: string) => void;
  onAddQueue: (
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
  onLogout: () => void;
  printSettings: PrintSettings;
}

export default function OfficerDashboard({
  loketList,
  queues,
  currentUser,
  onCallQueue,
  onCompleteQueue,
  onSkipQueue,
  onAddQueue,
  onLogout,
  printSettings,
}: OfficerDashboardProps) {
  // Navigation State
  // Mode selection: "menu" (2 cards main), "registrasi" (Ambil Tiket / Card 1), "panggil" (Room Panggilan / Card 2)
  const [currentMode, setCurrentMode] = useState<"menu" | "registrasi" | "panggil">("menu");
  
  // Under Calling mode: selected service prefix calling room (null = show prefix selection cards, e.g., A or B inside Calling Menu)
  const [selectedPrefixCall, setSelectedPrefixCall] = useState<string | null>(null);

  // Seat / Desk selection for Calling
  const [selectedLoketId, setSelectedLoketId] = useState<string>(() => {
    const active = (loketList || []).filter((l) => l.isActive);
    return active.length > 0 ? active[0].id : "";
  });

  // Ticket newly printed overlay state for simulated receipt printing
  const [justPrintedTicket, setJustPrintedTicket] = useState<QueueItem | null>(null);

  // Form input states for customer registration (bisa diisi atau dilewati)
  const [registrasiStep, setRegistrasiStep] = useState<"form" | "kategori">("form");
  const [custNama, setCustNama] = useState("");
  const [custIdPel, setCustIdPel] = useState("");
  const [custAlamat, setCustAlamat] = useState("");
  const [custHp, setCustHp] = useState("");
  const [custKeterangan, setCustKeterangan] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const isFormEmpty = !custNama.trim() && !custIdPel.trim() && !custAlamat.trim() && !custHp.trim() && !custKeterangan.trim();

  // Clear validation warning automatically when any input field becomes non-empty
  useEffect(() => {
    if (!isFormEmpty) {
      setFormError(null);
    }
  }, [custNama, custIdPel, custAlamat, custHp, custKeterangan, isFormEmpty]);

  // Keep selected counter focused on mount/real-time loads
  useEffect(() => {
    if (!selectedLoketId && loketList && loketList.length > 0) {
      const active = loketList.filter((l) => l.isActive);
      if (active.length > 0) {
        setSelectedLoketId(active[0].id);
      } else {
        setSelectedLoketId(loketList[0].id);
      }
    }
  }, [loketList, selectedLoketId]);

  const currentLoket = loketList.find((l) => l.id === selectedLoketId);

  // Dynamic dynamic active categories grouped from the active Counter Desks configured in system settings
  const activeCategories = (loketList || [])
    .filter((l) => l.isActive)
    .reduce((acc, current) => {
      if (!acc.some((item) => item.prefix === current.prefix)) {
        acc.push({
          prefix: current.prefix,
          serviceName: current.serviceName,
        });
      }
      return acc;
    }, [] as { prefix: string; serviceName: string }[]);

  // Daily isolate queues (Today only)
  const todayStr = new Date().toDateString();
  const todayQueues = queues.filter((q) => {
    if (!q.createdAt) return false;
    return new Date(q.createdAt).toDateString() === todayStr;
  });

  // Handle click on instant manual add ticket
  const handleAddNewTicket = (prefix: string, serviceName: string) => {
    try {
      const customerData = {
        pelangganNama: custNama.trim(),
        pelangganId: custIdPel.trim(),
        pelangganAlamat: custAlamat.trim(),
        pelangganHp: custHp.trim(),
        pelangganKeterangan: custKeterangan.trim(),
      };

      const newTicket = onAddQueue(prefix, serviceName, customerData);
      if (newTicket) {
        setJustPrintedTicket(newTicket);
        // Automatically open printing helper for POS thermal printing
        try {
          printThermalReceipt(newTicket, printSettings);
        } catch (err) {
          console.error("Physical print on officer add failed:", err);
        }
      }

      // Reset form input values
      setCustNama("");
      setCustIdPel("");
      setCustAlamat("");
      setCustHp("");
      setCustKeterangan("");
      
      // Reset step to form for the next customer
      setRegistrasiStep("form");
    } catch (e) {
      console.error("Failed to add queue manual offline:", e);
    }
  };

  // Calling oldest queue item next of selected prefix automatically
  const handleCallOldestNext = (prefix: string) => {
    const matchingLoket = loketList.find((l) => l.prefix === prefix && l.isActive) 
      || loketList.find((l) => l.prefix === prefix) 
      || { id: `default-${prefix}`, name: `Loket Pelayanan ${prefix}` };

    const waitingPrefixQueues = todayQueues.filter(
      (q) => q.prefix === prefix && q.status === "waiting"
    );

    if (waitingPrefixQueues.length > 0) {
      const target = waitingPrefixQueues[0]; // oldest
      onCallQueue(target.id, matchingLoket.id, matchingLoket.name);
    } else {
      alert(`Tidak ada antrean berstatus Menunggu untuk layanan Kode ${prefix} saat ini.`);
    }
  };

  return (
    <div className="space-y-6" id="officer-simplified-dashboard-container">
      
      {/* Main Container Dashboard */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm min-h-[460px]" id="officer-workplace-dashboard">
        
        {/* ==================================== */}
        {/* VIEW 1: MENU UTAMA (2 MAIN CARDS)    */}
        {/* ==================================== */}
        {currentMode === "menu" && (
          <div className="space-y-6 fade-in animate-fade-in" id="officer-landing-menu">
            <div className="text-center max-w-lg mx-auto py-4">
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Selamat Datang di Menu Pelayanan Kantor</h3>
              <p className="text-xs text-slate-400 mt-1.5 font-semibold">
                Pilih salah satu aktivitas di bawah ini untuk memulai melayani pelanggan PLN ULP Mantingan.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto py-3">
              {/* Card 1: Registrasi / Ambil Nomor Antrean */}
              <div 
                onClick={() => setCurrentMode("registrasi")}
                className="bg-[#1E40AF] border-2 border-[#3B82F6]/40 text-white rounded-3xl p-8 cursor-pointer shadow-lg hover:bg-[#1D4ED8] hover:shadow-xl focus:bg-[#1E3A8A] hover:scale-[1.01] active:scale-95 transition-all duration-300 group flex flex-col items-center justify-between text-center space-y-5 min-h-[300px]"
                id="main-card-registrasi"
              >
                <div className="w-20 h-20 bg-amber-450 bg-amber-200 text-slate-905 text-blue-900 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-all duration-300">
                  <PlusCircle className="w-10 h-10" />
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-extrabold text-[#EEF2FF] text-lg md:text-xl group-hover:text-amber-200 transition-colors">
                    AMBIL NOMOR ANTRIAN
                  </h4>
                  <p className="text-[11px] text-[#EEF2FF]/90 max-w-xs leading-relaxed font-semibold">
                    Gunakan menu ini jika ada pelanggan baru datang. Tanyakan apa yang diperlukan pelanggan, lalu cetak/generate nomor antrean untuk mereka.
                  </p>
                </div>

                <span className="inline-flex items-center gap-1.5 text-[10px] uppercase font-black text-slate-900 tracking-wider bg-amber-200 px-4 py-2.5 rounded-full group-hover:bg-amber-300 shadow-md transition-colors">
                  Ambil Nomor Antrian 
                </span>
              </div>

              {/* Card 2: Panggil & Layani Antrean */}
              <div 
                onClick={() => setCurrentMode("panggil")}
                className="bg-[#009295] border-2 border-[#14B8A6]/40 text-white rounded-3xl p-8 cursor-pointer shadow-lg hover:bg-[#007073] hover:shadow-xl focus:bg-[#005254] hover:scale-[1.01] active:scale-95 transition-all duration-300 group flex flex-col items-center justify-between text-center space-y-5 min-h-[300px]"
                id="main-card-panggil"
              >
                <div className="w-20 h-20 bg-amber-400 bg-amber-200 text-slate-905 text-teal-900 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-all duration-300">
                  <Volume2 className="w-10 h-10" />
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-extrabold text-[#E0F2FE] text-lg md:text-xl group-hover:text-amber-200 transition-colors">
                    PANGGIL ANTRIAN
                  </h4>
                  <p className="text-[11px] text-[#E0F2FE]/90 max-w-xs leading-relaxed font-semibold">
                    Gunakan menu ini untuk memanggil pelanggan dengan suara, melihat antrean menunggu, dan memproses status selesai pelayanan.
                  </p>
                </div>

                <span className="inline-flex items-center gap-1.5 text-[10px] uppercase font-black text-slate-900 tracking-wider bg-amber-200 px-4 py-2.5 rounded-full group-hover:bg-amber-300 shadow-md transition-colors">
                  Panggil Antrian
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ============================================= */}
        {/* VIEW 2: KIOS REGISTRASI TIKET (CARD 1 SELECTED) */}
        {/* ============================================= */}
        {currentMode === "registrasi" && (
          <div className="space-y-6 fade-in animate-fade-in" id="officer-registrasi-room">
            
            {/* Top Toolbar Navigation */}
            <div className="flex items-center justify-between border-b pb-4 mb-2">
              <button 
                onClick={() => {
                  setRegistrasiStep("form");
                  setCustNama("");
                  setCustIdPel("");
                  setCustAlamat("");
                  setCustHp("");
                  setCustKeterangan("");
                  setCurrentMode("menu");
                }}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer border border-slate-200/40"
              >
                <ChevronLeft className="w-4 h-4" /> Kembali ke Menu Utama
              </button>
              
            </div>

            <div className="max-w-4xl mx-auto space-y-6">
              
              {/* Header */}
              <div className="text-left">
              </div>

              {activeCategories.length === 0 ? (
                <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
                  <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                  <p className="text-xs text-slate-550 font-extrabold uppercase">Tidak Ada Layanan Aktif</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Silakan lengkapi dan aktifkan Desk Loket / Jenis Layanan di menu Admin "Setelan Loket" terlebih dahulu.
                  </p>
                </div>
              ) : (
                <>
                  {/* STEP 1: FORM INPUT */}
                  {registrasiStep === "form" && (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
                      <div className="border-b border-slate-200 pb-3 flex justify-between items-center bg-white/50 -mx-6 -mt-6 p-4 rounded-t-2xl">
                        <div>
                          <h4 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider block mt-1">
                            FORM DATA ANTRIAN PELANGGAN PLN ULP MANTINGAN
                          </h4>
                        </div>
                      </div>

                      <div className="flex flex-col gap-4 max-w-xl mx-auto w-full">
                        {/* 1. ID Pelanggan pln */}
                        <div className="space-y-1.5 text-left">
                          <label className="block text-xs font-black text-slate-700 uppercase flex items-center gap-1.5 tracking-wider">
                            <Bolt className="w-3.5 h-3.5 text-amber-500" /> ID Pelanggan
                          </label>
                          <input
                            type="text"
                            maxLength={12}
                            placeholder="Contoh: 512345678901"
                            value={custIdPel}
                            onChange={(e) => setCustIdPel(e.target.value.replace(/\D/g, ""))}
                            className="w-full bg-white border-2 border-slate-200 text-xs font-mono font-bold rounded-xl p-3 text-slate-800 focus:outline-none focus:border-[#00A19D] focus:ring-2 focus:ring-teal-100 transition-all duration-150 shadow-sm"
                          />
                        </div>

                        {/* 2. Nama Pelanggan */}
                        <div className="space-y-1.5 text-left">
                          <label className="block text-xs font-black text-slate-700 uppercase flex items-center gap-1.5 tracking-wider">
                            <User className="w-3.5 h-3.5 text-sky-500" /> Nama Pelanggan
                          </label>
                          <input
                            type="text"
                            placeholder="Contoh: Ahmad Budiman"
                            value={custNama}
                            onChange={(e) => setCustNama(e.target.value)}
                            className="w-full bg-white border-2 border-slate-200 text-xs font-bold rounded-xl p-3 text-slate-800 focus:outline-none focus:border-[#00A19D] focus:ring-2 focus:ring-teal-100 transition-all duration-150 shadow-sm"
                          />
                        </div>

                        {/* 3. Alamat */}
                        <div className="space-y-1.5 text-left">
                          <label className="block text-xs font-black text-slate-700 uppercase flex items-center gap-1.5 tracking-wider">
                            <MapPin className="w-3.5 h-3.5 text-rose-500" /> Alamat Lengkap
                          </label>
                          <input
                            type="text"
                            placeholder="Masukan Alamat"
                            value={custAlamat}
                            onChange={(e) => setCustAlamat(e.target.value)}
                            className="w-full bg-white border-2 border-slate-200 text-xs font-semibold rounded-xl p-3 text-slate-800 focus:outline-none focus:border-[#00A19D] focus:ring-2 focus:ring-teal-100 transition-all duration-150 shadow-sm"
                          />
                        </div>

                        {/* 4. Nomor Telepon */}
                        <div className="space-y-1.5 text-left">
                          <label className="block text-xs font-black text-slate-700 uppercase flex items-center gap-1.5 tracking-wider">
                            <Phone className="w-3.5 h-3.5 text-emerald-500" /> Nomor Telepon
                          </label>
                          <input
                            type="tel"
                            placeholder="Contoh: 081234567890"
                            value={custHp}
                            onChange={(e) => setCustHp(e.target.value)}
                            className="w-full bg-white border-2 border-slate-200 text-xs font-mono font-bold rounded-xl p-3 text-slate-800 focus:outline-none focus:border-[#00A19D] focus:ring-2 focus:ring-teal-100 transition-all duration-150 shadow-sm"
                          />
                        </div>

                        {/* 5. Keterangan */}
                        <div className="space-y-1.5 text-left">
                          <label className="block text-xs font-black text-slate-700 uppercase flex items-center gap-1.5 tracking-wider">
                            <ClipboardList className="w-3.5 h-3.5 text-purple-550 text-purple-600" /> Keterangan / Keperluan
                          </label>
                          <input
                            type="text"
                            placeholder="Contoh: Pengaduan meteran prabayar rusak"
                            value={custKeterangan}
                            onChange={(e) => setCustKeterangan(e.target.value)}
                            className="w-full bg-white border-2 border-slate-200 text-xs font-semibold rounded-xl p-3 text-slate-800 focus:outline-none focus:border-[#00A19D] focus:ring-2 focus:ring-teal-100 transition-all duration-150 shadow-sm"
                          />
                        </div>
                      </div>

                      {formError && (
                        <div className="max-w-xl mx-auto w-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl p-3 flex items-center gap-2.5 animate-fade-in" id="form-validation-alert">
                          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                          <span>{formError}</span>
                        </div>
                      )}

                      {/* Footer Actions inside form step */}
                      <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-slate-200 justify-center max-w-xl mx-auto w-full">
                        <button
                          type="button"
                          onClick={() => {
                            setCustNama("");
                            setCustIdPel("");
                            setCustAlamat("");
                            setCustHp("");
                            setCustKeterangan("");
                            setFormError(null);
                            setRegistrasiStep("kategori");
                          }}
                          className="px-6 py-3.5 bg-white border-2 border-[#00A19D] hover:bg-teal-50/40 text-[#00A19D] font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-95 duration-150 w-full sm:w-1/2"
                        >
                          Lewati Form <ArrowRight className="w-4 h-4 text-[#00A19D]" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (isFormEmpty) {
                              setFormError("Mohon lengkapi data pelanggan terlebih dahulu!");
                            } else {
                              setFormError(null);
                              setRegistrasiStep("kategori");
                            }
                          }}
                          className="px-6 py-3.5 bg-[#00A19D] hover:bg-teal-700 hover:shadow-lg active:scale-95 text-white font-extrabold text-xs rounded-xl border-2 border-teal-600 transition-all flex items-center justify-center gap-2 duration-150 w-full sm:w-1/2 cursor-pointer shadow-md"
                        >
                          Simpan & Buat Antrean <ArrowRight className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 2: CATEGORY SELECTOR CARDS */}
                  {registrasiStep === "kategori" && (
                    <div className="space-y-6">
                      
                      {/* Alert banner with current attached form details */}
                      { (custNama || custIdPel || custHp || custAlamat || custKeterangan) ? (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center sm:items-center justify-between gap-3 text-left">
                          <div className="space-y-1">
                            <span className="text-[9px] font-black tracking-wider text-emerald-700 bg-emerald-100 border border-emerald-250 py-0.5 px-2 rounded uppercase font-mono">
                              DATA PELANGGAN BERHASIL DIINPUT
                            </span>
                            <div className="text-xs text-slate-850 font-bold flex flex-wrap gap-2 items-center mt-1">
                              <span>Nama: <strong className="text-emerald-800 font-extrabold uppercase">{custNama || "Tanpa Nama"}</strong></span>
                              {custIdPel && <span>• ID Pel: <strong className="font-mono text-emerald-850 bg-emerald-100/50 px-1 rounded">{custIdPel}</strong></span>}
                              {custHp && <span>• No Hp: <strong className="font-mono text-emerald-850">{custHp}</strong></span>}
                            </div>
                          </div>
                          <button
                            onClick={() => setRegistrasiStep("form")}
                            className="text-xs font-bold text-teal-700 bg-white hover:bg-teal-50 border border-teal-200 py-1.5 px-3 rounded-lg flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95 transition-all w-full sm:w-auto justify-center"
                          >
                            <Edit2 className="w-3.5 h-3.5" /> Ubah Data Form
                          </button>
                        </div>
                      ) : (
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center sm:items-center justify-between gap-3 text-left">
                          <div className="space-y-0.5">
                            <span className="text-[9px] font-black tracking-wider text-slate-500 bg-slate-200 py-0.5 px-2 rounded uppercase font-mono">
                              PENDAFTARAN INSTAN / TANPA FORM
                            </span>
                            <p className="text-xs text-slate-500 font-semibold mt-1">
                              Tiket antrean akan segera dicetak kosong tanpa menyertakan metadata identitas pelanggan.
                            </p>
                          </div>
                          <button
                            onClick={() => setRegistrasiStep("form")}
                            className="text-xs font-bold text-teal-700 bg-white hover:bg-teal-50 border border-teal-200 py-1.5 px-3 rounded-lg flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95 transition-all w-full sm:w-auto justify-center"
                          >
                            <Edit2 className="w-3.5 h-3.5" /> Isi Identitas Pelanggan
                          </button>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto py-2">
                        {activeCategories.map((cat) => {
                          const activePrefixQueuesToday = todayQueues.filter((q) => q.prefix === cat.prefix);
                          const lastQueueNum = activePrefixQueuesToday.length > 0
                            ? `${cat.prefix}${activePrefixQueuesToday.length}`
                            : "--";

                          const isCategoryA = cat.prefix === "A";

                          const cardBgBorder = isCategoryA
                            ? "bg-[#0284C7] border border-sky-400/30 shadow-lg shadow-sky-900/10 hover:shadow-xl hover:shadow-sky-900/20 hover:bg-[#0274B0] transition-all duration-300"
                            : "bg-[#10B981] border border-emerald-400/30 shadow-lg shadow-emerald-900/10 hover:shadow-xl hover:shadow-emerald-900/20 hover:bg-[#0F9F6E] transition-all duration-300";

                          const badgeStyle = "bg-white/10 text-white border border-white/20";

                          const buttonStyle = isCategoryA
                            ? "bg-white hover:bg-sky-50 text-[#0284C7] active:bg-sky-100 font-extrabold"
                            : "bg-white hover:bg-emerald-50 text-[#10B981] active:bg-emerald-100 font-extrabold";

                          return (
                            <div 
                              key={cat.prefix}
                              className={`${cardBgBorder} rounded-3xl p-5 transition-all flex flex-col justify-between aspect-[5/7] max-w-sm w-full mx-auto md:min-h-[290px] md:max-h-[320px] shadow-lg hover:scale-[1.015] duration-200 group`}
                              id={`ambil-nomor-card-${cat.prefix}`}
                            >
                              {/* 1. Header Area with Clean White Text */}
                              <div className="flex gap-4">
                                <div className={`w-11 h-11 ${badgeStyle} font-black text-lg rounded-xl flex items-center justify-center shrink-0 shadow-sm font-sans`}>
                                  {cat.prefix}
                                </div>
                                <div className="space-y-0.5 flex-1 text-left">
                                  <h4 className="font-extrabold text-sm sm:text-base text-white tracking-tight leading-tight">
                                    {cat.serviceName}
                                  </h4>
                                  <div className="flex flex-wrap items-center gap-1.5 text-[9px] text-white/85 tracking-wide uppercase font-bold font-mono">
                                    <span>PREFIKS KODE: {cat.prefix}</span>
                                  </div>
                                </div>
                              </div>

                              {/* 2. Middle Stats Panel - Styled like a clean elegant playing card info window */}
                              <div className="my-[8%] py-3.5 px-4 bg-white/10 rounded-2xl border border-white/15 flex items-center justify-between">
                                <div className="space-y-0.5 text-left">
                                  <span className="text-[9px] font-bold text-white/80 tracking-wider block font-mono">TERAKHIR DIAMBIL</span>
                                  <span className="text-2xl font-mono font-black text-white tracking-tight">{lastQueueNum}</span>
                                </div>
                                <div className="text-right space-y-0.5 border-l border-white/20 pl-4">
                                  <span className="text-[9px] font-bold text-white/80 tracking-wider block font-mono">TERDAFTAR HARI INI</span>
                                  <span className="text-xl font-mono font-black text-white tracking-tight">
                                    {activePrefixQueuesToday.length} <span className="text-[9px] text-white/85 font-sans font-semibold">Antrean</span>
                                  </span>
                                </div>
                              </div>

                              {/* 3. Action Button Zone - Huge, high-padding touch targets */}
                              <div className="space-y-2">
                                <p className="text-[9px] text-white/80 text-center flex items-center justify-center gap-1 font-mono uppercase tracking-wider">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                  Aman dari Salah Pemencetan
                                </p>
                                <button
                                  onClick={() => handleAddNewTicket(cat.prefix, cat.serviceName)}
                                  className={`${buttonStyle} w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 duration-100 cursor-pointer`}
                                  id={`btn-ambil-tiket-${cat.prefix}`}
                                >
                                  <Printer className="w-4 h-4" /> AMBIL TIKET {cat.prefix}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* ============================================= */}
        {/* VIEW 3: RUANG PANGGILAN (DIRECT MULTI-BLOCK)  */}
        {/* ============================================= */}
        {currentMode === "panggil" && (
          <div className="space-y-6 fade-in animate-fade-in" id="officer-panggilan-panel">
            
            {/* Nav Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b pb-4 gap-3">
              <button 
                onClick={() => {
                  setCurrentMode("menu");
                }}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer border border-slate-200/40"
              >
                <ChevronLeft className="w-4 h-4" /> Kembali ke Menu Utama
              </button>

              <span className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">
                Panel Panggilan Antrean PLN ULP Mantingan
              </span>
            </div>

            {/* Direct Multi-Block for Active Categories */}
            {activeCategories.length === 0 ? (
              <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
                <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                <p className="text-xs text-slate-550 font-extrabold uppercase">Tidak Ada Layanan Aktif</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Silakan hubungi administrator Anda untuk mendaftarkan layanan di Setelan Loket.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6" id="calling-all-blocks">
                {activeCategories.map((cat) => {
                  const matchingLoket = loketList.find((l) => l.prefix === cat.prefix && l.isActive) 
                    || loketList.find((l) => l.prefix === cat.prefix) 
                    || { id: `default-${cat.prefix}`, name: `Loket Pelayanan ${cat.prefix}` };

                  const currentServingQueue = todayQueues.find(
                    (q) => q.status === "calling" && q.prefix === cat.prefix
                  );

                  const waitingPrefixQueues = todayQueues.filter(
                    (q) => q.prefix === cat.prefix && q.status === "waiting"
                  );

                  const countCompleted = todayQueues.filter(
                    (q) => q.prefix === cat.prefix && q.status === "completed"
                  ).length;

                  const countSkipped = todayQueues.filter(
                    (q) => q.prefix === cat.prefix && q.status === "skipped"
                  ).length;

                  const completedOrSkippedPrefixQueues = todayQueues
                    .filter((q) => q.prefix === cat.prefix && (q.status === "completed" || q.status === "skipped"))
                    .sort((a, b) => {
                      const timeA = b.completedAt || b.calledAt || b.createdAt || "";
                      const timeB = a.completedAt || a.calledAt || a.createdAt || "";
                      return timeA.localeCompare(timeB);
                    });

                  const isA = cat.prefix === "A";

                  return (
                    <div 
                      key={cat.prefix} 
                      className={isA 
                        ? "bg-[#005B9C] border-2 border-[#004C85] shadow-lg rounded-3xl overflow-hidden flex flex-col justify-between transition-all duration-200"
                        : "bg-[#02855F] border-2 border-[#115F38] shadow-lg rounded-3xl overflow-hidden flex flex-col justify-between transition-all duration-200"
                      }
                      id={`panggilan-block-${cat.prefix}`}
                    >
                      {/* Top ribbon for the service code */}
                      <div className={isA
                        ? "bg-gradient-to-r from-[#004C85] to-[#00345C] text-white px-5 py-4 flex items-center justify-between gap-3 font-sans border-b border-[#00345C]"
                        : "bg-gradient-to-r from-[#115F38] to-[#083520] text-white px-5 py-4 flex items-center justify-between gap-3 font-sans border-b border-[#083520]"
                      }>
                        <div className="flex items-center gap-3">
                          <div className={isA
                            ? "w-10 h-10 bg-white text-[#005B9C] font-extrabold text-base rounded-xl flex items-center justify-center shrink-0 shadow-sm pb-px"
                            : "w-10 h-10 bg-white text-[#02855F] font-extrabold text-base rounded-xl flex items-center justify-center shrink-0 shadow-sm pb-px"
                          }>
                            {cat.prefix}
                          </div>
                          <div className="text-left">
                            <h4 className="font-extrabold text-white text-xs sm:text-sm tracking-tight leading-none mb-1">
                              {cat.serviceName}
                            </h4>
                            <p className={isA 
                              ? "text-[10px] text-sky-100 font-bold uppercase tracking-wider" 
                              : "text-[10px] text-emerald-100 font-bold uppercase tracking-wider"
                            }>
                              Total Hari Ini: {todayQueues.filter((q) => q.prefix === cat.prefix).length} Antrean
                            </p>
                          </div>
                        </div>

                        <span className={isA
                          ? "text-[10px] font-extrabold bg-[#002440]/60 text-sky-100 px-2.5 py-1 rounded-md uppercase shrink-0 border border-[#004C85]"
                          : "text-[10px] font-extrabold bg-[#083520]/60 text-emerald-100 px-2.5 py-1 rounded-md uppercase shrink-0 border border-[#115F38]"
                        }>
                          LOKET {cat.prefix}
                        </span>
                      </div>

                      {/* Content panel */}
                      <div className="p-5 flex flex-col space-y-4">
                        
                        {/* LEFT/TOP: Active Caller Controller */}
                        <div className="space-y-4">
                          {currentServingQueue ? (
                            <div className="bg-white/10 text-white rounded-2xl p-4 border border-white/15 shadow-md flex flex-col justify-between space-y-3">
                              <div className="text-center py-1">
                                <span className="inline-flex items-center gap-1 bg-white/10 border border-white/10 text-white px-2.5 py-0.5 rounded-full text-[9px] uppercase font-black tracking-widest animate-pulse">
                                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                                  Sedang Dipanggil di {matchingLoket.name}
                                </span>
                                
                                <h3 className="text-4xl font-extrabold tracking-tight text-white my-2">
                                  {currentServingQueue.formattedNumber}
                                </h3>
                                
                                <p className="text-[10px] text-white/90 uppercase tracking-wide truncate max-w-xs mx-auto font-bold">
                                  {currentServingQueue.serviceName}
                                </p>
                              </div>

                              <div className="grid grid-cols-2 gap-2 border-t border-white/10 pt-3">
                                <button
                                  onClick={() => onCallQueue(currentServingQueue.id, currentServingQueue.loketId || "", currentServingQueue.loketName || "")}
                                  className={isA
                                    ? "inline-flex items-center justify-center gap-1 bg-white hover:bg-sky-50 text-[#005B9C] rounded-xl py-2 text-xs font-black transition-all active:scale-95 cursor-pointer shadow-md uppercase tracking-wider"
                                    : "inline-flex items-center justify-center gap-1 bg-white hover:bg-emerald-50 text-[#02855F] rounded-xl py-2 text-xs font-black transition-all active:scale-95 cursor-pointer shadow-md uppercase tracking-wider"
                                  }
                                >
                                  <RotateCcw className="w-3.5 h-3.5" /> Panggil Ulang
                                </button>

                                <button
                                  onClick={() => onCompleteQueue(currentServingQueue.id)}
                                  className="inline-flex items-center justify-center gap-1 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl py-2 text-xs font-black transition-all active:scale-95 cursor-pointer shadow-md uppercase tracking-wider"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" /> Selesai Layani
                                </button>
                              </div>

                              <button
                                onClick={() => onSkipQueue(currentServingQueue.id)}
                                className="w-full py-1.5 bg-white/5 hover:bg-rose-600 hover:text-white hover:border-rose-600 text-white/80 border border-white/15 rounded-xl text-[10px] font-bold transition-all cursor-pointer uppercase tracking-wider"
                              >
                                Lewati Nomor
                              </button>
                            </div>
                          ) : (
                            <div className="bg-white/10 border-2 border-dashed border-white/15 rounded-2xl p-4 text-center flex flex-col items-center justify-center min-h-[160px]">
                              <Inbox className="w-7 h-7 text-white/60 mb-1.5" />
                              <h4 className="font-extrabold text-white text-[11px] uppercase tracking-wider">Antrean Kosong</h4>
                              <p className="text-[10px] text-white/80 mt-0.5 max-w-[240px] leading-snug font-semibold">
                                Tidak ada antrean <strong>Layanan ({cat.prefix})</strong> yang aktif dipanggil di meja Anda.
                              </p>

                              <button
                                onClick={() => handleCallOldestNext(cat.prefix)}
                                disabled={waitingPrefixQueues.length === 0}
                                className={`mt-3.5 inline-flex items-center gap-1 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all shadow-md active:scale-95 ${
                                  waitingPrefixQueues.length === 0
                                    ? "bg-white/10 text-white/40 border border-white/10 cursor-not-allowed shadow-none"
                                    : isA 
                                      ? "bg-white hover:bg-sky-50 text-[#005B9C] cursor-pointer"
                                      : "bg-white hover:bg-emerald-50 text-[#02855F] cursor-pointer"
                                }`}
                              >
                                Panggil Antrean Berikutnya ({cat.prefix})
                              </button>
                            </div>
                          )}
                        </div>

                        {/* SUB-GRID: Waiting List & Call History side-by-side */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          
                          {/* COLUMN 1: Waiting List of this category */}
                          <div className="border border-slate-100 rounded-2xl p-4 bg-white shadow-xs">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                              <h5 className="font-extrabold text-slate-800 text-[11px] tracking-wider uppercase flex items-center gap-1">
                                <Users className="w-3.5 h-3.5 text-slate-500" />
                                Menunggu ({cat.prefix})
                              </h5>
                              <span className={isA
                                ? "bg-[#005B9C]/10 text-[#005B9C] border-none font-extrabold px-2 py-0.5 rounded-full text-[10px]"
                                : "bg-[#02855F]/10 text-[#02855F] border-none font-extrabold px-2 py-0.5 rounded-full text-[10px]"
                              }>
                                {waitingPrefixQueues.length} Antrean
                              </span>
                            </div>

                            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                              {waitingPrefixQueues.length === 0 ? (
                                <div className="py-6 text-center text-slate-400 italic text-xs flex flex-col items-center justify-center gap-2">
                                  <Check className="w-6 h-6 text-emerald-500 bg-emerald-50 rounded-full p-1 mx-auto" />
                                  <div>
                                    <p className="font-bold text-slate-700 not-italic uppercase tracking-wide text-[9px]">Selesai dilayani</p>
                                    <p className="text-[9px] text-slate-400 mt-0.5 font-medium">Seluruh antrean Kode {cat.prefix} telah diproses.</p>
                                  </div>
                                </div>
                              ) : (
                                waitingPrefixQueues.map((item) => (
                                  <div 
                                    key={item.id} 
                                    className="p-2 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between hover:border-slate-300 transition-all font-semibold"
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className={isA 
                                        ? "w-8 h-8 bg-[#005B9C] border border-[#004C85]/20 text-white font-extrabold text-xs rounded-lg flex items-center justify-center shrink-0"
                                        : "w-8 h-8 bg-[#02855F] border border-[#115F38]/20 text-white font-extrabold text-xs rounded-lg flex items-center justify-center shrink-0"
                                      }>
                                        {item.formattedNumber}
                                      </div>
                                      <div className="space-y-0.5">
                                        <span className="text-[9px] text-slate-400 block font-bold">
                                          {new Date(item.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                                        </span>
                                        <span className="text-xs font-semibold text-slate-700 line-clamp-1 max-w-[110px]">
                                          {item.serviceName}
                                        </span>
                                      </div>
                                    </div>

                                    <button
                                      onClick={() => {
                                        onCallQueue(item.id, matchingLoket.id, matchingLoket.name);
                                      }}
                                      className={isA
                                        ? "px-2.5 py-1 text-[10px] font-black uppercase rounded-lg bg-[#005B9C] text-white hover:bg-[#004C85] transition-all cursor-pointer shadow-xs"
                                        : "px-2.5 py-1 text-[10px] font-black uppercase rounded-lg bg-[#02855F] text-white hover:bg-[#007050] transition-all cursor-pointer shadow-xs"
                                      }
                                    >
                                      Panggil
                                    </button>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>

                          {/* COLUMN 2: Called History of this category */}
                          <div className="border border-slate-100 rounded-2xl p-4 bg-white shadow-xs">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                              <h5 className="font-extrabold text-slate-800 text-[11px] tracking-wider uppercase flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-slate-500" />
                                Riwayat Dipanggil
                              </h5>
                              <span className="text-[10px] text-slate-500 font-bold bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full">
                                Selesai: {completedOrSkippedPrefixQueues.length}
                              </span>
                            </div>

                            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                              {completedOrSkippedPrefixQueues.length === 0 ? (
                                <div className="py-6 text-center text-slate-400 italic text-xs flex flex-col items-center justify-center gap-2">
                                  <Inbox className="w-5 h-5 text-slate-300 mx-auto" />
                                  <p className="text-[9px] text-slate-400 font-medium">Belum ada antrean selesai/dilewati hari ini.</p>
                                </div>
                              ) : (
                                completedOrSkippedPrefixQueues.map((item) => (
                                  <div 
                                    key={item.id} 
                                    className="p-2 border border-slate-100 rounded-xl flex items-center justify-between bg-slate-50/50"
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-xs text-white shrink-0 ${
                                        item.status === "completed" 
                                          ? "bg-emerald-500 border border-emerald-600 shadow-xs" 
                                          : "bg-slate-400 border border-slate-500 shadow-xs"
                                      }`}>
                                        {item.formattedNumber}
                                      </div>
                                      <div className="space-y-0.5">
                                        <span className="text-[9px] text-slate-400 block font-bold">
                                          {item.completedAt 
                                            ? new Date(item.completedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) 
                                            : new Date(item.calledAt || item.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                                        </span>
                                        <span className="text-xs font-semibold text-slate-500 line-clamp-1 max-w-[110px]">
                                          {item.serviceName}
                                        </span>
                                      </div>
                                    </div>

                                    <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md border ${
                                      item.status === "completed" 
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                                        : "bg-rose-50 text-rose-700 border-rose-200"
                                    }`}>
                                      {item.status === "completed" ? "Selesai" : "Lewat"}
                                    </span>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>

                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

      </div>

      {/* ========================================================== */}
      {/* GLOBAL MODAL OVERLAY: SIMULATOR CETAK STRUK RECEIPT TIKET */}
      {/* ========================================================== */}
      {justPrintedTicket && (
        <div className="fixed inset-0 bg-slate-905 bg-slate-905 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 select-none animate-fade-in animate-duration-200">
          
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative text-center text-white scale-up animate-scale-up space-y-4">
            
            <div className="w-12 h-12 bg-sky-500/20 text-sky-400 rounded-full flex items-center justify-center font-bold mx-auto">
              ⚡
            </div>

            <div className="space-y-0.5">
              <h4 className="font-bold text-sm text-slate-200 uppercase tracking-widest font-mono">TIKET ANTREAN DICETAK</h4>
              <p className="text-[10px] text-slate-550 text-slate-400 font-mono uppercase">PLN ULP MANTINGAN</p>
            </div>

            {/* Simulated Receipt paper layout */}
            <div className="bg-white text-slate-800 rounded-2xl p-6 shadow-inner text-center space-y-4 relative overflow-hidden border-2 border-slate-250" style={{ fontFamily: "'Arial', 'Helvetica', 'sans-serif', 'system-ui'" }}>
              
              {/* Receipt edge zig-zags */}
              <div className="absolute top-0 inset-x-0 h-1 bg-repeat-x bg-[linear-gradient(45deg,transparent_75%,#cbd5e1_75%),linear-gradient(135deg,transparent_75%,#cbd5e1_75%)] bg-[length:10px_10px]"></div>

              {(() => {
                const logoPos = printSettings.logoPosition || (printSettings.showLogo ? "top" : "none");
                return (
                  <div className={`w-full flex ${logoPos === 'side' ? 'flex-row items-center justify-start text-left gap-3' : 'flex-col items-center justify-center text-center gap-2'}`}>
                    {logoPos !== "none" && (
                      printSettings.logoType === "custom" && printSettings.customLogo ? (
                        <div className="shrink-0 w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded p-0.5">
                          <img src={printSettings.customLogo} alt="Logo" className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center shrink-0">
                          <div className="w-6 h-8 bg-[#FFE600] border border-slate-950 rounded relative overflow-hidden flex flex-col items-center justify-center">
                            <div className="text-red-500 font-extrabold text-sm select-none z-10 leading-none mt-[-2px]">⚡</div>
                            <div className="absolute bottom-1 left-0.5 right-0.5 h-[4px] flex flex-col gap-[1px] z-0">
                              <div className="h-[1.5px] bg-[#005FA2] rounded-sm w-full"></div>
                              <div className="h-[1.5px] bg-[#005FA2] rounded-sm w-full"></div>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                    <div className={`flex-1 min-w-0 ${logoPos === 'side' ? 'text-left' : 'text-center'}`}>
                      <h4 className="text-[10px] font-black uppercase text-slate-900 tracking-wider leading-tight">
                        {printSettings.headerText || "PT PLN (PERSERO)"}
                      </h4>
                      <p className="text-[8px] text-slate-500 mt-1 leading-snug">
                        {printSettings.subHeader || "ULP MANTINGAN"}
                      </p>
                    </div>
                  </div>
                );
              })()}

              <div className="border-t border-dashed border-slate-350 w-full pt-3">
                <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest block mb-1">Nomor Antrean Anda</span>
                <h2 className="text-5xl font-black text-slate-900 tracking-tight leading-none py-1">
                  {justPrintedTicket.formattedNumber || ""}
                </h2>
                
                <div className="py-1 mt-2.5 font-extrabold text-[10px] text-slate-800 uppercase tracking-wider border-t border-b border-slate-150 w-full text-center">
                  {justPrintedTicket.serviceName}
                </div>
              </div>

              <div className="border-t border-dashed border-slate-350 w-full pt-3 text-center text-[8.5px] text-slate-500 font-bold">
                <div>
                  {(() => {
                    const d = new Date(justPrintedTicket.createdAt);
                    const dateStr = d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
                    const timeStr = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
                    return `${dateStr} ${timeStr} WIB`;
                  })()}
                </div>
              </div>

              <p className="text-[8.5px] text-slate-500 italic text-center border-t border-dashed border-slate-300 pt-2.5 leading-normal max-w-[190px] mx-auto">
                "{printSettings.footerText || "Terima kasih atas kunjungan anda. Jauhi bahaya listrik demi keselamatan keluarga tercinta."}"
              </p>

            </div>

            <div className="flex gap-2">
              <button 
                type="button"
                onClick={() => {
                  try {
                    printThermalReceipt(justPrintedTicket, printSettings);
                  } catch (err) {
                    console.error("Manual reprint failure:", err);
                  }
                }}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-slate-700"
                title="Cetak ulang struk thermal fisik jika lembar pertama gagal/habis"
              >
                <Printer className="w-4 h-4 text-sky-400" />
                Cetak Ulang
              </button>

              <button 
                onClick={() => setJustPrintedTicket(null)}
                className="flex-1 py-2.5 bg-gradient-to-r from-[#00A19D] to-teal-600 hover:from-teal-500 hover:to-teal-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4 text-emerald-300" /> Serahkan ({justPrintedTicket.formattedNumber})
              </button>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
