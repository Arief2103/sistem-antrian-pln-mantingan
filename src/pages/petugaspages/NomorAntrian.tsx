import React from "react";
import { QueueItem, LoketItem } from "../../types";
import { Clock, Inbox, Users, CheckCircle, Slash, Layers } from "lucide-react";

interface NomorAntrianProps {
  queues: QueueItem[];
  loketList: LoketItem[];
  selectedLoketId: string;
  onCallQueue: (queueId: string, loketId: string, loketName: string) => void;
}

export default function NomorAntrian({
  queues,
  loketList,
  selectedLoketId,
  onCallQueue,
}: NomorAntrianProps) {
  // Filter queues to today's date only (Daily reset isolation)
  const todayStr = new Date().toDateString();
  const todayQueues = queues.filter((q) => {
    if (!q.createdAt) return false;
    return new Date(q.createdAt).toDateString() === todayStr;
  });

  // Filters
  const waitingQueues = todayQueues.filter((q) => q.status === "waiting");
  const completedQueues = todayQueues.filter((q) => q.status === "completed");
  const skippedQueues = todayQueues.filter((q) => q.status === "skipped");

  const currentLoket = loketList.find((l) => l.id === selectedLoketId);

  return (
    <div className="space-y-6" id="panel-nomor-antrian">
      
      {/* Dynamic Summary counters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="stats-grid-officer">
        
        <div className="p-4 bg-sky-50 rounded-2xl border border-sky-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-sky-850 uppercase block">Mengantre</span>
            <span className="text-2xl font-black text-sky-950 font-mono">{waitingQueues.length}</span>
          </div>
          <Users className="w-8 h-8 text-sky-400" />
        </div>

        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-emerald-850 uppercase block">Dilayani & Selesai</span>
            <span className="text-2xl font-black text-emerald-950 font-mono">{completedQueues.length}</span>
          </div>
          <CheckCircle className="w-8 h-8 text-emerald-400" />
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Dilewati / Lewat</span>
            <span className="text-2xl font-black text-slate-800 font-mono">{skippedQueues.length}</span>
          </div>
          <Layers className="w-8 h-8 text-slate-400" />
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left column (5/12): Live Waiting Feed */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 p-5 flex flex-col min-h-[350px]">
          <div className="flex items-center justify-between border-b pb-3 mb-3">
            <h3 className="font-extrabold text-slate-800 text-xs tracking-wider uppercase flex items-center gap-1.5">
              Daftar Tunggu Pelanggan
            </h3>
            <span className="text-[10px] bg-sky-50 text-sky-700 font-bold px-2 py-0.5 rounded-full">
              {waitingQueues.length} Antrean
            </span>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-[320px] pr-1">
            {waitingQueues.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between hover:border-slate-200 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-slate-900 text-white font-black text-sm rounded-lg flex items-center justify-center font-mono">
                    {item.formattedNumber}
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-800 line-clamp-1 max-w-[150px]">
                      {item.serviceName}
                    </h4>
                    <span className="text-[10px] text-slate-400 block mt-0.5 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {new Date(item.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (!currentLoket) {
                      alert("Silakan pilih Meja Loket terlebih dahulu di tab Panggil Antrean!");
                      return;
                    }
                    onCallQueue(item.id, currentLoket.id, currentLoket.name);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-sky-50 text-sky-600 hover:bg-sky-600 hover:text-white transition-all text-[10px] font-bold cursor-pointer"
                >
                  Panggil
                </button>
              </div>
            ))}

            {waitingQueues.length === 0 && (
              <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                <Inbox className="w-8 h-8 text-slate-300" />
                <p className="italic">Daftar tunggu kosong.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right column (7/12): Completed and Skipped records list */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Completed queues list */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h4 className="font-extrabold text-slate-800 text-xs tracking-wider uppercase border-b pb-2 mb-3">
              Antrean Selesai Dilayani ({completedQueues.length})
            </h4>

            <div className="max-h-[160px] overflow-y-auto space-y-2 pr-1">
              {completedQueues.map((item) => (
                <div key={item.id} className="p-2.5 border border-slate-50 rounded-xl bg-emerald-50/20 flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 bg-emerald-500 text-white rounded font-mono font-bold flex items-center justify-center text-xs">
                      {item.formattedNumber}
                    </span>
                    <div>
                      <p className="font-semibold text-slate-850 line-clamp-1 max-w-[200px]">{item.serviceName}</p>
                      <p className="text-[10px] text-slate-450">Dilayani: {item.loketName || "Meja"}</p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">Selesai</span>
                </div>
              ))}
              {completedQueues.length === 0 && (
                <p className="text-center py-6 italic text-slate-400 text-xs">Belum ada antrean diselesaikan hari ini.</p>
              )}
            </div>
          </div>

          {/* Skipped queues list */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h4 className="font-extrabold text-slate-800 text-xs tracking-wider uppercase border-b pb-2 mb-3">
              Antrean Dilewati ({skippedQueues.length})
            </h4>

            <div className="max-h-[160px] overflow-y-auto space-y-2 pr-1">
              {skippedQueues.map((item) => (
                <div key={item.id} className="p-2.5 border border-slate-50 rounded-xl bg-slate-50 flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 bg-slate-400 text-white rounded font-mono font-bold flex items-center justify-center text-xs">
                      {item.formattedNumber}
                    </span>
                    <div>
                      <p className="font-semibold text-slate-700 line-clamp-1 max-w-[200px]">{item.serviceName}</p>
                      <p className="text-[10px] text-slate-400">Dipanggil di: {item.loketName || "Meja"}</p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-slate-200 text-slate-600 font-bold px-2 py-0.5 rounded-full">Terlewati</span>
                </div>
              ))}
              {skippedQueues.length === 0 && (
                <p className="text-center py-6 italic text-slate-400 text-xs">Tidak ada antrean terlewati.</p>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
