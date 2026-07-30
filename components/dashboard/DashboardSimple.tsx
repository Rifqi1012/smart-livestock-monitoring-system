"use client";

import { useEffect, useState } from "react";
import { Thermometer, Droplets, Wind, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { type StatusKey } from "@/components/status-visual";
import StatusHero from "@/components/StatusHero";
import MetricCard from "@/components/MetricCard";
import PushSubscribeButton from "@/components/PushSubscribeButton";
import type { StreamEvent } from "@/lib/sensor-bus";

// Simplified dashboard for petugas_kandang: big status hero, two raw values,
// a qualitative smell label, and a qualitative trend line.
export default function DashboardSimple({
  initialLatest,
  amoniaMax,
  trendText,
}: {
  initialLatest: StreamEvent | null;
  amoniaMax: number;
  trendText: string;
}) {
  const [latest, setLatest] = useState<StreamEvent | null>(initialLatest);

  useEffect(() => {
    const es = new EventSource("/api/stream");
    es.onmessage = (e) => setLatest(JSON.parse(e.data) as StreamEvent);
    return () => es.close();
  }, []);

  const status = (latest?.statusLabel as StatusKey) ?? "normal";
  // Amonia is qualitative here: "menyengat" once it reaches the configured max.
  const amoniaBahaya = latest ? latest.amonia >= amoniaMax : false;
  const bau = amoniaBahaya ? "Menyengat, Perlu Diperiksa" : "Normal";

  const TrendIcon = trendText.includes("Membaik")
    ? TrendingUp
    : trendText.includes("Memburuk")
      ? TrendingDown
      : Minus;

  return (
    <main className="space-y-5 p-4 sm:p-6 lg:p-8">
      {/* Push button stays and is the most visible control */}
      <div className="flex justify-end">
        <PushSubscribeButton />
      </div>

      {/* Dominant status hero */}
      <StatusHero status={status} updatedAt={latest?.createdAt ?? null} />

      {/* Two raw values only: Suhu + Kelembapan (2 columns on mobile) */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4">
        <MetricCard
          label="Suhu"
          value={latest ? latest.suhu.toFixed(1) : "—"}
          unit="°C"
          Icon={Thermometer}
        />
        <MetricCard
          label="Kelembapan"
          value={latest ? latest.kelembapan.toFixed(1) : "—"}
          unit="%"
          Icon={Droplets}
        />
      </section>

      {/* Qualitative smell + qualitative trend */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4">
        <div
          className={`rounded-2xl border p-4 shadow-sm sm:p-6 ${
            amoniaBahaya ? "border-red-200 bg-red-50" : "border-[#E5E7EB] bg-white"
          }`}
        >
          <div className="flex items-start justify-between">
            <p className="text-sm text-[#6B7280]">Bau Kandang</p>
            <Wind size={18} className="shrink-0" style={{ color: amoniaBahaya ? "#EF4444" : "#6B7280" }} />
          </div>
          <p className={`mt-2 font-semibold ${amoniaBahaya ? "text-red-700" : "text-[#1F2937]"}`}>
            {bau}
          </p>
        </div>

        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm sm:p-6">
          <div className="flex items-start justify-between">
            <p className="text-sm text-[#6B7280]">Tren</p>
            <TrendIcon size={18} className="shrink-0 text-[#6B7280]" />
          </div>
          <p className="mt-2 font-medium text-[#1F2937]">{trendText}</p>
        </div>
      </section>
    </main>
  );
}
