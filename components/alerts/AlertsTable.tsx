"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import StatusBadge from "@/components/StatusBadge";
import { formatTanggalIndo } from "@/lib/format-date";
import { useToast } from "@/components/ui/toast";
import type { StreamEvent } from "@/lib/sensor-bus";

type Alert = {
  id: string;
  statusLabel: "waspada" | "bahaya";
  pushStatus: string;
  read: boolean;
  createdAt: string;
  monitoringData: {
    suhu: number;
    kelembapan: number;
    amonia: number;
    thi: number;
    statusLevel: number;
  } | null;
};

const LEVEL: Record<string, 0 | 1 | 2> = { normal: 0, waspada: 1, bahaya: 2 };

function Terkirim({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    sent: { label: "Terkirim", cls: "bg-emerald-100 text-emerald-700" },
    failed: { label: "Gagal", cls: "bg-red-100 text-red-700" },
    pending: { label: "Menunggu", cls: "bg-gray-100 text-gray-600" },
  };
  const s = map[status] ?? map.pending;
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${s.cls}`}>
      {s.label}
    </span>
  );
}

export default function AlertsTable() {
  const router = useRouter();
  const [jenis, setJenis] = useState("semua");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [rows, setRows] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  // Load the alert list for the current filters.
  const load = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      const qs = new URLSearchParams();
      if (jenis !== "semua") qs.set("jenis", jenis);
      if (from) qs.set("from", `${from}T00:00:00`);
      if (to) qs.set("to", `${to}T23:59:59`);
      try {
        const res = await fetch(`/api/notifications?${qs.toString()}`, { signal });
        const json = await res.json();
        setRows(json.data ?? []);
      } catch {
        if (!signal?.aborted) setRows([]);
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [jenis, from, to],
  );

  // Re-run whenever filters change.
  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  // Live: a new alert (level ≥ 1) arriving over SSE re-runs the filtered query
  // and refreshes the server-rendered summary cards.
  const loadRef = useRef(load);
  loadRef.current = load;
  useEffect(() => {
    const es = new EventSource("/api/stream");
    let first = true;
    es.onmessage = (e) => {
      const d = JSON.parse(e.data) as StreamEvent;
      // Skip the initial snapshot echo — the table already loaded fresh on mount.
      if (first) {
        first = false;
        return;
      }
      if (d.statusLevel >= 1) {
        loadRef.current();
        router.refresh();
      }
    };
    return () => es.close();
  }, [router]);

  function resetFilter() {
    setJenis("semua");
    setFrom("");
    setTo("");
  }

  async function markRead(id: string) {
    const res = await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    if (res.ok) {
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, read: true } : r)));
      toast("Alert ditandai sudah dibaca", "success");
    } else {
      toast("Gagal menandai alert", "error");
    }
  }

  return (
    <section className="space-y-4">
      {/* Filter */}
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
        <div className="flex flex-col text-xs text-gray-500">
          Jenis Alert
          <div className="mt-1 flex gap-2">
            {[
              { key: "semua", label: "Semua" },
              { key: "waspada", label: "Waspada" },
              { key: "bahaya", label: "Bahaya" },
            ].map((j) => (
              <button
                key={j.key}
                onClick={() => setJenis(j.key)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  jenis === j.key
                    ? "bg-[#10B981] text-white"
                    : "border border-[#E5E7EB] bg-white text-[#6B7280] hover:bg-gray-50"
                }`}
              >
                {j.label}
              </button>
            ))}
          </div>
        </div>
        <label className="flex flex-col text-xs text-gray-500">
          Dari Tanggal
          <input
            type="date"
            value={from}
            max={to || undefined}
            onChange={(e) => setFrom(e.target.value)}
            className="mt-1 rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900"
          />
        </label>
        <label className="flex flex-col text-xs text-gray-500">
          Sampai Tanggal
          <input
            type="date"
            value={to}
            min={from || undefined}
            onChange={(e) => setTo(e.target.value)}
            className="mt-1 rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900"
          />
        </label>
        <button
          onClick={resetFilter}
          className="rounded-full border border-[#E5E7EB] bg-white px-4 py-1.5 text-sm font-medium text-[#6B7280] hover:bg-gray-50"
        >
          Reset Filter
        </button>
      </div>

      {/* Tabel / empty state */}
      {loading ? (
        <p className="py-10 text-center text-sm text-gray-400">Memuat data...</p>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#E5E7EB] bg-white py-16 text-center">
          <p className="font-medium text-gray-600">Belum ada peringatan</p>
          <p className="mt-1 text-sm text-gray-400">
            Notifikasi akan muncul di sini ketika kondisi kandang berada di luar batas aman
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="py-2 pr-3 font-medium">Waktu</th>
                <th className="py-2 pr-3 font-medium">Jenis Alert</th>
                <th className="py-2 pr-3 font-medium">Suhu</th>
                <th className="py-2 pr-3 font-medium">Kelembapan</th>
                <th className="py-2 pr-3 font-medium">Amonia</th>
                <th className="py-2 pr-3 font-medium">THI</th>
                <th className="py-2 pr-3 font-medium">Status</th>
                <th className="py-2 pr-3 font-medium">Terkirim</th>
                <th className="py-2 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-gray-100 last:border-0">
                  <td className="py-2 pr-3 whitespace-nowrap">
                    {formatTanggalIndo(r.createdAt)}
                  </td>
                  <td className="py-2 pr-3">
                    <StatusBadge level={LEVEL[r.statusLabel] ?? 1} />
                  </td>
                  <td className="py-2 pr-3">{r.monitoringData?.suhu.toFixed(1) ?? "—"}</td>
                  <td className="py-2 pr-3">{r.monitoringData?.kelembapan.toFixed(1) ?? "—"}</td>
                  <td className="py-2 pr-3">{r.monitoringData?.amonia.toFixed(1) ?? "—"}</td>
                  <td className="py-2 pr-3">{r.monitoringData?.thi.toFixed(1) ?? "—"}</td>
                  <td className="py-2 pr-3">
                    {r.read ? (
                      <span className="text-xs text-gray-400">Terbaca</span>
                    ) : (
                      <span className="text-xs font-medium text-gray-700">Belum Dibaca</span>
                    )}
                  </td>
                  <td className="py-2 pr-3">
                    <Terkirim status={r.pushStatus} />
                  </td>
                  <td className="py-2">
                    {!r.read && (
                      <button
                        onClick={() => markRead(r.id)}
                        className="rounded-lg bg-[#10B981] px-3 py-1 text-xs font-semibold text-white transition hover:bg-[#0ea371]"
                      >
                        Tandai Terbaca
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
