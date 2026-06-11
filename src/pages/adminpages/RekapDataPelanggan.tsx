import React, { useState } from "react";
import { QueueItem } from "../../types";
import { FileSpreadsheet, Search, Calendar, Trash2 } from "lucide-react";

interface RekapDataPelangganProps {
  queues: QueueItem[];
  onDeleteQueue?: (id: string) => void;
}

export default function RekapDataPelanggan({ queues = [], onDeleteQueue }: RekapDataPelangganProps) {
  // Simple clean filters: ID Pelanggan, Nama, and Tanggal
  const [idPelFilter, setIdPelFilter] = useState("");
  const [namaFilter, setNamaFilter] = useState("");
  const [dateFilter, setDateFilter] = useState(""); // YYYY-MM-DD

  // Pagination limit state
  const [pageSize, setPageSize] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Filter queues logically with precise conditions (only rows that have some customer data), sorted newest first (descending)
  const filteredQueues = queues.filter((q) => {
    // Treat kiosk-printed items without any form fields as empty unless they match empty filter
    const matchesIdPel = !idPelFilter || (q.pelangganId || "").toLowerCase().includes(idPelFilter.toLowerCase());
    const matchesNama = !namaFilter || (q.pelangganNama || "").toLowerCase().includes(namaFilter.toLowerCase());
    
    let matchesDate = true;
    if (dateFilter) {
      const itemLocalDate = new Date(q.createdAt).toLocaleDateString("en-CA");
      matchesDate = itemLocalDate === dateFilter;
    }

    return matchesIdPel && matchesNama && matchesDate;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Calculate actual entries and pages
  const totalFiltered = filteredQueues.length;
  const totalPages = Math.ceil(totalFiltered / pageSize);
  const activePage = Math.min(currentPage, totalPages || 1);

  const startIndex = (activePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalFiltered);
  const paginatedQueues = filteredQueues.slice(startIndex, endIndex);

  // Export to Excel / CSV file
  const handleExportCSV = () => {
    const headers = [
      "No",
      "ID Pelanggan",
      "Nama Pelanggan",
      "Alamat",
      "No HP",
      "Keterangan/Keperluan",
      "Tanggal & Waktu Pendaftaran"
    ];

    const rows = filteredQueues.map((item, idx) => {
      const formattedDateStr = new Date(item.createdAt).toLocaleString("id-ID");
      return [
        idx + 1,
        `"${(item.pelangganId || "").replace(/"/g, '""')}"`,
        `"${(item.pelangganNama || "").replace(/"/g, '""')}"`,
        `"${(item.pelangganAlamat || "").replace(/"/g, '""')}"`,
        `"${(item.pelangganHp || "").replace(/"/g, '""')}"`,
        `"${(item.pelangganKeterangan || "").replace(/"/g, '""')}"`,
        `"${formattedDateStr.replace(/"/g, '""')}"`
      ];
    });

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const bom = new Uint8Array([0xef, 0xbb, 0xbf]); // UTF-8 BOM for Excel compatibility
    const blob = new Blob([bom, csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Rekap_Pelanggan_${new Date().toLocaleDateString("en-CA")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-xs text-left" id="panel-rekap-data-simple">
      
      {/* Page Title & Export Button */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-100 pb-4 mb-5 gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800" id="rekap-title-text">Rekap Data Pelanggan</h1>
          <p className="text-xs text-slate-400 mt-1">Daftar rekap data antrian pelanggan yang masuk ke dalam sistem.</p>
        </div>
        
        {/* Export Button */}
        <button
          onClick={handleExportCSV}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-md shadow-xs flex items-center gap-2 cursor-pointer transition-colors"
          id="btn-rekap-export-csv"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Export ke Excel / CSV
        </button>
      </div>

      {/* FILTER & LIMIT CONTROLS (Row 1: Entries page limit & Three filters requested) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end mb-6" id="simple-rekap-filters">
        
        {/* Show Entries Dropdown (Left-aligned look) */}
        <div className="flex flex-col">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Tampilkan Data
          </label>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="w-full bg-white border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 rounded-lg focus:outline-none focus:border-slate-400 cursor-pointer shadow-3xs"
          >
            <option value="25">Show 25 entries</option>
            <option value="50">Show 50 entries</option>
            <option value="100">Show 100 entries</option>
          </select>
        </div>

        {/* Filter ID pelanggan */}
        <div className="flex flex-col relative">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Search className="w-3 h-3 text-slate-400" /> ID Pelanggan
          </label>
          <input
            type="text"
            placeholder="Filter ID pelanggan..."
            value={idPelFilter}
            onChange={(e) => {
              setIdPelFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full border border-slate-200 px-3 py-2 text-xs font-bold text-slate-800 rounded-lg focus:outline-none focus:border-slate-400 shadow-3xs"
          />
        </div>

        {/* Filter Nama */}
        <div className="flex flex-col relative">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Search className="w-3 h-3 text-slate-400" /> Nama
          </label>
          <input
            type="text"
            placeholder="Filter nama..."
            value={namaFilter}
            onChange={(e) => {
              setNamaFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full border border-slate-200 px-3 py-2 text-xs font-bold text-slate-800 rounded-lg focus:outline-none focus:border-slate-400 shadow-3xs"
          />
        </div>

        {/* Filter Tanggal */}
        <div className="flex flex-col relative">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-400" /> Tanggal pendaftaran
          </label>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 rounded-lg focus:outline-none focus:border-slate-400 shadow-3xs cursor-pointer"
          />
        </div>

      </div>

      {/* FILTER ACTIVE RESET BUTTON */}
      {(idPelFilter || namaFilter || dateFilter) && (
        <div className="mb-4">
          <button
            onClick={() => {
              setIdPelFilter("");
              setNamaFilter("");
              setDateFilter("");
              setCurrentPage(1);
            }}
            className="text-[11px] font-extrabold text-rose-600 hover:text-rose-700 uppercase tracking-wider"
          >
            × Atur Ulang Filter Pencarian
          </button>
        </div>
      )}

      {/* SIMPLE TABLE WITH THE EXACT ORDER REQUESTED */}
      <div className="border border-slate-300 rounded-lg overflow-hidden shadow-xs" id="simple-table-wrapper">
        <table className="w-full text-left border-collapse" id="table-rekap-pelanggan-clean shadow-xs">
          <thead>
            <tr className="bg-slate-100 text-slate-700 text-[11px] font-black uppercase tracking-wider">
              <th className="p-3 text-center w-14 border border-slate-300">No</th>
              <th className="p-3 border border-slate-300">ID Pelanggan</th>
              <th className="p-3 border border-slate-300">Nama</th>
              <th className="p-3 border border-slate-300">Alamat</th>
              <th className="p-3 border border-slate-300">No HP</th>
              <th className="p-3 border border-slate-300">Keterangan</th>
              <th className="p-3 border border-slate-300">Tanggal</th>
              <th className="p-3 border border-slate-300 text-center w-24">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700 text-xs font-medium">
            {paginatedQueues.map((item, index) => {
              const currentNum = startIndex + index + 1;
              const formattedDate = new Date(item.createdAt).toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric"
              }) + " " + new Date(item.createdAt).toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit"
              }) + " WIB";

              return (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  
                  {/* No */}
                  <td className="p-3 text-center font-mono font-bold text-slate-550 border border-slate-200 bg-slate-50/60 w-14">
                    {currentNum}
                  </td>

                  {/* ID Pelanggan */}
                  <td className="p-3 font-mono font-bold text-slate-900 border border-slate-200 select-all">
                    {item.pelangganId || (
                      <span className="text-slate-400 font-normal italic text-[11px] select-none">-</span>
                    )}
                  </td>

                  {/* Nama */}
                  <td className="p-3 font-bold text-slate-800 border border-slate-200 select-all">
                    {item.pelangganNama || (
                      <span className="text-slate-400 font-normal italic text-[11px] select-none">Tanpa Data</span>
                    )}
                  </td>

                  {/* Alamat */}
                  <td className="p-3 text-slate-650 border border-slate-200 max-w-xs truncate select-all" title={item.pelangganAlamat}>
                    {item.pelangganAlamat || (
                      <span className="text-slate-400 font-normal italic text-[11px] select-none">-</span>
                    )}
                  </td>

                  {/* No HP */}
                  <td className="p-3 font-mono text-slate-750 border border-slate-200 select-all">
                    {item.pelangganHp || (
                      <span className="text-slate-400 font-normal italic text-[11px] select-none">-</span>
                    )}
                  </td>

                  {/* Keterangan */}
                  <td className="p-3 text-slate-650 border border-slate-200 max-w-xs truncate select-all" title={item.pelangganKeterangan}>
                    {item.pelangganKeterangan || (
                      <span className="text-slate-400 font-normal italic text-[11px] select-none">-</span>
                    )}
                  </td>

                  {/* Tanggal */}
                  <td className="p-3 font-semibold text-slate-700 border border-slate-200 whitespace-nowrap">
                    {formattedDate}
                  </td>

                  {/* Aksi */}
                  <td className="p-3 text-center border border-slate-200 whitespace-nowrap">
                    <button
                      onClick={() => {
                        if (window.confirm(`Apakah Anda yakin ingin menghapus data antrean untuk ID "${item.pelangganId || '-'}" / "${item.pelangganNama || 'Tanpa Nama'}"?`)) {
                          onDeleteQueue?.(item.id);
                        }
                      }}
                      className="px-2.5 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-250 hover:border-transparent rounded font-bold text-[10px] inline-flex items-center gap-1 cursor-pointer transition-all uppercase tracking-wider shadow-3xs"
                      title="Hapus Data"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus</span>
                    </button>
                  </td>

                </tr>
              );
            })}

            {/* Empty matching fallback */}
            {totalFiltered === 0 && (
              <tr>
                <td colSpan={8} className="p-10 text-center text-slate-400 italic bg-white select-none border border-slate-200">
                  Tidak ada data yang cocok dengan pencarian / filter Anda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* FOOTER ENTRIES & SIMPLE PAGINATION CONTROLS */}
      <div className="flex flex-col sm:flex-row justify-between items-center mt-5 gap-3 text-xs text-slate-500 font-bold" id="table-simple-footer">
        <div>
          Showing {totalFiltered > 0 ? startIndex + 1 : 0} to {endIndex} of {totalFiltered} entries
          {totalFiltered !== queues.length && ` (filtered from ${queues.length} total entries)`}
        </div>

        {/* Pagination keys */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={activePage === 1}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-md text-slate-600 font-bold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed select-none transition-colors"
            >
              Previous
            </button>
            <span className="px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-md font-mono">
              {activePage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={activePage === totalPages}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-md text-slate-600 font-bold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed select-none transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
