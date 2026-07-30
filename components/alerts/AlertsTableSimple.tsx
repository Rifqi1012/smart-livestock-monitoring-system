"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { type Thresholds } from "@/lib/classifier";
import { explainStatus } from "@/lib/status-reason";
import { formatTanggalIndo } from "@/lib/format-date";
import { useToast } from "@/components/ui/toast";
import StatusBadge from "@/components/StatusBadge";
import type { StreamEvent } from "@/lib/sensor-bus";

type Alert = {
  id: string;
  statusLabel: "waspada" | "bahaya";
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

// Simplified alert list for petugas_kandang: jenis filter only (no date range),
// no delivery status, no raw parameter values — just a plain-language reason.
export default function AlertsTableSimple() {
  const router = useRouter();
  const [jenis, setJenis] = useState("semua");
  const [rows, setRows] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [threshold, setThreshold] = useState<Thresholds | null>(null);
  const toast = useToast();

  useEffect(() => {
    fetch("/api/settings/threshold")
      .then((r) => r.json())
      .then((j) => j.data && setThreshold(j.data))
      .catch(() => {});
  }, []);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      const qs = new URLSearchParams();
      if (jenis !== "semua") qs.set("jenis", jenis);
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
    [jenis],
  );

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  // Live: a new alert re-runs the filtered query and refreshes summary cards.
  const loadRef = useRef(load);
  loadRef.current = load;
  useEffect(() => {
    const es = new EventSource("/api/stream");
    let first = true;
    es.onmessage = (e) => {
      const d = JSON.parse(e.data) as StreamEvent;
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
      {/* Filter: jenis saja (pill buttons) */}
      <div className="flex flex-wrap gap-2 rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
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

      {loading || !threshold ? (
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
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="py-2 pr-3 font-medium">Waktu</th>
                <th className="py-2 pr-3 font-medium">Jenis Alert</th>
                <th className="py-2 pr-3 font-medium">Keterangan</th>
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
                  <td className="py-2 pr-3 text-gray-700">
                    {r.monitoringData ? explainStatus(r.monitoringData, threshold) : "—"}
                  </td>
                  <td className="py-2">
                    {r.read ? (
                      <span className="text-xs text-gray-400">Terbaca</span>
                    ) : (
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
