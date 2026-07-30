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

export type MetricPoint = { time: string; value: number };

export default function MetricLineChart({
  data,
  name,
  color,
}: {
  data: MetricPoint[];
  name: string;
  color: string;
}) {
  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="#9ca3af" minTickGap={24} />
          <YAxis tick={{ fontSize: 10 }} stroke="#9ca3af" />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
          <Line
            type="monotone"
            dataKey="value"
            name={name}
            stroke={color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
