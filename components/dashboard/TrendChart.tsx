"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type TrendPoint = {
  time: string;
  suhu: number;
  kelembapan: number;
  amonia: number;
  thi: number;
};

const SERIES = [
  { key: "suhu", name: "Suhu (°C)", color: "#10B981" },
  { key: "kelembapan", name: "Kelembapan (%)", color: "#3B82F6" },
  { key: "amonia", name: "Amonia (ppm)", color: "#F59E0B" },
  { key: "thi", name: "THI", color: "#EF4444" },
] as const;

export default function TrendChart({ data }: { data: TrendPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-gray-400">
        Belum ada data untuk 1 jam terakhir
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="time" tick={{ fontSize: 11 }} stroke="#9ca3af" />
          <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
          {SERIES.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
