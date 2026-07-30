import PushSubscribeButton from "@/components/PushSubscribeButton";
import DashboardLive from "@/components/dashboard/DashboardLive";
import { type TrendPoint } from "@/components/dashboard/TrendChart";
import type { StreamEvent } from "@/lib/sensor-bus";

type Metric = "suhu" | "kelembapan" | "amonia" | "thi";

function summarize(rows: Record<Metric, number>[], key: Metric) {
  if (rows.length === 0) return { avg: 0, min: 0, max: 0 };
  const vals = rows.map((r) => r[key]);
  return {
    avg: vals.reduce((a, b) => a + b, 0) / vals.length,
    min: Math.min(...vals),
    max: Math.max(...vals),
  };
}

const fmt = (n: number, unit = "") => `${n.toFixed(1)}${unit}`;

// Full admin dashboard — 4 metric cards, live 1h trend chart, 24h summary.
export default function DashboardDetailed({
  initialLatest,
  initialTrend,
  dayRows,
  alertCount,
}: {
  initialLatest: StreamEvent | null;
  initialTrend: TrendPoint[];
  dayRows: Record<Metric, number>[];
  alertCount: number;
}) {
  const summaryUnits: Record<Metric, string> = { suhu: "°C", kelembapan: "%", amonia: " ppm", thi: "" };

  return (
    <main className="space-y-5 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-[#1F2937]">Dashboard</h1>
        <PushSubscribeButton />
      </div>

      {/* Status card + metric cards + live trend chart (updates over SSE) */}
      <DashboardLive initialLatest={initialLatest} initialTrend={initialTrend} />

      {/* Ringkasan 24 jam (initial load snapshot) */}
      <section className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#1F2937]">Ringkasan 24 Jam Terakhir</h2>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700">
            {alertCount} peringatan
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="py-2 pr-4 font-medium">Parameter</th>
                <th className="py-2 pr-4 font-medium">Rata-rata</th>
                <th className="py-2 pr-4 font-medium">Min</th>
                <th className="py-2 font-medium">Max</th>
              </tr>
            </thead>
            <tbody>
              {(["suhu", "kelembapan", "amonia", "thi"] as Metric[]).map((key) => {
                const s = summarize(dayRows, key);
                const u = summaryUnits[key];
                const label = { suhu: "Suhu", kelembapan: "Kelembapan", amonia: "Amonia", thi: "THI" }[key];
                return (
                  <tr key={key} className="border-b border-gray-100 last:border-0">
                    <td className="py-2 pr-4 font-medium">{label}</td>
                    <td className="py-2 pr-4">{dayRows.length ? fmt(s.avg, u) : "—"}</td>
                    <td className="py-2 pr-4">{dayRows.length ? fmt(s.min, u) : "—"}</td>
                    <td className="py-2">{dayRows.length ? fmt(s.max, u) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
