import React from "react";
import { QueueItem, MonitorSettings } from "../../types";
import { Database, FileText, Calendar } from "lucide-react";

interface DataAntrianProps {
  queues: QueueItem[];
  monitorSettings: MonitorSettings;
}

export default function DataAntrian({ queues, monitorSettings }: DataAntrianProps) {
  // Filter queues to only include those created today (Daily Reset visual isolation)
  const todayStr = new Date().toDateString();
  const todayQueues = queues.filter((q) => {
    if (!q.createdAt) return false;
    return new Date(q.createdAt).toDateString() === todayStr;
  });

  // Calculate live statistics for active queues today
  const totalA = todayQueues.filter((q) => q.prefix === "A").length;
  const waitingA = todayQueues.filter((q) => q.prefix === "A" && q.status === "waiting").length;
  const calledA = todayQueues.filter((q) => q.prefix === "A" && q.status !== "waiting").length;

  const totalB = todayQueues.filter((q) => q.prefix === "B").length;
  const waitingB = todayQueues.filter((q) => q.prefix === "B" && q.status === "waiting").length;
  const calledB = todayQueues.filter((q) => q.prefix === "B" && q.status !== "waiting").length;

  return (
    <div className="space-y-6" id="panel-data-tab">
      {/* Slate Date Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-slate-50 border border-slate-100 rounded-2xl gap-3">
        <div>
          <h2 className="font-extrabold text-slate-900 tracking-tight text-base">Selamat Datang, PLN Mantingan</h2>
          <p className="text-slate-500 text-xs">Menu ini menampilkan total statistik antrean yang berjalan secara realtime.</p>
        </div>
        
        <div className="flex items-center gap-2 px-3 py-1.5 bg-sky-50 text-sky-700 border border-sky-100 rounded-xl text-xs font-bold">
          <Calendar className="w-4 h-4" />
          <span>Tanggal: {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
        </div>
      </div>

      {/* Data Antrian Table - Mimicking exactly the layout of Image 1 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-slate-800 text-sm tracking-tight flex items-center gap-1.5">
            <Database className="w-4.5 h-4.5 text-sky-500" /> DATA ANTRIAN AKTIF HARI INI
          </h3>
          <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded font-bold">Terhubung</span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-extrabold border-b border-slate-100 uppercase text-[10px]">
                <th className="p-4 w-16">No</th>
                <th className="p-4">Jenis Antrean</th>
                <th className="p-4 text-center">Total Antrean</th>
                <th className="p-4 text-center text-rose-600">Belum Dipanggil</th>
                <th className="p-4 text-center text-emerald-600">Sudah Dipanggil</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* Queue A */}
              <tr className="hover:bg-slate-50/50">
                <td className="p-4 font-mono font-bold text-slate-600">1</td>
                <td className="p-4">
                  <span className="font-extrabold text-slate-900 tracking-tight uppercase">
                    {monitorSettings.nameAntrianA}
                  </span>
                  <span className="block text-[10px] text-slate-400 font-mono mt-0.5">Prefix Kode: A</span>
                </td>
                <td className="p-4 text-center font-bold text-slate-800 text-sm">{totalA}</td>
                <td className="p-4 text-center font-bold text-rose-600 text-sm">{waitingA}</td>
                <td className="p-4 text-center font-bold text-emerald-600 text-sm">{calledA}</td>
              </tr>

              {/* Queue B */}
              <tr className="hover:bg-slate-50/50">
                <td className="p-4 font-mono font-bold text-slate-600">2</td>
                <td className="p-4">
                  <span className="font-extrabold text-slate-900 tracking-tight uppercase">
                    {monitorSettings.nameAntrianB}
                  </span>
                  <span className="block text-[10px] text-slate-400 font-mono mt-0.5">Prefix Kode: B</span>
                </td>
                <td className="p-4 text-center font-bold text-slate-800 text-sm">{totalB}</td>
                <td className="p-4 text-center font-bold text-rose-600 text-sm">{waitingB}</td>
                <td className="p-4 text-center font-bold text-emerald-600 text-sm">{calledB}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* History Antrian Table - Mimicking exactly the bottom half of Image 1 */}
      <div className="space-y-3 pt-4">
        <h3 className="font-extrabold text-slate-800 text-sm tracking-tight flex items-center gap-1.5">
          <FileText className="w-4.5 h-4.5 text-violet-500" /> RIWAYAT / LOG HISTORY ANTRIAN
        </h3>

        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-extrabold border-b border-slate-100 uppercase text-[10px]">
                <th className="p-4 w-16">No</th>
                <th className="p-4">Jumlah Antrean A (Adm)</th>
                <th className="p-4">Jumlah Antrean B (Teknis)</th>
                <th className="p-4">Tanggal Arsip</th>
                <th className="p-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {/* Row 1 */}
              <tr className="hover:bg-slate-50/50">
                <td className="p-4 font-mono font-bold">1</td>
                <td className="p-4 font-semibold">18 antrean</td>
                <td className="p-4 font-semibold">24 antrean</td>
                <td className="p-4 font-mono">06 Juni 2026</td>
                <td className="p-4 text-right">
                  <span className="px-2 py-0.5 text-[10px] bg-emerald-50 text-emerald-700 font-bold border border-emerald-100 rounded-full">
                    Selesai diarsipkan
                  </span>
                </td>
              </tr>

              {/* Row 2 */}
              <tr className="hover:bg-slate-50/50">
                <td className="p-4 font-mono font-bold">2</td>
                <td className="p-4 font-semibold">14 antrean</td>
                <td className="p-4 font-semibold">19 antrean</td>
                <td className="p-4 font-mono">05 Juni 2026</td>
                <td className="p-4 text-right">
                  <span className="px-2 py-0.5 text-[10px] bg-emerald-50 text-emerald-700 font-bold border border-emerald-100 rounded-full">
                    Selesai diarsipkan
                  </span>
                </td>
              </tr>

              {/* Row 3 */}
              <tr className="hover:bg-slate-50/50">
                <td className="p-4 font-mono font-bold">3</td>
                <td className="p-4 font-semibold">22 antrean</td>
                <td className="p-4 font-semibold">16 antrean</td>
                <td className="p-4 font-mono">04 Juni 2026</td>
                <td className="p-4 text-right">
                  <span className="px-2 py-0.5 text-[10px] bg-slate-100 text-slate-400 font-bold border border-slate-200 rounded-full">
                    Kedaluwarsa
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
