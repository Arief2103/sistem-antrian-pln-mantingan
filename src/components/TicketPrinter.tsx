import React, { useState } from "react";
import { PrintSettings, QueueItem, LoketItem } from "../types";
import { Printer, HelpCircle, Flame, Sparkles, AlertCircle, Bolt, RefreshCw, Layers, User, Phone, MapPin, ClipboardList, Send, Edit3, X } from "lucide-react";
import { printThermalReceipt } from "../utils/printReceipt";

interface TicketPrinterProps {
  printSettings: PrintSettings;
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
  lastCreatedQueue: QueueItem | null;
  loketList: LoketItem[];
}

export default function TicketPrinter({
  printSettings,
  onAddQueue,
  lastCreatedQueue,
  loketList,
}: TicketPrinterProps) {
  const defaultPrint = {
    headerText: "PLN ULP MANTINGAN",
    subHeader: "Jl. Raya Mantingan, Ngawi, Jawa Timur",
    footerText: "Terima kasih telah menggunakan pelayanan kami. Jauhi bahaya listrik untuk keluarga tercinta.",
    showLogo: true,
    paperWidth: "58mm",
  };
  const safeSettings = { ...defaultPrint, ...(printSettings || {}) };

  const [printingStatus, setPrintingStatus] = useState<"idle" | "printing" | "success">("idle");
  const [justPrintedTicket, setJustPrintedTicket] = useState<QueueItem | null>(null);

  // Customer registration states on kiosk
  const [selectedCat, setSelectedCat] = useState<{ prefix: string; serviceName: string } | null>(null);
  const [showRegForm, setShowRegForm] = useState(false);
  
  const [regNama, setRegNama] = useState("");
  const [regIdPel, setRegIdPel] = useState("");
  const [regAlamat, setRegAlamat] = useState("");
  const [regHp, setRegHp] = useState("");
  const [regKeterangan, setRegKeterangan] = useState("");

  // Group active categories by prefix to avoid duplicates on kiosk
  const activeCategories = (loketList || [])
    .filter((l) => l.isActive)
    .reduce((acc, current) => {
      if (!acc.some((item) => item.prefix === current.prefix)) {
        acc.push({
          prefix: current.prefix,
          serviceName: current.serviceName,
          name: current.name,
        });
      }
      return acc;
    }, [] as { prefix: string; serviceName: string; name: string }[]);

  // Intercept category button click to show registration input modal first
  const handlePrint = (prefix: string, serviceName: string) => {
    setSelectedCat({ prefix, serviceName });
    setShowRegForm(true);
  };

  // Perform actual ticket printing simulation
  const executePrint = (includeData: boolean) => {
    if (!selectedCat || printingStatus === "printing") return;

    const prefix = selectedCat.prefix;
    const serviceName = selectedCat.serviceName;

    // Reset registration active view
    setShowRegForm(false);
    setPrintingStatus("printing");

    const customerData = includeData ? {
      pelangganNama: regNama.trim(),
      pelangganId: regIdPel.trim(),
      pelangganAlamat: regAlamat.trim(),
      pelangganHp: regHp.trim(),
      pelangganKeterangan: regKeterangan.trim(),
    } : undefined;
    
    // Simulate mechanical delay of thermal ticket spitting out
    setTimeout(() => {
      const newTicket = onAddQueue(prefix, serviceName, customerData);
      setJustPrintedTicket(newTicket);
      setPrintingStatus("success");

      // Auto-trigger the physical thermal paper print via the web-printing utility!
      try {
        printThermalReceipt(newTicket, safeSettings);
      } catch (err) {
        console.error("Physical print setup failed:", err);
      }

      // Reset form variables on print
      setRegNama("");
      setRegIdPel("");
      setRegAlamat("");
      setRegHp("");
      setRegKeterangan("");
      setSelectedCat(null);
      
      // Auto-reset state
      setTimeout(() => {
        setPrintingStatus("idle");
      }, 5000);
    }, 1200);
  };

  const getFomattedDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      const dateStr = d.toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const timeStr = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
      return `${dateStr} ${timeStr} WIB`;
    } catch {
      return "";
    }
  };

  const getStyleObj = (styleVal: string | undefined, defaultStyle: string) => {
    const style = styleVal || defaultStyle;
    const styleObj: React.CSSProperties = {};
    if (style === "bold") {
      styleObj.fontWeight = "bold";
      styleObj.fontStyle = "normal";
    } else if (style === "italic") {
      styleObj.fontWeight = "normal";
      styleObj.fontStyle = "italic";
    } else if (style === "bold-italic") {
      styleObj.fontWeight = "bold";
      styleObj.fontStyle = "italic";
    } else {
      styleObj.fontWeight = "normal";
      styleObj.fontStyle = "normal";
    }
    return styleObj;
  };

  const getHeaderSizeStyle = (sizeVal: string | undefined) => {
    const size = sizeVal || "10";
    if (size === "normal") return { fontSize: "9.5px" };
    if (size === "large") return { fontSize: "11px" };
    if (size === "xlarge") return { fontSize: "13px" };
    const num = parseFloat(size);
    if (!isNaN(num)) return { fontSize: `${num}px` };
    return { fontSize: "10px" };
  };

  const getSubHeaderSizeStyle = (sizeVal: string | undefined) => {
    const size = sizeVal || "8.5";
    if (size === "normal") return { fontSize: "7.5px" };
    if (size === "large") return { fontSize: "9px" };
    const num = parseFloat(size);
    if (!isNaN(num)) return { fontSize: `${num}px` };
    return { fontSize: "8.5px" };
  };

  const getFooterSizeStyle = (sizeVal: string | undefined) => {
    const size = sizeVal || "9";
    if (size === "normal") return { fontSize: "7.5px" };
    if (size === "large") return { fontSize: "9.5px" };
    const num = parseFloat(size);
    if (!isNaN(num)) return { fontSize: `${num}px` };
    return { fontSize: "9px" };
  };

  const getDateTimeSizeStyle = (sizeVal: string | undefined) => {
    const size = sizeVal || "8.5";
    if (size === "normal") return { fontSize: "7.5px" };
    if (size === "large") return { fontSize: "9.5px" };
    const num = parseFloat(size);
    if (!isNaN(num)) return { fontSize: `${num}px` };
    return { fontSize: "8.5px" };
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6" id="ticket-printer-dashboard">
      
      {/* Left: Interactive Kiosk Screen (Layar Sentuh Mesin Tiket) */}
      <div className="md:col-span-7 bg-slate-900 rounded-3xl border border-slate-800 p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden text-white min-h-[480px]">
        {/* Ambient details */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-sky-500/5 rounded-full blur-3xl pointer-events-none"></div>

        {/* Top Header */}
        <div className="border-b border-slate-800 pb-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#00A19D] rounded-xl flex items-center justify-center font-black text-white shadow-lg shadow-teal-500/20">
              <Bolt className="w-5 h-5 text-amber-300 fill-amber-300 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-black tracking-wider uppercase">{safeSettings.headerText}</h2>
              <p className="text-[10px] text-slate-400 font-medium">{safeSettings.subHeader}</p>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-teal-950 border border-teal-850 text-[#00A19D] text-[9px] font-bold rounded-full uppercase tracking-widest animate-pulse">
            Sistem Kiosk Aktif
          </span>
        </div>

        {/* Categories Grid or Registration Form */}
        {!showRegForm ? (
          <div className="my-8 text-center space-y-6">
            <h3 className="text-base font-black uppercase tracking-wider text-slate-300">
              Silakan Pilih Layanan untuk Mengambil Nomor Antrean
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto">
              {activeCategories.map((cat, idx) => {
                const colorSchemes = [
                  { text: "text-sky-450", bg: "bg-sky-950", border: "border-sky-850", font: "text-sky-100" },
                  { text: "text-emerald-450", bg: "bg-emerald-950", border: "border-emerald-850", font: "text-emerald-100" },
                  { text: "text-purple-450", bg: "bg-purple-950", border: "border-purple-850", font: "text-purple-100" },
                  { text: "text-amber-450", bg: "bg-amber-950", border: "border-amber-850", font: "text-amber-100" },
                  { text: "text-pink-450", bg: "bg-pink-950", border: "border-pink-850", font: "text-pink-100" },
                ];
                const scheme = colorSchemes[idx % colorSchemes.length];

                return (
                  <button
                    key={cat.prefix}
                    onClick={() => handlePrint(cat.prefix, cat.serviceName)}
                    disabled={printingStatus === "printing"}
                    className="group p-6 bg-slate-950/80 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 active:scale-95 text-left rounded-2xl transition-all cursor-pointer relative shadow-lg"
                    id={`kiosk-btn-cat-${cat.prefix.toLowerCase()}`}
                  >
                    <span className="absolute top-3 right-3 text-3xl font-black text-slate-850 group-hover:text-slate-800 select-none">
                      {cat.prefix}
                    </span>
                    <span className={`w-8 h-8 rounded-lg ${scheme.bg} ${scheme.border} flex items-center justify-center ${scheme.text} text-xs font-bold font-mono`}>
                      {cat.prefix}
                    </span>
                    <h4 className={`text-sm font-extrabold mt-4 uppercase ${scheme.font} group-hover:text-white truncate`}>
                      {cat.serviceName}
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                      Ambil antrean {cat.prefix} untuk loket {cat.serviceName}.
                    </p>
                  </button>
                );
              })}

              {activeCategories.length === 0 && (
                <div className="col-span-full border border-dashed border-slate-800 p-8 rounded-2xl text-center text-slate-500 text-xs">
                  Tidak ada jenis kategori pelayanan aktif di sistem.
                </div>
              )}
            </div>
            
            {/* Instruction Footer footer text in screen */}
            <div className="border-t border-slate-800/80 pt-4 text-center">
              <p className="text-[10px] text-slate-500 font-medium leading-relaxed max-w-sm mx-auto">
                Tekan salah satu tombol di atas. Anda akan diberikan form opsional pengisian data identitas sebelum cetak.
              </p>
            </div>
          </div>
        ) : (
          <div className="my-4 bg-slate-950/90 p-5 rounded-2xl border border-slate-800 space-y-4 max-w-lg mx-auto text-left relative animate-in fade-in zoom-in duration-350">
            <button 
              onClick={() => setShowRegForm(false)}
              className="absolute top-3 right-3 text-slate-500 hover:text-slate-200 transition-colors w-7 h-7 flex items-center justify-center bg-slate-900 rounded-full cursor-pointer"
              title="Kembali"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-[#00A19D] text-white text-[9px] font-black rounded font-mono uppercase tracking-wider">
                LAYANAN {selectedCat?.prefix}
              </span>
              <h4 className="text-[11px] font-extrabold uppercase text-slate-300 tracking-wider truncate max-w-[240px]">
                {selectedCat?.serviceName}
              </h4>
            </div>

            <div className="border-b border-slate-900 pb-2">
              <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                Silahkan isi data diri Anda (opsional) untuk mempermudah pelayanan di loket, atau klik <strong>Cetak Instan</strong> jika ingin langsung.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Nama */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wide">
                  <User className="w-3 text-teal-400" /> Nama Pelanggan
                </label>
                <input 
                  type="text"
                  placeholder="Contoh: Budi Susanto"
                  value={regNama}
                  onChange={(e) => setRegNama(e.target.value)}
                  className="w-full bg-slate-900 focus:bg-slate-850 border border-slate-800 focus:border-[#00A19D] rounded-lg px-3 py-1.5 text-white outline-none font-medium text-[11px] transition-all"
                />
              </div>

              {/* ID Pelanggan */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wide">
                  <Bolt className="w-3 text-amber-400" /> ID Pelanggan (12 Digit)
                </label>
                <input 
                  type="text"
                  maxLength={12}
                  placeholder="Contoh: 531234567890"
                  value={regIdPel}
                  onChange={(e) => setRegIdPel(e.target.value.replace(/\D/g, ""))}
                  className="w-full bg-slate-900 focus:bg-slate-850 border border-slate-800 focus:border-[#00A19D] rounded-lg px-3 py-1.5 text-white outline-none font-mono text-[11px] transition-all"
                />
              </div>

              {/* No HP */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wide">
                  <Phone className="w-3 text-sky-400" /> No HP / WhatsApp
                </label>
                <input 
                  type="tel"
                  placeholder="Contoh: 081234567890"
                  value={regHp}
                  onChange={(e) => setRegHp(e.target.value)}
                  className="w-full bg-slate-900 focus:bg-slate-850 border border-slate-800 focus:border-[#00A19D] rounded-lg px-3 py-1.5 text-white outline-none font-mono text-[11px] transition-all"
                />
              </div>

              {/* Keterangan */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wide">
                  <ClipboardList className="w-3 text-purple-400" /> Keterangan / Keperluan
                </label>
                <input 
                  type="text"
                  placeholder="Contoh: Meter Pasca Bayar Rusak"
                  value={regKeterangan}
                  onChange={(e) => setRegKeterangan(e.target.value)}
                  className="w-full bg-slate-900 focus:bg-slate-850 border border-slate-800 focus:border-[#00A19D] rounded-lg px-3 py-1.5 text-white outline-none font-medium text-[11px] transition-all"
                />
              </div>

              {/* Alamat */}
              <div className="sm:col-span-full space-y-1">
                <label className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wide">
                  <MapPin className="w-3 text-rose-400" /> Alamat Lengkap
                </label>
                <textarea 
                  rows={2}
                  placeholder="Alamat pelanggan atau lokasi meter"
                  value={regAlamat}
                  onChange={(e) => setRegAlamat(e.target.value)}
                  className="w-full bg-slate-900 focus:bg-slate-850 border border-slate-800 focus:border-[#00A19D] rounded-lg px-3 py-1.5 text-white outline-none font-medium text-[11px] transition-all resize-none"
                />
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2 text-[11px]">
              <button
                onClick={() => executePrint(true)}
                className="flex-1 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-extrabold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-md shadow-emerald-950 cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Cetak Dengan Data
              </button>
              
              <button
                onClick={() => executePrint(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1 active:scale-95 transition-all border border-slate-700 cursor-pointer"
              >
                Cetak Instan
              </button>
              
              <button
                onClick={() => setShowRegForm(false)}
                className="bg-slate-900 hover:bg-slate-950 text-slate-400 hover:text-slate-200 font-medium py-2 px-2.5 rounded-xl border border-transparent active:scale-95 transition-all cursor-pointer"
              >
                Kembali
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Right: Thermal Paper Simulator Output (Struk Cetak Stretched out design) */}
      <div className="md:col-span-5 flex flex-col items-center justify-start gap-4">
        <h3 className="text-xs uppercase font-extrabold tracking-widest text-slate-400">
          Visualisasi Struk Thermal Simulator
        </h3>

        {/* Printing status info cards */}
        {printingStatus === "printing" ? (
          <div className="w-full bg-sky-50 border border-sky-150 p-4 rounded-2xl flex items-center gap-3 animate-pulse text-sky-800 text-xs font-bold">
            <RefreshCw className="w-4 h-4 shrink-0 animate-spin" />
            <span>Sedang mencetak struk antrean... mohon tunggu...</span>
          </div>
        ) : printingStatus === "success" && justPrintedTicket ? (
          <div className="w-full bg-emerald-50 border border-emerald-150 p-4 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs font-bold">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>Struk thermal {justPrintedTicket.formattedNumber} berhasil dicetak!</span>
          </div>
        ) : (
          <div className="w-full bg-slate-50 border border-slate-150 p-4 rounded-2xl flex items-center gap-3 text-slate-500 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-slate-400" />
            <span>Kios antrean siap mengambil nomor baru.</span>
          </div>
        )}

        {/* Physical Paper Struk Rendering */}
        <div 
          className="bg-white border-2 border-slate-300 shadow-xl rounded-b-xl relative overflow-hidden transition-all duration-300 p-6 flex flex-col items-center justify-between text-slate-800 select-none text-center font-mono"
          style={{
            width: safeSettings.paperWidth === "80mm" ? "320px" : "260px",
            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1), inset 0 3px 0 0 rgba(14, 165, 233, 1)",
            transform: printingStatus === "printing" ? "translateY(15px)" : "translateY(0)"
          }}
          id="physical-thermal-paper"
        >
          {/* Jagged tear marks simulation top border */}
          <div className="absolute top-0 left-0 right-0 h-1.5 flex gap-1 justify-center overflow-hidden">
            {Array.from({ length: 15 }).map((_, i) => (
              <div key={i} className="w-4 h-4 shrink-0 bg-slate-100 rotate-45 transform -translate-y-2"></div>
            ))}
          </div>

          {/* Struk Content */}
          <div className="w-full space-y-4 pt-2">
            
            {/* Header info */}
            {(() => {
              const logoPos = safeSettings.logoPosition || (safeSettings.showLogo ? "top" : "none");
              return (
                <div className={`w-full flex ${logoPos === 'side' ? 'flex-row items-center justify-start text-left gap-3' : 'flex-col items-center justify-center text-center gap-2'}`}>
                  {logoPos !== "none" && (
                    safeSettings.logoType === "custom" && safeSettings.customLogo ? (
                      <div className="shrink-0 w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded p-0.5">
                        <img src={safeSettings.customLogo} alt="Logo" className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
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
                    <h4 
                      className="text-slate-900 uppercase tracking-wider leading-tight"
                      style={{ ...getHeaderSizeStyle(safeSettings.headerSize), ...getStyleObj(safeSettings.headerStyle, "bold") }}
                    >
                      {safeSettings.headerText || "PLN ULP MANTINGAN"}
                    </h4>
                    <p 
                      className="text-slate-500 mt-1 leading-snug font-sans"
                      style={{ ...getSubHeaderSizeStyle(safeSettings.subHeaderSize), ...getStyleObj(safeSettings.subHeaderStyle, "bold") }}
                    >
                      {safeSettings.subHeader || "Jl. Raya Mantingan, Ngawi, Jawa Timur"}
                    </p>
                  </div>
                </div>
              );
            })()}

            <div className="border-t border-dashed border-slate-300 w-full"></div>

            {/* Ticket Info */}
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">
                Nomor Antrean Anda
              </span>
              <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight leading-none py-1">
                {(() => {
                  const numStr = justPrintedTicket ? justPrintedTicket.formattedNumber : (lastCreatedQueue ? lastCreatedQueue.formattedNumber : "A14");
                  return numStr || "";
                })()}
              </h2>
              
              <div className="py-1 mt-1 font-extrabold text-slate-800 uppercase tracking-wider w-full text-center" style={{ fontSize: "8px" }}>
                {justPrintedTicket ? justPrintedTicket.serviceName : (lastCreatedQueue ? lastCreatedQueue.serviceName : "PELAYANAN PELANGGAN")}
              </div>

            </div>

            <div className="border-t border-dashed border-slate-300 w-full"></div>

            <div 
              className="text-slate-500 font-bold"
              style={{ ...getDateTimeSizeStyle(safeSettings.dateTimeSize), ...getStyleObj(safeSettings.dateTimeStyle, "normal") }}
            >
              {getFomattedDate(justPrintedTicket ? justPrintedTicket.createdAt : (lastCreatedQueue ? lastCreatedQueue.createdAt : new Date().toISOString()))}
            </div>

            {/* Custom footer info */}
            <p 
              className="text-slate-500 leading-normal max-w-[210px] mx-auto"
              style={{ ...getFooterSizeStyle(safeSettings.footerSize), ...getStyleObj(safeSettings.footerStyle, "italic") }}
            >
              "{safeSettings.footerText || "Terima kasih atas kunjungan anda."}"
            </p>

          </div>

        </div>

        {/* Manual Print / Reprint Button */}
        <button
          onClick={() => {
            const ticketToPrint = justPrintedTicket || lastCreatedQueue;
            if (ticketToPrint) {
              printThermalReceipt(ticketToPrint, safeSettings);
            } else {
              alert("Belum ada antrean baru yang dicetak untuk dicetak ulang.");
            }
          }}
          className="py-2 bg-slate-105 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all border border-slate-200 flex items-center justify-center gap-1.5 cursor-pointer mt-2"
          style={{ width: safeSettings.paperWidth === "80mm" ? "320px" : "260px" }}
          id="btn-kiosk-reprint"
        >
          <Printer className="w-3.5 h-3.5 text-[#00A19D]" />
          Cetak Ulang Tiket Fisik
        </button>

      </div>

    </div>
  );
}
