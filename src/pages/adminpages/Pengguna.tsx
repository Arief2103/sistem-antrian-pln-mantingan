import React, { useState } from "react";
import { User } from "../../types";
import { Users, KeyRound } from "lucide-react";

interface PenggunaProps {
  usersList: User[];
  onUpdateUsersList: (list: User[]) => void;
}

export default function Pengguna({ usersList, onUpdateUsersList }: PenggunaProps) {
  const [newUserName, setNewUserName] = useState("");
  const [newUserRole, setNewUserRole] = useState<"admin" | "petugas">("petugas");
  const [newUserUsername, setNewUserUsername] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserUsername.trim() || !newUserPassword.trim()) return;

    const newUser: User = {
      id: "u_" + Date.now(),
      name: newUserName.trim(),
      role: newUserRole,
      username: newUserUsername.toLowerCase().trim(),
      password: newUserPassword.trim(),
    };

    onUpdateUsersList([...usersList, newUser]);
    setNewUserName("");
    setNewUserUsername("");
    setNewUserPassword("");
  };

  const handleDeleteUser = (id: string) => {
    if (id === "u1") return; // Safe lock on superadmin
    onUpdateUsersList(usersList.filter((u) => u.id !== id));
  };

  return (
    <div className="space-y-6" id="panel-users-tab">
      <div className="border-b pb-3 border-slate-100">
        <h3 className="font-extrabold text-slate-800 text-sm tracking-tight flex items-center gap-1.5">
          <Users className="w-4.5 h-4.5 text-pink-500" />
          PENGATURAN PENGGUNA & ADMIN PETUGAS LOKET
        </h3>
        <p className="text-slate-400 text-xs mt-1">
          Daftarkan akun login untuk petugas pelayanan meja loket di PLN ULP Mantingan.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Add User */}
        <form onSubmit={handleAddUser} className="lg:col-span-12 xl:col-span-5 bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
          <span className="block text-[11px] font-bold tracking-wider text-slate-500 uppercase">Input Akun Petugas Baru</span>
          
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase">Nama Lengkap Petugas</label>
            <input
              type="text"
              className="w-full bg-white border border-slate-200 text-xs rounded-xl p-2.5 text-slate-800 font-medium focus:outline-none"
              placeholder="Contoh: Arief Prasetyo"
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase">Username Login</label>
            <input
              type="text"
              className="w-full bg-white border border-slate-200 text-xs rounded-xl p-2.5 text-slate-800 font-mono focus:outline-none"
              placeholder="Contoh: arief21"
              value={newUserUsername}
              onChange={(e) => setNewUserUsername(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase">Kata Sandi (Password)</label>
            <input
              type="text"
              className="w-full bg-white border border-slate-200 text-xs rounded-xl p-2.5 text-slate-800 focus:outline-none"
              placeholder="Masukkan password baru..."
              value={newUserPassword}
              onChange={(e) => setNewUserPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase">Hak Akses Sistem</label>
            <select
              className="w-full bg-white border border-slate-200 text-xs rounded-xl p-2.5 text-slate-850 font-bold"
              value={newUserRole}
              onChange={(e) => setNewUserRole(e.target.value as "admin" | "petugas")}
            >
              <option value="petugas">Petugas Pelayanan / Operator</option>
              <option value="admin">Administrator (Akses Penuh)</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-950 text-white font-bold text-xs rounded-xl transition-all shadow"
          >
            Tambah Akun Baru
          </button>
        </form>

        {/* Table Accounts List */}
        <div className="lg:col-span-12 xl:col-span-7 space-y-4">
          <span className="block text-xs font-extrabold text-slate-800 uppercase tracking-tight">Akun Yang Memiliki Akses Login</span>
          
          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                  <th className="p-3">Nama Lengkap</th>
                  <th className="p-3">Username</th>
                  <th className="p-3">Password</th>
                  <th className="p-3">Hak Akses</th>
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {usersList.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-semibold text-slate-900">{user.name}</td>
                    <td className="p-3 font-mono">{user.username}</td>
                    <td className="p-3 font-mono text-slate-500">{user.password || "plnmantingan"}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase ${
                        user.role === "admin" ? "bg-red-50 text-red-700 border border-red-100" : "bg-violet-50 text-violet-700 border border-violet-100"
                      }`}>
                        {user.role === "admin" ? "Admin" : "Petugas"}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {user.id !== "u1" ? (
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-md transition-all text-xs font-semibold"
                        >
                          Hapus Akun
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Superadmin</span>
                      )}
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
