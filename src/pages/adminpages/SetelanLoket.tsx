import React, { useState } from "react";
import { LoketItem } from "../../types";
import { Plus, Trash2 } from "lucide-react";

interface SetelanLoketProps {
  loketList: LoketItem[];
  onUpdateLoket: (newLoketList: LoketItem[]) => void;
}

export default function SetelanLoket({ loketList, onUpdateLoket }: SetelanLoketProps) {
  const [newLoketName, setNewLoketName] = useState(`Loket ${loketList.length + 1}`);
  const [newLoketPrefix, setNewLoketPrefix] = useState("A");
  const [newServiceName, setNewServiceName] = useState("");

  const handleAddLoketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const prefixClean = newLoketPrefix.trim().toUpperCase();
    if (!newLoketName.trim() || !prefixClean || !newServiceName.trim()) return;

    const newLoket: LoketItem = {
      id: "loket_" + Date.now(),
      name: newLoketName.trim(),
      prefix: prefixClean,
      serviceName: newServiceName.trim(),
      isActive: true,
    };

    onUpdateLoket([...loketList, newLoket]);
    setNewLoketName(`Loket ${loketList.length + 2}`);
    setNewServiceName("");
  };

  const handleToggleLoketActive = (id: string) => {
    const updated = loketList.map((l) => (l.id === id ? { ...l, isActive: !l.isActive } : l));
    onUpdateLoket(updated);
  };

  const handleDeleteLoket = (id: string) => {
    const updated = loketList.filter((l) => l.id !== id);
    onUpdateLoket(updated);
  };

  return (
    <div className="space-y-6" id="panel-loket-tab">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Add Counter Desk */}
        <form onSubmit={handleAddLoketSubmit} className="lg:col-span-12 xl:col-span-5 bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4">
          <h3 className="font-extrabold text-slate-800 text-xs tracking-wider uppercase mb-3 flex items-center gap-1.5 border-b pb-2">
            <Plus className="w-4 h-4 text-sky-600" />
            Tambah Counter Desk Baru
          </h3>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase">Nama Loket / Tempat Mengantri</label>
            <input
              type="text"
              value={newLoketName}
              onChange={(e) => setNewLoketName(e.target.value)}
              placeholder="Contoh: Loket Pelayanan atau Loket P2TL"
              className="w-full bg-white border border-slate-200 text-xs rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-1">
              <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase">Prefix / Kode</label>
              <input
                type="text"
                value={newLoketPrefix}
                onChange={(e) => setNewLoketPrefix(e.target.value.substring(0, 2).replace(/[^a-zA-Z]/g, "").toUpperCase())}
                placeholder="A"
                maxLength={2}
                className="w-full bg-white border border-slate-200 text-xs rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold text-center"
                required
              />
            </div>
            <div className="col-span-2">
              <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase">Jenis Layanan</label>
              <input
                type="text"
                value={newServiceName}
                onChange={(e) => setNewServiceName(e.target.value)}
                placeholder="Contoh: Pelayanan Pelanggan atau P2TL"
                className="w-full bg-white border border-slate-200 text-xs rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-950 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Daftarkan Loket
          </button>
        </form>

        {/* Counter Lists */}
        <div className="lg:col-span-7 space-y-4">
          <h4 className="font-extrabold text-slate-800 text-sm tracking-tight">Fisik Loket Aktif ({loketList.length})</h4>

          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                  <th className="p-3">Nama Loket</th>
                  <th className="p-3">Prefix Kode</th>
                  <th className="p-3">Jenis Layanan</th>
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loketList.map((loket) => (
                  <tr key={loket.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-semibold text-slate-800">{loket.name}</td>
                    <td className="p-3">
                      <span className="px-2.5 py-1 bg-sky-50 text-sky-700 border border-sky-100 rounded font-bold font-mono text-xs">
                        {loket.prefix}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600 font-medium">{loket.serviceName}</td>
                    <td className="p-3 text-right flex gap-1 justify-end">
                      <button
                        onClick={() => handleToggleLoketActive(loket.id)}
                        className={`px-2 py-1 rounded text-[10px] font-bold ${
                          loket.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {loket.isActive ? "Aktif" : "Mati"}
                      </button>
                      <button
                        onClick={() => handleDeleteLoket(loket.id)}
                        className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
