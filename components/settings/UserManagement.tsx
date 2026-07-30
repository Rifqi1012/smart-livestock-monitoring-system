"use client";

import { useState } from "react";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useToast } from "@/components/ui/toast";

type User = { id: string; name: string; username: string; role: string };

const ROLE_LABEL: Record<string, string> = {
  admin: "Admin",
  petugas_kandang: "Petugas Kandang",
};

export default function UserManagement({
  initialUsers,
  currentUserId,
}: {
  initialUsers: User[];
  currentUserId: string;
}) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("petugas_kandang");
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  async function addUser(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/settings/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, username, password, role }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Gagal menambah user");
      setUsers((u) => [...u, json.data]);
      setName("");
      setUsername("");
      setPassword("");
      setRole("petugas_kandang");
      toast(`User "${json.data.username}" berhasil ditambahkan`, "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Terjadi kesalahan", "error");
    } finally {
      setBusy(false);
    }
  }

  async function deleteUser(u: User) {
    const res = await fetch(`/api/settings/user/${u.id}`, { method: "DELETE" });
    const json = await res.json().catch(() => ({}));
    if (res.ok) {
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
      toast(`User "${u.username}" berhasil dihapus`, "success");
    } else {
      toast(json.message || "Gagal menghapus user", "error");
    }
  }

  return (
    <div className="space-y-6">
      {/* Tabel user */}
      <div className="overflow-x-auto rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-500">
              <th className="py-2 pr-3 font-medium">Username</th>
              <th className="py-2 pr-3 font-medium">Nama</th>
              <th className="py-2 pr-3 font-medium">Role</th>
              <th className="py-2 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-gray-100 last:border-0">
                <td className="py-2 pr-3 font-medium">{u.username}</td>
                <td className="py-2 pr-3">{u.name}</td>
                <td className="py-2 pr-3">{ROLE_LABEL[u.role] ?? u.role}</td>
                <td className="py-2">
                  {u.id === currentUserId ? (
                    <span className="text-xs text-gray-400">Akun Anda</span>
                  ) : (
                    <ConfirmDialog
                      title="Hapus User Ini?"
                      description={
                        <>
                          User <span className="font-semibold text-[#1F2937]">{u.name}</span> (
                          {u.username}) akan dihapus permanen.
                        </>
                      }
                      confirmText="Ya, Hapus"
                      cancelText="Batal"
                      variant="destructive"
                      onConfirm={() => deleteUser(u)}
                      trigger={
                        <button className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50">
                          Hapus
                        </button>
                      }
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Form tambah user */}
      <form
        onSubmit={addUser}
        className="space-y-4 rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm"
      >
        <h3 className="text-sm font-semibold text-gray-700">Tambah User Baru</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col text-sm">
            <span className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Nama</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl bg-[#F3F4F6] px-4 py-2.5 text-sm text-[#1F2937] outline-none focus:ring-2 focus:ring-[#10B981]"
            />
          </label>
          <label className="flex flex-col text-sm">
            <span className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Username</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="rounded-xl bg-[#F3F4F6] px-4 py-2.5 text-sm text-[#1F2937] outline-none focus:ring-2 focus:ring-[#10B981]"
            />
          </label>
          <label className="flex flex-col text-sm">
            <span className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="rounded-xl bg-[#F3F4F6] px-4 py-2.5 text-sm text-[#1F2937] outline-none focus:ring-2 focus:ring-[#10B981]"
            />
          </label>
          <label className="flex flex-col text-sm">
            <span className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Role</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="rounded-xl bg-[#F3F4F6] px-4 py-2.5 text-sm text-[#1F2937] outline-none focus:ring-2 focus:ring-[#10B981]"
            >
              <option value="petugas_kandang">Petugas Kandang</option>
              <option value="admin">Admin</option>
            </select>
          </label>
        </div>

        <button
          type="submit"
          disabled={busy}
          className="rounded-xl bg-[#10B981] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0ea371] disabled:opacity-60"
        >
          {busy ? "Menyimpan..." : "Tambah User"}
        </button>
      </form>
    </div>
  );
}
