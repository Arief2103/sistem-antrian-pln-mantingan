import React, { useState } from 'react';
import { db } from '../../config/supabase';
import { PrinterSettings } from '../../types';
import { Printer, Save, CheckCircle, Info, Building, MapPin, AlignLeft, Smartphone, RefreshCw, Bolt } from 'lucide-react';
import { blePrinterManager } from '../../utils/blePrinter';

interface PengaturanPrinterProps {
  printSettings?: any;
  onUpdatePrintSettings?: (settings: any) => void;
}

export default function PengaturanPrinter({ printSettings, onUpdatePrintSettings }: PengaturanPrinterProps) {
  const [settings, setSettings] = useState<PrinterSettings>(() => db.printerSettings.get());
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Web Bluetooth state
  const [bleConnected, setBleConnected] = useState(() => blePrinterManager.isConnected());
  const [bleDeviceName, setBleDeviceName] = useState(() => blePrinterManager.getDeviceName());
  const [bleError, setBleError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  const handleConnectBLE = async () => {
    try {
      setBleError(null);
      setConnecting(true);
      const name = await blePrinterManager.connect();
      if (name) {
        setBleConnected(true);
        setBleDeviceName(name);
      }
    } catch (err: any) {
      setBleError(err.message || "Gagal menghubungkan Bluetooth. Pastikan bluetooth aktif dan berikan izin.");
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnectBLE = () => {
    blePrinterManager.disconnect();
    setBleConnected(false);
    setBleDeviceName(null);
  };

  const handleTestPrintBLE = async () => {
    try {
      setBleError(null);
      const mockTicket = {
        nomor: "B-12",
        formattedNumber: "B-12",
        layananNama: "TEST PRINT DIRECT",
        serviceName: "TEST PRINT DIRECT",
        created_at: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
      await blePrinterManager.printTicketDirect(mockTicket, settings);
    } catch (err: any) {
      setBleError("Gagal test print: " + err.message);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 1024 * 1024 * 2) {
      alert("Ukuran file gambar minimalis terlalu besar. Maksimal 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setSettings(prev => ({
        ...prev,
        logoType: "custom",
        customLogo: base64
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    db.printerSettings.save(settings);
    setSavedSuccess(true);
    
    if (onUpdatePrintSettings) {
      onUpdatePrintSettings({
        headerText: settings.namaInstansi,
        subHeader: settings.cabang,
        namaInstansi: settings.namaInstansi,
        cabang: settings.cabang,
        alamat: settings.alamat,
        footerSatu: settings.footerSatu,
        footerDua: settings.footerDua,
        footerText: settings.footer || settings.footerSatu,
        showLogo: settings.showLogo !== undefined ? settings.showLogo : true,
        logoType: settings.logoType || "default",
        customLogo: settings.customLogo || "",
        showFooterDua: settings.showFooterDua !== undefined ? settings.showFooterDua : true,
        feedLines: settings.feedLines !== undefined ? Number(settings.feedLines) : 1,
        paperWidth: settings.paperWidth || "58mm",
        useBluetoothPrintApp: false,
        useWebBluetooth: true,
        useRawBtApp: false,
        cetakQr: false,
        
        // Custom sizes
        logoSize: settings.logoSize || 48,
        sizeNamaInstansi: settings.sizeNamaInstansi || 14,
        sizeCabang: settings.sizeCabang || 11,
        sizeAlamat: settings.sizeAlamat || 8,
        sizeFooterSatu: settings.sizeFooterSatu || 8,
        sizeFooterDua: settings.sizeFooterDua || 8,
        sizeDateTime: settings.sizeDateTime || 8,
        sizeTeksNomorAntrian: settings.sizeTeksNomorAntrian || 9,
        sizeNomorAntrian: settings.sizeNomorAntrian || 40,
        sizeLayanan: settings.sizeLayanan || 10,
      });
    }

    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="p-6 space-y-6 max-h-[calc(100vh-64px)] overflow-y-auto font-sans" id="admin-printer-settings">
      {/* Upper header */}
      <div className="border-b border-gray-200 pb-5">
        <h1 className="text-xl font-bold text-gray-800 tracking-tight flex items-center space-x-2">
          <Printer className="w-5 h-5 text-[#005B9C]" />
          <span>Pengaturan Tiket Printer Kiosk</span>
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Atur teks kop surat, info cabang, alamat, catatan kaki, serta atur ukuran font pada slip antrian secara presisi.
        </p>
      </div>

      {savedSuccess && (
        <div className="bg-emerald-50 border border-emerald-500/50 rounded-lg p-3.5 text-xs font-medium text-emerald-800 flex items-center space-x-2 animate-pulse">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Setelan printer berhasil diperbarui dan disimpan!</span>
        </div>
      )}

      {/* Main Settings Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form onSubmit={handleSubmit} className="lg:col-span-8 bg-white border border-gray-250 p-6 rounded-xl shadow-sm space-y-6" id="printer-config-form">
          
          {/* SECTION 1: Informasi Teks Slip Antrian */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-[#005B9C] uppercase tracking-wider pb-1 border-b border-gray-100">
              1. Teks Kop & Kaki Slip (Boleh Huruf Besar & Kecil)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nama Instansi */}
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1.5 flex items-center space-x-1">
                  <Building className="w-3.5 h-3.5 text-gray-450" />
                  <span>Nama Instansi</span>
                </label>
                <input
                  type="text"
                  required
                  value={settings.namaInstansi}
                  onChange={(e) => setSettings({ ...settings, namaInstansi: e.target.value })}
                  placeholder="Contoh: PT PLN (Persero) UP3 Madiun"
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#005B9C]"
                />
              </div>

              {/* Cabang */}
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1.5 flex items-center space-x-1">
                  <Building className="w-3.5 h-3.5 text-gray-450" />
                  <span>Unit Pelaksana / Sub Unit</span>
                </label>
                <input
                  type="text"
                  required
                  value={settings.cabang}
                  onChange={(e) => setSettings({ ...settings, cabang: e.target.value })}
                  placeholder="Contoh: ULP Mantingan"
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#005B9C]"
                />
              </div>
            </div>

            {/* Alamat Unit */}
            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-1.5 flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-gray-450" />
                <span>Alamat Kantor</span>
              </label>
              <input
                type="text"
                required
                value={settings.alamat}
                onChange={(e) => setSettings({ ...settings, alamat: e.target.value })}
                placeholder="Contoh: Jl. Raya Mantingan, Ngawi, Jawa Timur"
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#005B9C]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Footer Satu */}
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1.5 flex items-center space-x-1">
                  <AlignLeft className="w-3.5 h-3.5 text-gray-450" />
                  <span>Catatan Kaki 1</span>
                </label>
                <input
                  type="text"
                  required
                  value={settings.footerSatu}
                  onChange={(e) => setSettings({ ...settings, footerSatu: e.target.value })}
                  placeholder="Contoh: Terima kasih atas kunjungan anda."
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#005B9C]"
                />
              </div>

              {/* Footer Dua */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold text-gray-600 flex items-center space-x-1">
                    <AlignLeft className="w-3.5 h-3.5 text-gray-450" />
                    <span>Catatan Kaki 2</span>
                  </label>
                  <label className="flex items-center space-x-1 text-[10px] text-[#005B9C] font-semibold cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={settings.showFooterDua !== false}
                      onChange={(e) => setSettings({ ...settings, showFooterDua: e.target.checked })}
                      className="w-3.5 h-3.5 accent-[#005B9C] rounded cursor-pointer"
                    />
                    <span>Aktifkan</span>
                  </label>
                </div>
                <input
                  type="text"
                  required={settings.showFooterDua !== false}
                  disabled={settings.showFooterDua === false}
                  value={settings.footerDua}
                  onChange={(e) => setSettings({ ...settings, footerDua: e.target.value })}
                  placeholder="Contoh: Jauhi bahaya listrik demi keselamatan"
                  className={`w-full border rounded-lg px-3 py-2 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#005B9C] ${
                    settings.showFooterDua === false ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white border-gray-300'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: Sizing Controls */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-bold text-[#005B9C] uppercase tracking-wider pb-1 border-b border-gray-100">
              2. Pengaturan Ukuran Teks & Logo PLN
            </h3>

            {/* Show Logo Toggle */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="block text-xs font-bold text-gray-700">Tampilkan Logo Diatas Judul</span>
                  <span className="text-[10px] text-gray-400 block font-normal">Tampilkan gambar logo instansi PLN diposisi paling atas strip tiket.</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.showLogo}
                  onChange={(e) => setSettings({ ...settings, showLogo: e.target.checked })}
                  className="w-4 h-4 border-gray-350 text-[#005B9C] rounded pointer-events-auto accent-[#005B9C] cursor-pointer"
                />
              </div>

              {settings.showLogo && (
                <div className="pt-3 border-t border-gray-200/60 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Tipe Logo</label>
                    <select
                      value={settings.logoType || "default"}
                      onChange={(e) => setSettings({ ...settings, logoType: e.target.value as any })}
                      className="w-full bg-white border border-gray-300 rounded-lg px-2 py-1.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#005B9C]"
                    >
                      <option value="default">Default PLN (⚡)</option>
                      <option value="custom">Upload Logo Kustom (Gambar)</option>
                    </select>
                  </div>

                  {settings.logoType === "custom" && (
                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 mb-1">Pilih File Logo</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="w-full text-xs text-gray-600 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-blue-50 file:text-[#005B9C] hover:file:bg-blue-100 cursor-pointer"
                      />
                      {settings.customLogo && (
                        <div className="flex items-center space-x-2 mt-1.5">
                          <span className="text-[9px] text-emerald-600 font-semibold">✓ Gambar berhasil diunggah</span>
                          <button
                            type="button"
                            onClick={() => setSettings(prev => ({ ...prev, customLogo: "" }))}
                            className="text-[9px] text-rose-600 hover:underline font-medium cursor-pointer"
                          >
                            Hapus
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 bg-gray-50/50 p-4 rounded-xl border border-gray-200">
              {/* Logo Size */}
              {settings.showLogo !== false && (
                <div>
                  <div className="flex justify-between text-[11px] font-bold text-gray-600 mb-1">
                    <span>Ukuran Logo PLN</span>
                    <span className="text-[#005B9C]">{settings.logoSize || 48} px</span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="100"
                    value={settings.logoSize || 48}
                    onChange={(e) => setSettings({ ...settings, logoSize: parseInt(e.target.value) })}
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#005B9C]"
                  />
                </div>
              )}

              {/* Nama Instansi Font Size */}
              <div>
                <div className="flex justify-between text-[11px] font-bold text-gray-600 mb-1">
                  <span>Ukuran Font Nama Instansi</span>
                  <span className="text-[#005B9C]">{settings.sizeNamaInstansi || 14} px</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="32"
                  value={settings.sizeNamaInstansi || 14}
                  onChange={(e) => setSettings({ ...settings, sizeNamaInstansi: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#005B9C]"
                />
              </div>

              {/* Cabang/Subheader Font Size */}
              <div>
                <div className="flex justify-between text-[11px] font-bold text-gray-600 mb-1">
                  <span>Ukuran Font Unit Pelaksana</span>
                  <span className="text-[#005B9C]">{settings.sizeCabang || 11} px</span>
                </div>
                <input
                  type="range"
                  min="8"
                  max="24"
                  value={settings.sizeCabang || 11}
                  onChange={(e) => setSettings({ ...settings, sizeCabang: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#005B9C]"
                />
              </div>

              {/* Alamat Font Size */}
              <div>
                <div className="flex justify-between text-[11px] font-bold text-gray-600 mb-1">
                  <span>Ukuran Font Alamat Slip</span>
                  <span className="text-[#005B9C]">{settings.sizeAlamat || 8} px</span>
                </div>
                <input
                  type="range"
                  min="6"
                  max="20"
                  value={settings.sizeAlamat || 8}
                  onChange={(e) => setSettings({ ...settings, sizeAlamat: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#005B9C]"
                />
              </div>

              {/* Teks No Antrean Font Size */}
              <div>
                <div className="flex justify-between text-[11px] font-bold text-gray-600 mb-1">
                  <span>Ukuran Teks "Nomor Antrian Anda"</span>
                  <span className="text-[#005B9C]">{settings.sizeTeksNomorAntrian || 9} px</span>
                </div>
                <input
                  type="range"
                  min="8"
                  max="20"
                  value={settings.sizeTeksNomorAntrian || 9}
                  onChange={(e) => setSettings({ ...settings, sizeTeksNomorAntrian: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#005B9C]"
                />
              </div>

              {/* Nilai Nomor Antrean Font Size */}
              <div>
                <div className="flex justify-between text-[11px] font-bold text-gray-600 mb-1">
                  <span>Ukuran Font Nomor Antrian (B-12)</span>
                  <span className="text-[#005B9C]">{settings.sizeNomorAntrian || 40} px</span>
                </div>
                <input
                  type="range"
                  min="24"
                  max="64"
                  value={settings.sizeNomorAntrian || 40}
                  onChange={(e) => setSettings({ ...settings, sizeNomorAntrian: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#005B9C]"
                />
              </div>

              {/* Layanan Font Size */}
              <div>
                <div className="flex justify-between text-[11px] font-bold text-gray-600 mb-1">
                  <span>Ukuran Font Nama Layanan</span>
                  <span className="text-[#005B9C]">{settings.sizeLayanan || 10} px</span>
                </div>
                <input
                  type="range"
                  min="8"
                  max="20"
                  value={settings.sizeLayanan || 10}
                  onChange={(e) => setSettings({ ...settings, sizeLayanan: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#005B9C]"
                />
              </div>

              {/* Tanggal & Waktu Font Size */}
              <div>
                <div className="flex justify-between text-[11px] font-bold text-gray-600 mb-1">
                  <span>Ukuran Font Waktu Cetak</span>
                  <span className="text-[#005B9C]">{settings.sizeDateTime || 8} px</span>
                </div>
                <input
                  type="range"
                  min="6"
                  max="18"
                  value={settings.sizeDateTime || 8}
                  onChange={(e) => setSettings({ ...settings, sizeDateTime: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#005B9C]"
                />
              </div>

              {/* Kaki 1 Font Size */}
              <div>
                <div className="flex justify-between text-[11px] font-bold text-gray-600 mb-1">
                  <span>Ukuran Font Kaki 1</span>
                  <span className="text-[#005B9C]">{settings.sizeFooterSatu || 8} px</span>
                </div>
                <input
                  type="range"
                  min="6"
                  max="18"
                  value={settings.sizeFooterSatu || 8}
                  onChange={(e) => setSettings({ ...settings, sizeFooterSatu: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#005B9C]"
                />
              </div>

              {/* Kaki 2 Font Size */}
              <div>
                <div className="flex justify-between text-[11px] font-bold text-gray-600 mb-1">
                  <span>Ukuran Font Kaki 2</span>
                  <span className="text-[#005B9C]">{settings.sizeFooterDua || 8} px</span>
                </div>
                <input
                  type="range"
                  min="6"
                  max="18"
                  value={settings.sizeFooterDua || 8}
                  onChange={(e) => setSettings({ ...settings, sizeFooterDua: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#005B9C]"
                />
              </div>

              {/* Trailing Feed Lines / Spacing Control */}
              <div className="md:col-span-2 bg-[#005B9C]/5 p-3 rounded-lg border border-[#005B9C]/10 mt-2">
                <div className="flex justify-between text-[11px] font-semibold text-[#005B9C] mb-1.5">
                  <span className="flex items-center space-x-1.5">
                    <span>✂️</span>
                    <span>Jarak Potong Kertas Antar Tiket (Baris Kosong)</span>
                  </span>
                  <span className="bg-blue-100 text-[#005B9C] px-2 py-0.5 rounded text-[10px] font-bold">
                    {settings.feedLines !== undefined ? settings.feedLines : 1} Baris
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="4"
                  value={settings.feedLines !== undefined ? settings.feedLines : 1}
                  onChange={(e) => setSettings({ ...settings, feedLines: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#005B9C]"
                />
                <p className="text-[10px] text-gray-500 mt-1 font-normal leading-normal">
                  Atur slider ke <strong>0 atau 1 Baris</strong> untuk merapatkan jarak kosong antar cetakan tiket (mencegah terbuangnya kertas thermal sepanjang 5 CM).
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 3: Web Bluetooth Connection */}
          <div className="border-t border-gray-200 pt-5 space-y-4">
            <h3 className="text-xs font-bold text-[#005B9C] uppercase tracking-wider">
              3. Konektor Printer (Metode Bluetooth Direct)
            </h3>
            
            <div className="bg-gray-50 p-4 border border-gray-200 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-gray-800 flex items-center space-x-1.5">
                    <span className={`w-2 h-2 rounded-full ${bleConnected ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                    <span>Direct Web Bluetooth Kiosk Driver</span>
                  </span>
                  <p className="text-[10px] text-gray-500 mt-0.5">Menghubungkan tab browser Kiosk langsung ke printer thermal fisik Anda lewat Bluetooth.</p>
                </div>
                
                {bleConnected ? (
                  <span className="text-[9px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded border border-emerald-300">
                    TERSAMBUNG
                  </span>
                ) : (
                  <span className="text-[9px] font-bold px-2 py-0.5 bg-gray-150 text-gray-500 rounded border border-gray-300">
                    TERPUTUS
                  </span>
                )}
              </div>

              {bleConnected ? (
                <div className="bg-white border border-gray-220 p-3 rounded-lg flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-[9px] text-gray-400 font-mono">Perangkat Tersambung:</p>
                    <p className="text-xs font-bold text-gray-800 font-mono">
                      {bleDeviceName || "Printer Thermal Bluetooth"}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={handleTestPrintBLE}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] px-3 py-1.5 rounded text-center cursor-pointer transition flex items-center space-x-1"
                    >
                      <span>🖨️</span>
                      <span>Test Cetak Slip</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDisconnectBLE}
                      className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 font-bold text-[10px] px-3 py-1.5 rounded text-center cursor-pointer transition"
                    >
                      Putus Koneksi
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-dashed border-gray-300 p-4 py-6 rounded-lg flex flex-col items-center justify-center text-center">
                  <div className="bg-blue-50 border border-blue-200 p-2.5 rounded-full mb-2 text-[#005B9C]">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <h5 className="text-xs font-bold text-gray-700">Printer Belum Disambungkan</h5>
                  <p className="text-[10px] text-gray-400 max-w-xs mt-0.5 leading-normal mb-3">
                    Harap sandingkan tab browser Kiosk ke mesin printer thermal Anda untuk pencetakan langsung sekali klik.
                  </p>
                  <button
                    type="button"
                    disabled={connecting}
                    onClick={handleConnectBLE}
                    className="bg-[#005B9C] hover:bg-blue-600 disabled:bg-slate-350 text-white font-bold text-xs py-2 px-4 rounded-lg shadow cursor-pointer transition flex items-center space-x-1.5"
                  >
                    <RefreshCw className={`w-3 h-3 ${connecting ? 'animate-spin' : ''}`} />
                    <span>{connecting ? 'Mencari Perangkat...' : '🔍 CARI & HUBUNGKAN PRINTER'}</span>
                  </button>
                </div>
              )}

              {bleError && (
                <div className="bg-rose-50 border border-rose-250 rounded-lg p-2.5 text-[10px] font-bold text-rose-800">
                  ⚠️ Error: {bleError}
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100">
            <button
              type="submit"
              className="bg-[#005B9C] hover:bg-blue-600 text-white font-bold py-2.5 px-6 rounded-lg text-xs uppercase tracking-wide shadow flex items-center space-x-1.5 cursor-pointer transition"
              id="printer-save-submit"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Simpan Pengaturan</span>
            </button>
          </div>
        </form>

        {/* Live physical paper mock layout simulation (Preview) */}
        <div className="lg:col-span-4 bg-gray-100 rounded-xl border border-gray-300 p-5 shadow-inner flex flex-col items-center" id="printer-mini-preview">
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider text-center mb-4 block">🔴 Live Preview Tiket</span>
          
          <div className="w-full max-w-[240px] bg-white text-gray-900 border border-gray-300 p-4 shadow-md flex flex-col font-mono leading-tight select-none rounded">
            
            {/* Header section (Centered logo & title text) */}
            <div className="text-center flex flex-col items-center">
              {settings.showLogo !== false && (
                <div 
                  className="flex items-center justify-center mb-2"
                  style={{ 
                    width: settings.logoSize ? `${settings.logoSize}px` : "48px",
                    height: settings.logoSize ? `${settings.logoSize}px` : "48px"
                  }}
                >
                  {settings.logoType === "custom" && settings.customLogo ? (
                    <img 
                      src={settings.customLogo} 
                      alt="Custom Logo" 
                      style={{
                        maxHeight: settings.logoSize ? `${settings.logoSize}px` : "48px",
                        maxWidth: settings.logoSize ? `${settings.logoSize}px` : "48px",
                        objectFit: "contain"
                      }}
                      className="grayscale contrast-125"
                    />
                  ) : (
                    <div className="bg-[#005B9C] text-[#FFE600] rounded-lg p-1.5 w-full h-full flex items-center justify-center">
                      <Bolt className="fill-current w-[80%] h-[80%]" />
                    </div>
                  )}
                </div>
              )}

              <h3 
                className="font-bold text-slate-900 text-center w-full leading-snug"
                style={{ fontSize: settings.sizeNamaInstansi ? `${settings.sizeNamaInstansi}px` : "14px" }}
              >
                {settings.namaInstansi || 'PT PLN (Persero) UP3 Madiun'}
              </h3>
              <p 
                className="font-bold text-slate-800 text-center w-full mt-0.5"
                style={{ fontSize: settings.sizeCabang ? `${settings.sizeCabang}px` : "11px" }}
              >
                {settings.cabang || 'ULP Mantingan'}
              </p>
              <p 
                className="text-slate-600 font-sans text-center max-w-[180px] mx-auto mt-0.5 leading-snug"
                style={{ fontSize: settings.sizeAlamat ? `${settings.sizeAlamat}px` : "8px" }}
              >
                {settings.alamat || 'Jl. Raya Mantingan, Ngawi, Jawa Timur'}
              </p>
            </div>

            <div className="my-2 border-b border-dashed border-gray-400"></div>

            {/* Ticket core queue sequence information */}
            <div className="text-center">
              <p 
                className="text-gray-550 font-bold font-sans uppercase tracking-wide text-center"
                style={{ fontSize: settings.sizeTeksNomorAntrian ? `${settings.sizeTeksNomorAntrian}px` : "9px" }}
              >
                NOMOR ANTRIAN ANDA
              </p>
              <h1 
                className="font-black text-black my-1 text-center font-mono"
                style={{ fontSize: settings.sizeNomorAntrian ? `${settings.sizeNomorAntrian}px` : "40px", lineHeight: '1' }}
              >
                B-12
              </h1>
              <span 
                className="inline-block border border-gray-400 font-bold px-1.5 py-0.2 text-black font-sans text-center"
                style={{ fontSize: settings.sizeLayanan ? `${settings.sizeLayanan}px` : "10px" }}
              >
                TEST PRINT DIRECT
              </span>
            </div>

            <div className="space-y-1 mt-3 text-slate-600 border-t border-gray-300 pt-2" style={{ fontSize: settings.sizeDateTime ? `${settings.sizeDateTime}px` : "8px" }}>
              <div className="flex justify-between">
                <span>Waktu Catat:</span>
                <span>12:34:56 WIB</span>
              </div>
              <div className="flex justify-between">
                <span>Tanggal:</span>
                <span>20 Juni 2026</span>
              </div>
            </div>

            <div className="my-2 border-b border-dashed border-gray-400 font-sans"></div>

            {/* Footer custom texts */}
            <div className="text-center space-y-1">
              <p 
                className="font-bold text-slate-900 leading-normal"
                style={{ fontSize: settings.sizeFooterSatu ? `${settings.sizeFooterSatu}px` : "8px" }}
              >
                {settings.footerSatu || 'Terima kasih atas kunjungan anda.'}
              </p>
              {settings.showFooterDua !== false && settings.footerDua && (
                <p 
                  className="text-slate-700 leading-normal font-medium"
                  style={{ fontSize: settings.sizeFooterDua ? `${settings.sizeFooterDua}px` : "8px" }}
                >
                  {settings.footerDua}
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-row items-center justify-center text-[10px] text-gray-500 space-x-1.5 max-w-[200px] text-center leading-normal">
            <Info className="w-4 h-4 text-blue-500 shrink-0" />
            <p>Setelan slip tiket di atas akan tercetak sama persis pada kertas thermal fisik Anda.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
