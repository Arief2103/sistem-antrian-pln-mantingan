import React, { useState } from 'react';
import { db } from '../config/supabase';
import { Layanan, Antrian } from '../types';
import { Printer, Calendar, Clock, Smile, Sparkles, Receipt, Bolt } from 'lucide-react';
import { printThermalReceipt } from '../utils/printReceipt';

export default function TicketPrinter({
  printSettings,
  loketList,
  onAddQueue,
  lastCreatedQueue
}: {
  printSettings?: any;
  loketList?: any[];
  onAddQueue?: any;
  lastCreatedQueue?: any;
}) {
  const [layananList] = useState<Layanan[]>(() => db.layanan.get());
  const printerSettings = printSettings || db.printerSettings.get();
  const [printedTicket, setPrintedTicket] = useState<Antrian | null>(null);
  const [printAnimation, setPrintAnimation] = useState(false);

  React.useEffect(() => {
    if (lastCreatedQueue) {
      setPrintedTicket(lastCreatedQueue);
    }
  }, [lastCreatedQueue]);

  const handlePrintTicket = (layananId: string) => {
    try {
      setPrintAnimation(true);
      const layanans = db.layanan.get();
      const targetLayanan = layanans.find((l) => l.id === layananId) || layanans[0];
      
      const baru = onAddQueue 
        ? onAddQueue(targetLayanan.prefix, targetLayanan.name) 
        : db.antrian.buat(layananId);
      
      // Simulate physical printer speed delay
      setTimeout(() => {
        setPrintedTicket(baru);
        setPrintAnimation(false);

        // Automatically trigger POS/Bluetooth Print API
        try {
          const latestSettings = printSettings || db.printerSettings.get();
          // Map to correct properties expected by printThermalReceipt if needed
          const mappedSettings = {
            headerText: latestSettings.namaInstansi || latestSettings.headerText,
            subHeader: latestSettings.cabang || latestSettings.subHeader,
            alamat: latestSettings.alamat,
            footerSatu: latestSettings.footerSatu,
            footerDua: latestSettings.footerDua,
            footerText: latestSettings.footer || latestSettings.footerText,
            showLogo: latestSettings.showLogo,
            paperWidth: latestSettings.paperWidth,
            cetakQr: latestSettings.cetakQr,
            useBluetoothPrintApp: latestSettings.useBluetoothPrintApp,
            useWebBluetooth: latestSettings.useWebBluetooth,
            useRawBtApp: latestSettings.useRawBtApp,
          };
          printThermalReceipt(baru as any, mappedSettings as any);
        } catch (pe) {
          console.error("Auto printer trigger failed:", pe);
        }

        // Optional: play click/beep sound
        try {
          const context = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = context.createOscillator();
          const gain = context.createGain();
          osc.connect(gain);
          gain.connect(context.destination);
          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, context.currentTime); // Beep
          gain.gain.setValueAtTime(0.1, context.currentTime);
          osc.start();
          osc.stop(context.currentTime + 0.15);
        } catch (_) {}
      }, 800);
    } catch (err) {
      console.error(err);
      setPrintAnimation(false);
    }
  };

  const getWaitingCountForLayanan = (layananId: string) => {
    const list = db.antrian.get();
    return list.filter((q: any) => q.layananId === layananId && q.status === 'menunggu').length;
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-neutral-100 py-10 px-4 md:px-8 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8" id="printer-kiosk">
      {/* Kiosk Left Column - Interactive touch screen */}
      <div className="lg:col-span-7 flex flex-col justify-between bg-white border border-neutral-200 shadow-xl rounded-2xl p-6 md:p-8" id="kiosk-touchscreen">
        <div>
          {/* Kiosk Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-5 mb-8">
            <div className="flex items-center space-x-3.5">
              <div className="bg-[#005B9C] p-2 rounded-xl text-[#FFD100] shadow-sm">
                <Bolt className="w-6 h-6 fill-current" />
              </div>
              <div>
                <h2 className="text-[#005B9C] text-lg font-bold tracking-tight uppercase">{printerSettings.namaInstansi}</h2>
                <p className="text-xs text-slate-500 font-medium font-mono">{printerSettings.cabang}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 font-mono">{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p className="text-xs text-slate-500 font-bold font-mono">KIOSK MANDIRI - 01</p>
            </div>
          </div>

          <div className="text-center mb-6">
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">AMBIL NOMOR ANTRIAN</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">Silakan pilih kategori keperluan layanan Anda di bawah ini untuk mencetak tiket antrian secara otomatis.</p>
          </div>

          {/* Service Buttons Grid */}
          <div className="space-y-4">
            {layananList.map((layanan, i) => {
              const waitCount = getWaitingCountForLayanan(layanan.id);
              const serviceColors = [
                { bg: 'hover:border-blue-500 hover:bg-blue-50/20', codeBg: 'bg-blue-600 text-white', accent: 'border-blue-100' },
                { bg: 'hover:border-amber-500 hover:bg-amber-50/20', codeBg: 'bg-amber-500 text-slate-900', accent: 'border-amber-100' },
                { bg: 'hover:border-emerald-500 hover:bg-emerald-50/20', codeBg: 'bg-emerald-600 text-white', accent: 'border-emerald-100' }
              ];
              const theme = serviceColors[i % serviceColors.length];

              return (
                <button
                  key={layanan.id}
                  onClick={() => handlePrintTicket(layanan.id)}
                  className={`w-full text-left p-5 bg-white border-2 border-slate-200 rounded-xl hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] transition duration-200 shadow-sm flex items-center justify-between cursor-pointer ${theme.bg}`}
                  disabled={printAnimation}
                  id={`kiosk-card-${layanan.id}`}
                >
                  <div className="flex items-center space-x-5 mr-3">
                    <div className={`w-14 h-14 ${theme.codeBg} flex items-center justify-center rounded-xl text-2xl font-black font-mono shadow-md`}>
                      {layanan.kode}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 tracking-tight">{layanan.nama}</h4>
                      <p className="text-xs text-slate-500 mt-0.5 max-w-sm md:max-w-md truncate md:whitespace-normal line-clamp-2 md:line-clamp-none">
                        {layanan.deskripsi}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 border-l border-slate-100 pl-4">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Antrean</p>
                    <p className="text-lg font-extrabold text-slate-800 font-mono tracking-tight">{waitCount} <span className="text-xs font-normal text-slate-500 font-sans">Orang</span></p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Info footer */}
        <div className="mt-8 border-t border-slate-100 pt-4 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-1">
            <Smile className="w-4 h-4 text-[#005B9C]" />
            <span>Senyum Layanan Terbaik PLN</span>
          </div>
          <span className="font-mono text-[10px]">Versi Kiosk v2.4.1</span>
        </div>
      </div>

      {/* Kiosk Right Column - Physical printer output simulation */}
      <div className="lg:col-span-5 flex flex-col items-center justify-start py-4" id="kiosk-physical-printer">
        <p className="text-center text-xs font-bold text-neutral-500 uppercase tracking-widest font-mono mb-4">Output Cetak Tiket</p>
        
        {/* Physical Printer Slot Container */}
        <div className="w-full max-w-[340px] bg-neutral-300 rounded-2xl border-4 border-neutral-400 shadow-inner flex flex-col overflow-hidden relative pb-10">
          {/* Plastic printer head body */}
          <div className="bg-neutral-800 py-3.5 px-4 shadow-md border-b-2 border-neutral-900 flex justify-between items-center z-10">
            <span className="w-3 h-3 bg-green-500 rounded-full border border-green-600 animate-pulse"></span>
            <div className="w-20 h-1 bg-black/40 rounded-full"></div>
            <Printer className="w-4 h-4 text-neutral-400" />
          </div>

          {/* Paper roll slit */}
          <div className="bg-[#111] h-3 shadow-inner relative z-15">
            <div className="absolute top-0 bottom-0 left-4 right-4 bg-slate-900 border-x border-neutral-700/50"></div>
          </div>

          {/* Paper Animation Container */}
          <div className="flex justify-center bg-neutral-300">
            {printAnimation && (
              <div className="w-[280px] bg-white shadow-lg p-5 border border-slate-200/50 flex flex-col justify-center items-center text-center animate-bounce py-10 rounded-b-lg">
                <Printer className="w-8 h-8 text-neutral-500 animate-spin mb-2" />
                <p className="text-xs font-bold text-slate-700 font-mono tracking-wider animate-pulse">SEDANG MENCETAK TIKET...</p>
              </div>
            )}

            {!printAnimation && printedTicket && (
              <div className="w-[280px] bg-white text-slate-900 shadow-2xl p-5 border border-slate-200 flex flex-col font-mono leading-tight transition-transform duration-500 hover:scale-[1.02] shadow-black/25 relative border-t-0 rounded-b-lg animate-slide-down">
                
                {/* Torn paper edge visual */}
                <div className="absolute top-0 left-0 right-0 h-1 flex justify-between">
                  {Array.from({ length: 14 }).map((_, idx) => (
                    <div key={idx} className="w-5 h-1.5 bg-neutral-300 rounded-b-sm border-t-0 -mt-0.5" style={{ clipPath: 'polygon(50% 100%, 0 0, 100% 0)' }}></div>
                  ))}
                </div>

                {/* Ticket Receipt Content */}
                <div className="text-center mt-3 flex flex-col items-center">
                  {/* Logo On Top (Centered, Above Title) */}
                  {printerSettings.showLogo !== false && (
                    <div 
                      className="flex items-center justify-center mb-2.5"
                      style={{ 
                        width: printerSettings.logoSize ? `${printerSettings.logoSize}px` : "48px",
                        height: printerSettings.logoSize ? `${printerSettings.logoSize}px` : "48px"
                      }}
                    >
                      <span className="bg-[#005B9C] text-white p-2 rounded-xl flex items-center justify-center h-full w-full shadow-sm">
                        <Bolt style={{ width: '85%', height: '85%' }} className="fill-current text-[#FFD100]" />
                      </span>
                    </div>
                  )}

                  <span 
                    className="font-extrabold text-[#005B9C] tracking-wide block mb-1 text-center"
                    style={{ fontSize: printerSettings.sizeNamaInstansi ? `${printerSettings.sizeNamaInstansi}px` : "14px" }}
                  >
                    {printerSettings.namaInstansi}
                  </span>
                  <p 
                    className="font-bold text-slate-800 text-center"
                    style={{ fontSize: printerSettings.sizeCabang ? `${printerSettings.sizeCabang}px` : "11px" }}
                  >
                    {printerSettings.cabang}
                  </p>
                  <p 
                    className="text-slate-500 font-sans max-w-[220px] mx-auto mt-0.5 leading-relaxed text-center"
                    style={{ fontSize: printerSettings.sizeAlamat ? `${printerSettings.sizeAlamat}px` : "8px" }}
                  >
                    {printerSettings.alamat}
                  </p>
                </div>

                <div className="my-3 border-b border-dashed border-slate-300"></div>

                <div className="text-center font-sans">
                  <p 
                    className="text-slate-400 font-black tracking-widest font-mono"
                    style={{ fontSize: printerSettings.sizeTeksNomorAntrian ? `${printerSettings.sizeTeksNomorAntrian}px` : "9px" }}
                  >
                    NOMOR ANTRIAN ANDA
                  </p>
                  <h1 
                    className="font-black text-[#005B9C] font-mono my-2.5 tracking-tight text-center"
                    style={{ fontSize: printerSettings.sizeNomorAntrian ? `${printerSettings.sizeNomorAntrian}px` : "40px", lineHeight: '1.1' }}
                  >
                    {printedTicket.nomor || printedTicket.formattedNumber}
                  </h1>
                  <span 
                    className="bg-slate-100 text-slate-700 font-semibold px-2 py-1 rounded font-mono border border-slate-200"
                    style={{ fontSize: printerSettings.sizeLayanan ? `${printerSettings.sizeLayanan}px` : "10px" }}
                  >
                    Kategori: {printedTicket.layananKode || printedTicket.prefix}
                  </span>
                </div>

                <div className="mt-4 space-y-1.5 text-slate-600 border-t border-slate-100 pt-3">
                  <div className="flex justify-between" style={{ fontSize: printerSettings.sizeLayanan ? `${printerSettings.sizeLayanan}px` : "10px" }}>
                    <span>Layanan:</span>
                    <span className="font-bold text-slate-800 truncate max-w-[150px]">{printedTicket.layananNama}</span>
                  </div>
                  <div className="flex justify-between font-mono" style={{ fontSize: printerSettings.sizeDateTime ? `${printerSettings.sizeDateTime}px` : "8px" }}>
                    <span>Waktu Cetak:</span>
                    <span>{new Date(printedTicket.created_at || printedTicket.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                  </div>
                  <div className="flex justify-between font-mono" style={{ fontSize: printerSettings.sizeDateTime ? `${printerSettings.sizeDateTime}px` : "8px" }}>
                    <span>Tanggal:</span>
                    <span>{new Date(printedTicket.created_at || printedTicket.createdAt).toLocaleDateString('id-ID', { year: '2-digit', month: '2-digit', day: '2-digit' })}</span>
                  </div>
                  <div className="flex justify-between" style={{ fontSize: printerSettings.sizeDateTime ? `${printerSettings.sizeDateTime}px` : "8px" }}>
                    <span>Jumlah Antrean Baru:</span>
                    <span className="font-bold text-slate-800">{getWaitingCountForLayanan(printedTicket.layananId)} Orang</span>
                  </div>
                </div>

                <div className="my-3 border-b border-dashed border-slate-300"></div>

                <div className="text-center font-sans space-y-1 mt-1 text-slate-500">
                  <p 
                    className="font-bold text-slate-700 leading-tight"
                    style={{ fontSize: printerSettings.sizeFooterSatu ? `${printerSettings.sizeFooterSatu}px` : "8px" }}
                  >
                    {printerSettings.footerSatu}
                  </p>
                  <p 
                    className="text-slate-400 leading-normal"
                    style={{ fontSize: printerSettings.sizeFooterDua ? `${printerSettings.sizeFooterDua}px` : "8px" }}
                  >
                    {printerSettings.footerDua}
                  </p>
                </div>
              </div>
            )}

            {!printAnimation && !printedTicket && (
              <div className="w-[280px] bg-[#f8f9fa]/20 border-2 border-dashed border-neutral-400/50 p-8 rounded-b-lg flex flex-col justify-center items-center text-center text-neutral-500 min-h-[260px]">
                <Receipt className="w-12 h-12 text-slate-400 stroke-[1.5] mb-2 animate-bounce" />
                <p className="text-xs font-bold font-sans">BELUM ADA CETAKAN</p>
                <p className="text-[10px] text-neutral-400 mt-1 leading-normal">Silakan pilih kategori layanan di layar kiri untuk mencetak nomor antrian baru.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
