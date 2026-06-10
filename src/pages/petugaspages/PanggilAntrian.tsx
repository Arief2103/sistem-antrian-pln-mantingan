import React, { useState } from "react";
import { LoketItem, QueueItem } from "../../types";
import { Play, RotateCcw, CheckCircle, ArrowRight, PlusCircle, Users, User, Phone, MapPin, ClipboardList, Bolt } from "lucide-react";

interface PanggilAntrianProps {
  loketList: LoketItem[];
  queues: QueueItem[];
  selectedLoketId: string;
  setSelectedLoketId: (id: string) => void;
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
}

export default function PanggilAntrian({
  loketList,
  queues,
  selectedLoketId,
  setSelectedLoketId,
  onCallQueue,
  onCompleteQueue,
  onSkipQueue,
  onAddQueue,
}: PanggilAntrianProps) {
  // Group active categories by prefix dynamically to avoid duplicates in manual registry selection
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

  const [customPrefix, setCustomPrefix] = useState("A");
  const [customServiceName, setCustomServiceName] = useState("");

  // Customer walk-in state properties
  const [walkinNama, setWalkinNama] = useState("");
  const [walkinIdPel, setWalkinIdPel] = useState("");
  const [walkinAlamat, setWalkinAlamat] = useState("");
  const [walkinHp, setWalkinHp] = useState("");
  const [walkinKeterangan, setWalkinKeterangan] = useState("");

  const currentLoket = loketList.find((l) => l.id === selectedLoketId);
  
  // Synchronize dynamic walk-in categories
  React.useEffect(() => {
    if (activeCategories.length > 0) {
      const exists = activeCategories.some(cat => cat.serviceName === customServiceName && cat.prefix === customPrefix);
      if (!exists) {
        setCustomPrefix(activeCategories[0].prefix);
        setCustomServiceName(activeCategories[0].serviceName);
      }
    }
  }, [activeCategories, customPrefix, customServiceName]);

  // Filter queues to today's date only (Daily reset isolation)
  const todayStr = new Date().toDateString();
  const todayQueues = queues.filter((q) => {
    if (!q.createdAt) return false;
    return new Date(q.createdAt).toDateString() === todayStr;
  });

  // Filter queue status
  const waitingQueues = todayQueues.filter((q) => q.status === "waiting");
  
  // Active caller on current desk
  const currentServingQueue = todayQueues.find(
    (q) => q.status === "calling" && q.loketId === selectedLoketId
  );

  const handleCallNext = () => {
    if (!currentLoket) return;
    const nextInLine = waitingQueues.find((q) => q.prefix === currentLoket.prefix);
    const fallbackNext = waitingQueues[0];

    const targetQueue = nextInLine || fallbackNext;

    if (targetQueue) {
      onCallQueue(targetQueue.id, currentLoket.id, currentLoket.name);
    } else {
      alert("Tidak ada antrean tersisa dalam status Menunggu (Waiting List).");
    }
  };

  const handleAddWalkIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPrefix || !customServiceName) {
      alert("Silakan pilih jenis layanan terlebih dahulu.");
      return;
    }
    
    const customerData = {
      pelangganNama: walkinNama.trim(),
      pelangganId: walkinIdPel.trim(),
      pelangganAlamat: walkinAlamat.trim(),
      pelangganHp: walkinHp.trim(),
      pelangganKeterangan: walkinKeterangan.trim(),
    };

    onAddQueue(customPrefix, customServiceName, customerData);

    // Reset input fields
    setWalkinNama("");
    setWalkinIdPel("");
    setWalkinAlamat("");
    setWalkinHp("");
    setWalkinKeterangan("");

    alert("Antrean manual offline berhasil didaftarkan!");
  };

  const handleServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const name = e.target.value;
    setCustomServiceName(name);
    const found = activeCategories.find((cat) => cat.serviceName === name);
    if (found) {
      setCustomPrefix(found.prefix);
    }
  };

  return (
    <div className="space-y-6" id="panel-panggil-antrian">
      
      {/* Desk and Announcement console */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow border border-slate-800" id="officer-active-caller">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 pb-2 border-b border-slate-800">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-2">
              PEMANGGILAN AKTIF ({currentLoket ? currentLoket.name : "N/A"})
            </h3>
            <p className="text-slate-400 text-[11px] mt-0.5">Fokus: {currentLoket ? currentLoket.serviceName : "--"}</p>
          </div>
          
          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-mono">PILIK LOKET MEJA AKTIF:</span>
            <select
              value={selectedLoketId}
              onChange={(e) => setSelectedLoketId(e.target.value)}
              className="ml-2 bg-slate-800 border border-slate-700 text-xs font-bold rounded-lg px-2 py-1 text-white focus:outline-none"
            >
              {loketList.map((lok) => (
                <option key={lok.id} value={lok.id}>
                  {lok.name} ({lok?.prefix})
                </option>
              ))}
            </select>
          </div>
        </div>

        {currentServingQueue ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center" id="active-call-layout">
            <div className="bg-slate-950 rounded-xl p-6 text-center border border-slate-800">
              <span className="text-xs text-slate-400 tracking-wider uppercase block mb-1">
                Sedang Dipanggil di Meja ini
              </span>
              <div className="text-6xl font-extrabold font-mono tracking-wider text-emerald-450 my-2">
                {currentServingQueue.formattedNumber}
              </div>
              <p className="text-xs text-sky-300 font-semibold truncate uppercase">
                Layanan: {currentServingQueue.serviceName}
              </p>

              {/* Customer registered profile details */}
              {(currentServingQueue.pelangganNama || currentServingQueue.pelangganId || currentServingQueue.pelangganHp || currentServingQueue.pelangganAlamat || currentServingQueue.pelangganKeterangan) && (
                <div className="mt-4 pt-3 border-t border-slate-900 text-left space-y-1.5 text-xs">
                  <span className="text-[10px] font-black tracking-wider text-teal-400 uppercase block mb-1">
                    🎯 IDENTITAS PELANGGAN (TERDAFTAR)
                  </span>
                  {currentServingQueue.pelangganNama && (
                    <div className="flex gap-1.5">
                      <span className="text-slate-500 shrink-0 font-medium scale-90">NAMA:</span> 
                      <span className="text-white font-bold uppercase">{currentServingQueue.pelangganNama}</span>
                    </div>
                  )}
                  {currentServingQueue.pelangganId && (
                    <div className="flex gap-1.5">
                      <span className="text-slate-500 shrink-0 font-medium scale-90">ID PEL:</span> 
                      <span className="text-amber-405 font-extrabold font-mono text-emerald-450">{currentServingQueue.pelangganId}</span>
                    </div>
                  )}
                  {currentServingQueue.pelangganHp && (
                    <div className="flex gap-1.5">
                      <span className="text-slate-500 shrink-0 font-medium scale-90">NO HP:</span> 
                      <span className="text-sky-300 font-bold font-mono">{currentServingQueue.pelangganHp}</span>
                    </div>
                  )}
                  {currentServingQueue.pelangganAlamat && (
                    <div className="flex flex-col">
                      <span className="text-slate-500 text-[10px] font-medium">ALAMAT:</span> 
                      <span className="text-slate-300 italic pl-1 text-[11px] leading-tight">{currentServingQueue.pelangganAlamat}</span>
                    </div>
                  )}
                  {currentServingQueue.pelangganKeterangan && (
                    <div className="flex flex-col">
                      <span className="text-slate-500 text-[10px] font-medium">KEPERLUAN:</span> 
                      <span className="text-slate-200 font-medium bg-slate-900 border border-slate-800 rounded px-2 py-1 mt-0.5 inline-block text-[11px] leading-tight">{currentServingQueue.pelangganKeterangan}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-3" id="active-commands-list">
              <div className="p-3 bg-slate-850/50 rounded-xl text-xs text-slate-300 leading-snug font-medium">
                <p className="font-bold text-white mb-1">Panduan Pelayanan:</p>
                Asistensi suara sound system lobby akan memanggil nomor ini. Selesaikan pelayanan, lalu ketuk centang Selesai.
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => onCallQueue(currentServingQueue.id, currentServingQueue.loketId || "", currentServingQueue.loketName || "")}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
                  id="btn-reannounce-sub"
                >
                  <RotateCcw className="w-4 h-4" /> Panggil Ulang
                </button>

                <button
                  onClick={() => onCompleteQueue(currentServingQueue.id)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
                  id="btn-complete-sub"
                >
                  <CheckCircle className="w-4 h-4" /> Selesai
                </button>
              </div>

              <button
                onClick={() => onSkipQueue(currentServingQueue.id)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 rounded-xl text-xs font-bold transition-all"
                id="btn-skip-sub"
              >
                Lewati / Tidak Datang
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-slate-950/40 rounded-xl border border-dashed border-slate-800" id="blank-serving-pane">
            <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h4 className="font-bold text-slate-300">Belum ada antrean terpanggil di Loket Anda</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Silakan panggil nomor antrean berikutnya dari daftar tunggu pelanggan.
            </p>

            <button
              onClick={handleCallNext}
              disabled={waitingQueues.length === 0}
              className={`mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold transition-all shadow-md ${
                waitingQueues.length === 0
                  ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                  : "bg-sky-600 hover:bg-sky-700 text-white active:scale-95 cursor-pointer"
              }`}
              id="btn-trigger-next"
            >
              Panggil Antrean Berikutnya <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Form Add walk-in */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6" id="add-walk-in-panel">
        <h3 className="font-extrabold text-slate-850 text-xs uppercase tracking-wider mb-4 flex items-center gap-1.5 border-b pb-2">
          <PlusCircle className="w-4 h-4 text-sky-500" />
          Registrasi Tiket Antrean Manual Offline
        </h3>

        <form onSubmit={handleAddWalkIn} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase flex items-center gap-1">
                Jenis Layanan PLN
              </label>
              <select
                value={customServiceName}
                onChange={handleServiceChange}
                className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                id="walkin-service"
              >
                {activeCategories.map((cat) => (
                  <option key={cat.prefix} value={cat.serviceName}>
                    {cat.serviceName} (Prefix {cat.prefix})
                  </option>
                ))}
                {activeCategories.length === 0 && (
                  <option value="">Tidak ada layanan aktif</option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase">
                Kode Prefix
              </label>
              <input
                type="text"
                value={customPrefix}
                readOnly
                className="w-full bg-slate-100 border border-slate-200 text-xs font-extrabold rounded-xl p-2.5 text-slate-600 cursor-not-allowed text-center"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase flex items-center gap-1">
                <User className="w-3 text-sky-500" /> Nama Pelanggan
              </label>
              <input
                type="text"
                placeholder="Nama Lengkap"
                value={walkinNama}
                onChange={(e) => setWalkinNama(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl p-2.5 text-slate-800 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase flex items-center gap-1">
                <Bolt className="w-3 text-amber-500" /> ID Pelanggan (12 Digit)
              </label>
              <input
                type="text"
                maxLength={12}
                placeholder="ID Pelanggan / No Meter"
                value={walkinIdPel}
                onChange={(e) => setWalkinIdPel(e.target.value.replace(/\D/g, ""))}
                className="w-full bg-slate-50 border border-slate-200 text-xs font-mono rounded-xl p-2.5 text-slate-800 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase flex items-center gap-1">
                <Phone className="w-3 text-emerald-500" /> No HP / WhatsApp
              </label>
              <input
                type="tel"
                placeholder="Nomor Telepon Aktif"
                value={walkinHp}
                onChange={(e) => setWalkinHp(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-xs font-mono rounded-xl p-2.5 text-slate-800 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase flex items-center gap-1">
                <ClipboardList className="w-3 text-purple-500" /> Keterangan / Keluhan
              </label>
              <input
                type="text"
                placeholder="Contoh: Meter mati total"
                value={walkinKeterangan}
                onChange={(e) => setWalkinKeterangan(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl p-2.5 text-slate-800 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase flex items-center gap-1">
                <MapPin className="w-3 text-rose-500" /> Alamat Lengkap
              </label>
              <input
                type="text"
                placeholder="Alamat rumah atau lokasi gardu/meteran"
                value={walkinAlamat}
                onChange={(e) => setWalkinAlamat(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl p-2.5 text-slate-800 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-950 border border-transparent text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 h-10 cursor-pointer"
              id="btn-walkin"
            >
              <PlusCircle className="w-4 h-4" /> Daftarkan Pelanggan
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}
