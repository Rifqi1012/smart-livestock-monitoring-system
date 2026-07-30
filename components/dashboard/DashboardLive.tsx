"use client";

import { useEffect, useRef, useState } from "react";
import { Thermometer, Droplets, Wind, Gauge, type LucideIcon } from "lucide-react";
import TrendChart, { type TrendPoint } from "@/components/dashboard/TrendChart";
import { type StatusKey } from "@/components/status-visual";
import StatusHero from "@/components/StatusHero";
import MetricCard from "@/components/MetricCard";
import type { StreamEvent } from "@/lib/sensor-bus";

const fmt = (n: number) => n.toFixed(1);
const MAX_POINTS = 120; // keep the live chart bounded

function toPoint(d: StreamEvent): TrendPoint {
  return {
    time: new Date(d.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    suhu: d.suhu,
    kelembapan: d.kelembapan,
    amonia: d.amonia,
    thi: d.thi,
  };
}

export default function DashboardLive({
  initialLatest,
  initialTrend,
}: {
  initialLatest: StreamEvent | null;
  initialTrend: TrendPoint[];
}) {
  const [latest, setLatest] = useState<StreamEvent | null>(initialLatest);
  const [trend, setTrend] = useState<TrendPoint[]>(initialTrend);
  const lastId = useRef<string | undefined>(initialLatest?.id);

  useEffect(() => {
    const es = new EventSource("/api/stream");
    es.onmessage = (e) => {
      const d = JSON.parse(e.data) as StreamEvent;
      setLatest(d);
      // Skip the initial-snapshot echo (same id as the last row we already have).
      if (d.id !== lastId.current) {
        lastId.current = d.id;
        setTrend((prev) => [...prev, toPoint(d)].slice(-MAX_POINTS));
      }
    };
    // EventSource auto-reconnects on transient errors; nothing to do here.
    return () => es.close();
  }, []);

  const status = (latest?.statusLabel as StatusKey) ?? "normal";
  const metrics: { label: string; value: string; unit: string; Icon: LucideIcon }[] = [
    { label: "Suhu", value: latest ? fmt(latest.suhu) : "—", unit: "°C", Icon: Thermometer },
    { label: "Kelembapan", value: latest ? fmt(latest.kelembapan) : "—", unit: "%", Icon: Droplets },
    { label: "Amonia", value: latest ? fmt(latest.amonia) : "—", unit: "ppm", Icon: Wind },
    { label: "THI", value: latest ? fmt(latest.thi) : "—", unit: "", Icon: Gauge },
  ];

  return (
    <>
      {/* Status kandang terkini (hero) */}
      <StatusHero status={status} updatedAt={latest?.createdAt ?? null} />

      {/* 4 kartu metrik (2 kolom di mobile) */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {metrics.map((m) => (
          <MetricCard key={m.label} label={m.label} value={m.value} unit={m.unit} Icon={m.Icon} />
        ))}
      </section>

      {/* Grafik tren 1 jam (live) */}
      <section className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm sm:p-6">
        <h2 className="mb-3 text-lg font-semibold text-[#1F2937]">Tren 1 Jam Terakhir</h2>
        <TrendChart data={trend} />
      </section>
    </>
  );
}
