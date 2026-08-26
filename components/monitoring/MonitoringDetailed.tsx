"use client";

import { useEffect, useMemo, useState } from "react";
import { formatTanggalIndo } from "@/lib/format-date";
import StatusBadge from "@/components/StatusBadge";
import MetricLineChart, { type MetricPoint } from "@/components/monitoring/MetricLineChart";
import * as XLSX from "xlsx";
import { Download } from "lucide-react";

const PAGE_SIZE = 15;

type Row = {
  id: string;
  suhu: number;
  kelembapan: number;
  amonia: number;
  thi: number;
  indeksGabungan: number;
  statusLevel: number;
  statusLabel: string;
  createdAt: string;
};

function toInput(d: Date) {
  // yyyy-mm-dd in local time for <input type="date">
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 10);
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

const PRESETS = [
  { key: "today", label: "Hari Ini", from: () => new Date(), to: () => new Date() },
  { key: "7d", label: "7 Hari", from: () => daysAgo(6), to: () => new Date() },
  { key: "30d", label: "30 Hari", from: () => daysAgo(29), to: () => new Date() },
] as const;

export default function MonitoringDetailed() {
  const [fromDate, setFromDate] = useState(toInput(new Date()));
  const [toDate, setToDate] = useState(toInput(new Date()));
  const [preset, setPreset] = useState<string>("today");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      const from = `${fromDate}T00:00:00`;
      const to = `${toDate}T23:59:59`;
      try {
        const res = await fetch(
          `/api/monitoring/history?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
          { signal: controller.signal },
        );
        const json = await res.json();
        setRows(json.data ?? []);
        setPage(1);
      } catch (e) {
        if (!controller.signal.aborted) setRows([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [fromDate, toDate]);

  function applyPreset(p: (typeof PRESETS)[number]) {
    setPreset(p.key);
    setFromDate(toInput(p.from()));
    setToDate(toInput(p.to()));
  }

  // Averages over the selected range.
  const avg = useMemo(() => {
    if (rows.length === 0) return { suhu: 0, kelembapan: 0, amonia: 0 };
    const sum = rows.reduce(
      (a, r) => ({
        suhu: a.suhu + r.suhu,
        kelembapan: a.kelembapan + r.kelembapan,
        amonia: a.amonia + r.amonia,
      }),
      { suhu: 0, kelembapan: 0, amonia: 0 },
    );
    return {
      suhu: sum.suhu / rows.length,
      kelembapan: sum.kelembapan / rows.length,
      amonia: sum.amonia / rows.length,
    };
  }, [rows]);

  // Chart points in chronological order (rows arrive newest-first).
  const charts = useMemo(() => {
    const asc = [...rows].reverse();
    const pts = (key: keyof Row): MetricPoint[] =>
      asc.map((r) => ({
        time: new Date(r.createdAt).toLocaleString("id-ID", {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        }),
        value: r[key] as number,
      }));
    return { suhu: pts("suhu"), kelembapan: pts("kelembapan"), amonia: pts("amonia") };
  }, [rows]);

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleExportExcel = () => {
    if (rows.length === 0) return;

    const dataToExport = rows.map((r) => ({
      Waktu: formatTanggalIndo(r.createdAt),
      "Suhu (°C)": r.suhu,
      "Kelembapan (%)": r.kelembapan,
      "Amonia (ppm)": r.amonia,
      THI: r.thi,
      IG: r.indeksGabungan,
      Status: r.statusLabel,
    }));

    const ws = XLSX.utils.json_to_sheet([]);
    
    XLSX.utils.sheet_add_aoa(ws, [
      [`Data Monitoring SLMS - Periode: ${fromDate} sampai ${toDate}`],
      [],
    ], { origin: "A1" });

    XLSX.utils.sheet_add_json(ws, dataToExport, { origin: "A3" });

    ws["!cols"] = [
      { wch: 25 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 20 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Historis");

    const fileName = `Data_Monitoring_SLMS_${fromDate}_to_${toDate}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  return (
    <main className="space-y-5 p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-semibold text-[#1F2937]">Monitoring</h1>

      {/* Filter rentang waktu */}
      <section className="flex flex-wrap items-end gap-3 rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
        <div className="flex gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => applyPreset(p)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                preset === p.key
                  ? "bg-[#10B981] text-white"
                  : "border border-[#E5E7EB] bg-white text-[#6B7280] hover:bg-gray-50"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <label className="flex flex-col text-xs text-gray-500">
          Dari Tanggal
          <input
            type="date"
            value={fromDate}
            max={toDate}
            onChange={(e) => {
              setFromDate(e.target.value);
              setPreset("custom");
            }}
            className="mt-1 rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900"
          />
        </label>
        <label className="flex flex-col text-xs text-gray-500">
          Sampai Tanggal
          <input
            type="date"
            value={toDate}
            min={fromDate}
            onChange={(e) => {
              setToDate(e.target.value);
              setPreset("custom");
            }}
            className="mt-1 rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900"
          />
        </label>
      </section>

      {/* Ringkasan rata-rata */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Rata-rata Suhu", value: avg.suhu, unit: "°C" },
          { label: "Rata-rata Kelembapan", value: avg.kelembapan, unit: "%" },
          { label: "Rata-rata Amonia", value: avg.amonia, unit: "ppm" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className="mt-2 text-2xl font-semibold">
              {rows.length ? s.value.toFixed(1) : "—"}
              <span className="ml-1 text-base font-normal text-gray-400">{s.unit}</span>
            </p>
          </div>
        ))}
      </section>

      {loading ? (
        <p className="py-10 text-center text-sm text-gray-400">Memuat data...</p>
      ) : rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[#E5E7EB] bg-white py-16 text-center text-gray-500">
          Tidak ada data rentang yang dipilih
        </p>
      ) : (
        <>
          {/* Grafik tren terpisah */}
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
              <h2 className="mb-2 text-sm font-semibold">Suhu (°C)</h2>
              <MetricLineChart data={charts.suhu} name="Suhu" color="#10B981" />
            </div>
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
              <h2 className="mb-2 text-sm font-semibold">Kelembapan (%)</h2>
              <MetricLineChart data={charts.kelembapan} name="Kelembapan" color="#3B82F6" />
            </div>
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
              <h2 className="mb-2 text-sm font-semibold">Amonia (ppm)</h2>
              <MetricLineChart data={charts.amonia} name="Amonia" color="#F59E0B" />
            </div>
          </section>

          {/* Tabel data historis */}
          <section className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Data Historis</h2>
              <button
                onClick={handleExportExcel}
                disabled={rows.length === 0}
                className="flex items-center gap-2 rounded-md bg-[#10B981] px-3 py-1.5 text-sm font-medium text-white transition hover:bg-[#059669] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="h-4 w-4" />
                Export Excel
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-500">
                    <th className="py-2 pr-3 font-medium">Waktu</th>
                    <th className="py-2 pr-3 font-medium">Suhu</th>
                    <th className="py-2 pr-3 font-medium">Kelembapan</th>
                    <th className="py-2 pr-3 font-medium">Amonia</th>
                    <th className="py-2 pr-3 font-medium">THI</th>
                    <th className="py-2 pr-3 font-medium">IG</th>
                    <th className="py-2 font-medium">Status Kandang</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((r) => (
                    <tr key={r.id} className="border-b border-gray-100 last:border-0">
                      <td className="py-2 pr-3 whitespace-nowrap">
                        {formatTanggalIndo(r.createdAt)}
                      </td>
                      <td className="py-2 pr-3">{r.suhu.toFixed(1)}</td>
                      <td className="py-2 pr-3">{r.kelembapan.toFixed(1)}</td>
                      <td className="py-2 pr-3">{r.amonia.toFixed(1)}</td>
                      <td className="py-2 pr-3">{r.thi.toFixed(1)}</td>
                      <td className="py-2 pr-3">{r.indeksGabungan.toFixed(1)}</td>
                      <td className="py-2">
                        <StatusBadge level={r.statusLevel as 0 | 1 | 2} />
                      </td>
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
        </>
      )}
    </main>
  );
}
