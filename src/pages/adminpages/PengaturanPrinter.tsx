import React, { useState } from "react";
import { PrintSettings, QueueItem } from "../../types";
import { Printer, Type, Layout, Upload, Image as ImageIcon, Trash2 } from "lucide-react";
import { printThermalReceipt } from "../../utils/printReceipt";

interface PengaturanPrinterProps {
  printSettings: PrintSettings;
  onUpdatePrintSettings: (settings: PrintSettings) => void;
}

export default function PengaturanPrinter({
  printSettings,
  onUpdatePrintSettings,
}: PengaturanPrinterProps) {
  const [headerText, setHeaderText] = useState(printSettings.headerText || "");
  const [subHeader, setSubHeader] = useState(printSettings.subHeader || "");
  const [footerText, setFooterText] = useState(printSettings.footerText || "");
  const [paperWidth, setPaperWidth] = useState(printSettings.paperWidth || "58mm");
  const [logoType, setLogoType] = useState<"default" | "custom">(printSettings.logoType || "default");
  const [customLogo, setCustomLogo] = useState<string>(printSettings.customLogo || "");
  
  // Custom logoPosition state with default fallbacks
  const [logoPosition, setLogoPosition] = useState<"top" | "side" | "none">(
    printSettings.logoPosition || (printSettings.showLogo === false ? "none" : "top")
  );

  // States for text formatting configurations
  const [headerSize, setHeaderSize] = useState<string>(printSettings.headerSize || "10");
  const [headerStyle, setHeaderStyle] = useState<"normal" | "bold" | "italic" | "bold-italic">(printSettings.headerStyle || "bold");
  
  const [subHeaderSize, setSubHeaderSize] = useState<string>(printSettings.subHeaderSize || "8.5");
  const [subHeaderStyle, setSubHeaderStyle] = useState<"normal" | "bold" | "italic" | "bold-italic">(printSettings.subHeaderStyle || "bold");

  const [footerSize, setFooterSize] = useState<string>(printSettings.footerSize || "9");
  const [footerStyle, setFooterStyle] = useState<"normal" | "bold" | "italic" | "bold-italic">(printSettings.footerStyle || "italic");

  const [dateTimeSize, setDateTimeSize] = useState<string>(printSettings.dateTimeSize || "8.5");
  const [dateTimeStyle, setDateTimeStyle] = useState<"normal" | "bold" | "italic" | "bold-italic">(printSettings.dateTimeStyle || "normal");

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        
        const maxW = 180;
        const scale = maxW / img.width;
        const targetW = img.width > maxW ? maxW : img.width;
        const targetH = img.width > maxW ? img.height * scale : img.height;

        canvas.width = targetW;
        canvas.height = targetH;

        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0, targetW, targetH);
          const base64 = canvas.toDataURL("image/png");
          setCustomLogo(base64);
          setLogoType("custom");
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updated: PrintSettings = {
      headerText: headerText.trim(),
      subHeader: subHeader.trim(),
      footerText: footerText.trim(),
      showLogo: logoPosition !== "none",
      paperWidth,
      logoType,
      customLogo,
      logoPosition,
      headerSize,
      headerStyle,
      subHeaderSize,
      subHeaderStyle,
      footerSize,
      footerStyle,
      dateTimeSize,
      dateTimeStyle,
    };

    onUpdatePrintSettings(updated);
    alert("Setelan cetak thermal berhasil diperbarui!");
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
    <div className="bg-white rounded-lg border border-slate-200 p-6 text-left" id="panel-setup-printer">
      
      <div className="border-b pb-4 mb-6 flex justify-between items-center">
        <h3 className="font-bold text-slate-800 text-sm tracking-wide">
          Setelan Cetak Struk Antrian
        </h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left column: Parameters Input Form */}
        <div className="lg:col-span-7">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Paper Width Selection */}
            <div className="pb-4 border-b border-slate-200">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-widest mb-2">
                Format Lebar Struk
              </label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="paperWidth"
                    value="58mm"
                    checked={paperWidth === "58mm"}
                    onChange={(e) => setPaperWidth(e.target.value)}
                    className="accent-[#00A19D]"
                  />
                  Lebar 58 mm (POS Kecil)
                </label>
                
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="paperWidth"
                    value="80mm"
                    checked={paperWidth === "80mm"}
                    onChange={(e) => setPaperWidth(e.target.value)}
                    className="accent-[#00A19D]"
                  />
                  Lebar 80 mm (POS Lebar)
                </label>
              </div>
            </div>

            {/* Corporate Header Text */}
            <div className="space-y-3 pb-5 border-b border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-widest mb-1">
                  Nama Instansi / Header Struk
                </label>
                <input
                  type="text"
                  placeholder="Contoh: PT PLN (PERSERO)"
                  value={headerText}
                  onChange={(e) => setHeaderText(e.target.value)}
                  className="w-full bg-white border border-slate-350 p-2 rounded text-xs font-bold text-slate-800 focus:outline-none focus:border-[#00a19d]"
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Ukuran Font (pt):</label>
                  <div className="flex">
                    <input
                      type="text"
                      value={headerSize}
                      onChange={(e) => setHeaderSize(e.target.value)}
                      className="block w-20 border border-slate-350 rounded-l p-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-[#00a19d]"
                      placeholder="Contoh: 10"
                    />
                    <select
                      value={["8", "9", "9.5", "10", "11", "12", "13", "14", "16", "18", "20", "22", "24", "26", "28", "36", "48", "72"].includes(headerSize) ? headerSize : ""}
                      onChange={(e) => {
                        if (e.target.value) setHeaderSize(e.target.value);
                      }}
                      className="block border-y border-r border-slate-350 rounded-r p-1.5 text-xs text-slate-705 font-medium bg-slate-55 cursor-pointer focus:outline-none focus:border-[#00a19d]"
                    >
                      <option value="">Pilih...</option>
                      <option value="8">8 pt</option>
                      <option value="9">9 pt</option>
                      <option value="9.5">9.5 pt</option>
                      <option value="10">10 pt</option>
                      <option value="11">11 pt</option>
                      <option value="12">12 pt</option>
                      <option value="13">13 pt</option>
                      <option value="14">14 pt</option>
                      <option value="16">16 pt</option>
                      <option value="18">18 pt</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Gaya Font:</label>
                  <select
                    value={headerStyle}
                    onChange={(e) => setHeaderStyle(e.target.value as any)}
                    className="block w-full border border-slate-350 rounded p-1.5 text-xs text-slate-705 font-medium bg-white cursor-pointer focus:outline-none focus:border-[#00a19d]"
                  >
                    <option value="normal">Normal</option>
                    <option value="bold">Tebal (Bold)</option>
                    <option value="italic">Miring (Italic)</option>
                    <option value="bold-italic">Tebal Miring</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Locality Subheader */}
            <div className="space-y-3 pb-5 border-b border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-widest mb-1">
                  Subtitel Alamat / Lokasi Kantor
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Jl. Raya Mantingan, Ngawi, Jawa Timur"
                  value={subHeader}
                  onChange={(e) => setSubHeader(e.target.value)}
                  className="w-full bg-white border border-slate-350 p-2 rounded text-xs text-slate-800 focus:outline-none focus:border-[#00a19d]"
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Ukuran Font (pt):</label>
                  <div className="flex">
                    <input
                      type="text"
                      value={subHeaderSize}
                      onChange={(e) => setSubHeaderSize(e.target.value)}
                      className="block w-20 border border-slate-350 rounded-l p-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-[#00a19d]"
                      placeholder="Contoh: 8.5"
                    />
                    <select
                      value={["7", "7.5", "8", "8.5", "9", "9.5", "10", "11", "12", "14", "16"].includes(subHeaderSize) ? subHeaderSize : ""}
                      onChange={(e) => {
                        if (e.target.value) setSubHeaderSize(e.target.value);
                      }}
                      className="block border-y border-r border-slate-350 rounded-r p-1.5 text-xs text-slate-705 font-medium bg-slate-55 cursor-pointer focus:outline-none focus:border-[#00a19d]"
                    >
                      <option value="">Pilih...</option>
                      <option value="7">7 pt</option>
                      <option value="7.5">7.5 pt</option>
                      <option value="8">8 pt</option>
                      <option value="8.5">8.5 pt</option>
                      <option value="9">9 pt</option>
                      <option value="9.5">9.5 pt</option>
                      <option value="10">10 pt</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Gaya Font:</label>
                  <select
                    value={subHeaderStyle}
                    onChange={(e) => setSubHeaderStyle(e.target.value as any)}
                    className="block w-full border border-slate-350 rounded p-1.5 text-xs text-slate-705 font-medium bg-white cursor-pointer focus:outline-none focus:border-[#00a19d]"
                  >
                    <option value="normal">Normal</option>
                    <option value="bold">Tebal (Bold)</option>
                    <option value="italic">Miring (Italic)</option>
                    <option value="bold-italic">Tebal Miring</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Bottom Greetings Message footer */}
            <div className="space-y-3 pb-5 border-b border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-widest mb-1">
                  Pesan Kaki Struk (Footer)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Terima kasih atas kunjungan anda."
                  value={footerText}
                  onChange={(e) => setFooterText(e.target.value)}
                  className="w-full bg-white border border-slate-350 p-2 rounded text-xs text-slate-800 focus:outline-none focus:border-[#00a19d]"
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Ukuran Font (pt):</label>
                  <div className="flex">
                    <input
                      type="text"
                      value={footerSize}
                      onChange={(e) => setFooterSize(e.target.value)}
                      className="block w-20 border border-slate-350 rounded-l p-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-[#00a19d]"
                      placeholder="Contoh: 9"
                    />
                    <select
                      value={["7", "7.5", "8", "8.5", "9", "9.5", "10", "12", "14"].includes(footerSize) ? footerSize : ""}
                      onChange={(e) => {
                        if (e.target.value) setFooterSize(e.target.value);
                      }}
                      className="block border-y border-r border-slate-350 rounded-r p-1.5 text-xs text-slate-705 font-medium bg-slate-55 cursor-pointer focus:outline-none focus:border-[#00a19d]"
                    >
                      <option value="">Pilih...</option>
                      <option value="7">7 pt</option>
                      <option value="7.5">7.5 pt</option>
                      <option value="8">8 pt</option>
                      <option value="8.5">8.5 pt</option>
                      <option value="9">9 pt</option>
                      <option value="9.5">9.5 pt</option>
                      <option value="10">10 pt</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Gaya Font:</label>
                  <select
                    value={footerStyle}
                    onChange={(e) => setFooterStyle(e.target.value as any)}
                    className="block w-full border border-slate-350 rounded p-1.5 text-xs text-slate-705 font-medium bg-white cursor-pointer focus:outline-none focus:border-[#00a19d]"
                  >
                    <option value="normal">Normal</option>
                    <option value="bold">Tebal (Bold)</option>
                    <option value="italic">Miring (Italic)</option>
                    <option value="bold-italic">Tebal Miring</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Date and Time Settings */}
            <div className="space-y-3 pb-5 border-b border-slate-200">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-widest mb-1">
                Format Tanggal & Waktu (Tanggal-Pukul)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Ukuran Font (pt):</label>
                  <div className="flex">
                    <input
                      type="text"
                      value={dateTimeSize}
                      onChange={(e) => setDateTimeSize(e.target.value)}
                      className="block w-20 border border-slate-350 rounded-l p-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-[#00a19d]"
                      placeholder="Contoh: 8.5"
                    />
                    <select
                      value={["7", "7.5", "8", "8.5", "9", "9.5", "10"].includes(dateTimeSize) ? dateTimeSize : ""}
                      onChange={(e) => {
                        if (e.target.value) setDateTimeSize(e.target.value);
                      }}
                      className="block border-y border-r border-slate-350 rounded-r p-1.5 text-xs text-slate-705 font-medium bg-slate-55 cursor-pointer focus:outline-none focus:border-[#00a19d]"
                    >
                      <option value="">Pilih...</option>
                      <option value="7">7 pt</option>
                      <option value="7.5">7.5 pt</option>
                      <option value="8">8 pt</option>
                      <option value="8.5">8.5 pt</option>
                      <option value="9">9 pt</option>
                      <option value="9.5">9.5 pt</option>
                      <option value="10">10 pt</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Gaya Font:</label>
                  <select
                    value={dateTimeStyle}
                    onChange={(e) => setDateTimeStyle(e.target.value as any)}
                    className="block w-full border border-slate-350 rounded p-1.5 text-xs text-slate-705 font-medium bg-white cursor-pointer focus:outline-none focus:border-[#00a19d]"
                  >
                    <option value="normal">Normal</option>
                    <option value="bold">Tebal (Bold)</option>
                    <option value="italic">Miring (Italic)</option>
                    <option value="bold-italic">Tebal Miring</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Logo Options Layout Selector */}
            <div className="space-y-4 pb-5">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-widest">
                Logo Instansi
              </label>
              
              <div className="grid grid-cols-3 gap-2 border border-slate-300 rounded p-1 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setLogoPosition("none")}
                  className={`p-2.5 text-center text-xs font-semibold rounded cursor-pointer transition-all ${
                    logoPosition === "none"
                      ? "bg-[#00A19D] text-white font-bold"
                      : "bg-transparent text-slate-600 hover:bg-slate-205"
                  }`}
                >
                  Tanpa Logo
                </button>
                
                <button
                  type="button"
                  onClick={() => setLogoPosition("top")}
                  className={`p-2.5 text-center text-xs font-semibold rounded cursor-pointer transition-all ${
                    logoPosition === "top"
                      ? "bg-[#00A19D] text-white font-bold"
                      : "bg-transparent text-slate-600 hover:bg-slate-205"
                  }`}
                >
                  Di Atas Teks
                </button>
                
                <button
                  type="button"
                  onClick={() => setLogoPosition("side")}
                  className={`p-2.5 text-center text-xs font-semibold rounded cursor-pointer transition-all ${
                    logoPosition === "side"
                      ? "bg-[#00A19D] text-white font-bold"
                      : "bg-transparent text-slate-600 hover:bg-slate-205"
                  }`}
                >
                  Di Samping Teks
                </button>
              </div>

              {logoPosition !== "none" && (
                <div className="pt-3 space-y-3 border-t border-slate-200">
                  <div className="flex gap-4">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="logoChoice"
                        checked={logoType === "default"}
                        onChange={() => setLogoType("default")}
                        className="accent-[#00A19D]"
                      />
                      Logo Sistem (PLN)
                    </label>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="logoChoice"
                        checked={logoType === "custom"}
                        onChange={() => setLogoType("custom")}
                        className="accent-[#00A19D]"
                      />
                      Gunakan Logo Kustom
                    </label>
                  </div>

                  {logoType === "custom" && (
                    <div className="space-y-2 mt-2">
                      <span className="text-[11px] font-semibold text-slate-600 block">Pilih File Logo:</span>
                      <div className="flex items-center gap-4 bg-slate-50 p-3 rounded border border-slate-300">
                        <div className="shrink-0 w-12 h-12 bg-white border border-slate-200 rounded overflow-hidden flex items-center justify-center">
                          {customLogo ? (
                            <img src={customLogo} alt="Logo preview" className="w-full h-full object-contain p-1" referrerPolicy="no-referrer" />
                          ) : (
                            <ImageIcon className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        
                        <div className="flex-1 space-y-1 text-left">
                          <div className="flex items-center gap-2">
                            <label className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs rounded cursor-pointer transition-all flex items-center gap-1">
                              <Upload className="w-3.5 h-3.5 text-slate-500" />
                              Pilih File Logo
                              <input
                                type="file"
                                accept="image/png, image/jpeg, image/jpg"
                                onChange={handleLogoUpload}
                                className="hidden"
                              />
                            </label>
                            {customLogo && (
                              <button
                                type="button"
                                onClick={() => {
                                  setCustomLogo("");
                                  setLogoType("default");
                                }}
                                className="p-1 px-2.5 bg-white hover:bg-red-50 text-red-600 border border-slate-300 hover:border-red-300 rounded transition-all text-xs font-semibold"
                              >
                                Atur Ulang
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Form actions Buttons */}
            <div className="border-t pt-5 flex justify-between items-center gap-4">
              <button
                type="button"
                onClick={() => {
                  const testSettings: PrintSettings = {
                    headerText: headerText.trim() || "PT PLN (PERSERO)",
                    subHeader: subHeader.trim() || "ULP MANTINGAN",
                    footerText: footerText.trim() || "Terima kasih atas kunjungan Anda.",
                    showLogo: logoPosition !== "none",
                    paperWidth,
                    logoType,
                    customLogo,
                    logoPosition,
                    headerSize,
                    headerStyle,
                    subHeaderSize,
                    subHeaderStyle,
                    footerSize,
                    footerStyle,
                    dateTimeSize,
                    dateTimeStyle,
                  };
                  const mockQueue: QueueItem = {
                    id: "test-print-id",
                    number: 14,
                    formattedNumber: "A14",
                    serviceName: "PELAYANAN PELANGGAN",
                    prefix: "A",
                    status: "waiting",
                    createdAt: new Date().toISOString(),
                    pelangganNama: "ARIEF PRANATA (TEST)",
                    pelangganId: "538579236059",
                    pelangganHp: "081234567890",
                    pelangganAlamat: "Kantor PLN ULP Mantingan, Ngawi",
                    pelangganKeterangan: "Uji Coba Cetak Struk Kertas POS Thermal",
                  };
                  printThermalReceipt(mockQueue, testSettings);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider rounded transition-all border border-slate-300 flex items-center justify-center gap-1.5 cursor-pointer"
                title="Sistem akan menguji hasil cetakan langsung pada printer thermal"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                Test Cetak Struk
              </button>

              <button
                type="submit"
                className="px-5 py-2 bg-[#00A19D] hover:bg-teal-700 text-white font-bold text-xs uppercase tracking-wider rounded transition-all shadow-sm cursor-pointer"
              >
                Simpan Setelan Struk
              </button>
            </div>

          </form>
        </div>

        {/* Right column: LIVE REALTIME RECEIPT PREVIEW (lg:col-span-5) */}
        <div className="lg:col-span-5 flex flex-col items-center bg-slate-50 p-6 rounded-2xl border border-slate-200/80">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">
            Live Preview Struk Kiosk
          </span>
          
          {/* Simulated Physical Thermal Ticket Container */}
          <div 
            className="bg-white border-2 border-slate-300 shadow-md relative overflow-hidden transition-all duration-300 p-5 flex flex-col items-center text-slate-900 select-none text-center border-t-[#00A19D] border-t-4"
            style={{
              width: paperWidth === "80mm" ? "290px" : "240px",
              fontFamily: "'Arial', 'Helvetica', 'sans-serif', 'system-ui'",
            }}
            id="admin-receipt-live-preview"
          >
            {/* Top wavy jagged marks simulation */}
            <div className="absolute top-0 left-0 right-0 h-1 flex gap-1 justify-center overflow-hidden">
              {Array.from({ length: 15 }).map((_, i) => (
                <div key={i} className="w-3 h-3 bg-slate-100 rotate-45 transform -translate-y-1.5 shrink-0"></div>
              ))}
            </div>

            {/* Header section based on logoPosition */}
            <div className={`w-full flex ${logoPosition === "side" ? "flex-row items-center justify-start text-left gap-3" : "flex-col items-center justify-center text-center gap-2"} mt-2`}>
              {logoPosition !== "none" && (
                logoType === "custom" && customLogo ? (
                  <div className="shrink-0 w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded p-0.5">
                    <img src={customLogo} alt="Logo" className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
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
              
              <div className={`flex-1 min-w-0 ${logoPosition === "side" ? "text-left" : "text-center"}`}>
                <h4 
                  className="text-slate-900 uppercase tracking-wide leading-tight"
                  style={{ ...getHeaderSizeStyle(headerSize), ...getStyleObj(headerStyle, "bold") }}
                >
                  {headerText.trim() || "PT PLN (PERSERO)"}
                </h4>
                <p 
                  className="text-slate-500 mt-1 leading-snug"
                  style={{ ...getSubHeaderSizeStyle(subHeaderSize), ...getStyleObj(subHeaderStyle, "bold") }}
                >
                  {subHeader.trim() || "Jl. Raya Mantingan, Ngawi, Jawa Timur"}
                </p>
              </div>
            </div>

            {/* Split dashed divider line */}
            <div className="border-t border-dashed border-slate-350 w-full my-4"></div>

            {/* Body contents */}
            <div className="w-full space-y-3.5">
              <span className="text-[8.5px] text-slate-400 font-extrabold uppercase tracking-widest block">
                NOMOR ANTREAN ANDA
              </span>
              
              {/* LARGE QUEUE NUMBER - DIRECT (NO SPACES!) - e.g. A14 */}
              <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight leading-none py-1">
                A14
              </h2>

              {/* SERVICE NAME DISPLAY - CLEAN TEXT WITHOUT BACKGROUND PILLS (As requested!) */}
              <div className="py-1 pt-1.5 font-extrabold text-[#000] uppercase tracking-wider" style={{ fontSize: "8px" }}>
                PELAYANAN PELANGGAN
              </div>

              <div className="border-t border-dashed border-slate-350 w-full pt-1"></div>

              {/* Date & clock */}
              <div 
                className="text-slate-500 font-bold"
                style={{ ...getDateTimeSizeStyle(dateTimeSize), ...getStyleObj(dateTimeStyle, "normal") }}
              >
                {(() => {
                  const d = new Date();
                  const dateStr = d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
                  const timeStr = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
                  return `${dateStr} ${timeStr} WIB`;
                })()}
              </div>

              {/* FOOTER CUSTOM TEXT */}
              <p 
                className="text-slate-650 px-2 leading-relaxed text-slate-705"
                style={{ ...getFooterSizeStyle(footerSize), ...getStyleObj(footerStyle, "italic") }}
              >
                "{footerText.trim() || "Terima kasih atas kunjungan anda. Jauhi bahaya listrik demi keselamatan keluarga tercinta."}"
              </p>

            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
