"use client";

import { useEffect, useMemo, useState } from "react";
import { type Thresholds } from "@/lib/classifier";
import { explainStatus } from "@/lib/status-reason";
import { formatTanggalIndo } from "@/lib/format-date";
import StatusBadge from "@/components/StatusBadge";

const PAGE_SIZE = 15;

type Row = {
  id: string;
  suhu: number;
  kelembapan: number;
  amonia: number;
  thi: number;
  statusLevel: number;
  statusLabel: string;
  createdAt: string;
};

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function startOfWeek() {
  const d = startOfToday();
  const diff = (d.getDay() + 6) % 7; // Monday as first day of week
  d.setDate(d.getDate() - diff);
  return d;
}
function startOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

const PRESETS = [
  { key: "today", label: "Hari Ini", rangeLabel: "Hari ini", from: startOfToday },
  { key: "week", label: "Minggu Ini", rangeLabel: "Minggu ini", from: startOfWeek },
  { key: "month", label: "Bulan Ini", rangeLabel: "Bulan ini", from: startOfMonth },
] as const;

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function MonitoringSimple() {
  const [preset, setPreset] = useState<(typeof PRESETS)[number]>(PRESETS[0]);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [threshold, setThreshold] = useState<Thresholds | null>(null);

  useEffect(() => {
    fetch("/api/settings/threshold")
      .then((r) => r.json())
      .then((j) => j.data && setThreshold(j.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      const from = preset.from().toISOString();
      const to = new Date().toISOString();
      try {
        const res = await fetch(
          `/api/monitoring/history?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
          { signal: controller.signal },
        );
        const json = await res.json();
        setRows(json.data ?? []);
        setPage(1);
      } catch {
        if (!controller.signal.aborted) setRows([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [preset]);

  // "Hari ini kandang sempat Waspada 2 kali, kondisi sekarang Normal."
  const summary = useMemo(() => {
    if (rows.length === 0) return null;
    const waspada = rows.filter((r) => r.statusLabel === "waspada").length;
    const bahaya = rows.filter((r) => r.statusLabel === "bahaya").length;
    const parts: string[] = [];
    if (waspada > 0) parts.push(`Waspada ${waspada} kali`);
    if (bahaya > 0) parts.push(`Bahaya ${bahaya} kali`);
    const events = parts.length ? `sempat ${parts.join(" dan ")}` : "tidak pernah dalam kondisi peringatan";
    const current = cap(rows[0].statusLabel); // rows are newest-first
    return `${preset.rangeLabel} kandang ${events}, kondisi sekarang ${current}.`;
  }, [rows, preset]);

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <main className="space-y-5 p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-semibold text-[#1F2937]">Monitoring</h1>

      {/* Filter: 3 tombol saja, tanpa tanggal custom */}
      <section className="flex flex-wrap gap-2 rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPreset(p)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              preset.key === p.key
                ? "bg-[#10B981] text-white"
                : "border border-[#E5E7EB] bg-white text-[#6B7280] hover:bg-gray-50"
            }`}
          >
            {p.label}
          </button>
        ))}
      </section>

      {/* Ringkasan kalimat */}
      {summary && (
        <section className="rounded-2xl border border-[#E5E7EB] bg-white p-5 text-lg text-gray-800 shadow-sm">
          {summary}
        </section>
      )}

      {loading || !threshold ? (
        <p className="py-10 text-center text-sm text-gray-400">Memuat data...</p>
      ) : rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[#E5E7EB] bg-white py-16 text-center text-gray-500">
          Tidak ada data rentang yang dipilih
        </p>
      ) : (
        <section className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold">Riwayat Kondisi</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="py-2 pr-3 font-medium">Waktu</th>
                  <th className="py-2 pr-3 font-medium">Status Kandang</th>
                  <th className="py-2 font-medium">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((r) => (
                  <tr key={r.id} className="border-b border-gray-100 last:border-0">
                    <td className="py-2 pr-3 whitespace-nowrap">
                      {formatTanggalIndo(r.createdAt)}
                    </td>
                    <td className="py-2 pr-3">
                      <StatusBadge level={r.statusLevel as 0 | 1 | 2} />
                    </td>
                    <td className="py-2 text-gray-700">{explainStatus(r, threshold)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-gray-500">
              {rows.length} data · Halaman {page} dari {pageCount}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-md border border-gray-300 px-3 py-1 disabled:opacity-50"
              >
                Sebelumnya
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                disabled={page === pageCount}
                className="rounded-md border border-gray-300 px-3 py-1 disabled:opacity-50"
              >
                Berikutnya
              </button>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
