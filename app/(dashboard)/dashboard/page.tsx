import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { thresholdService } from "@/lib/threshold-service";
import DashboardDetailed from "@/components/dashboard/DashboardDetailed";
import DashboardSimple from "@/components/dashboard/DashboardSimple";
import { type TrendPoint } from "@/components/dashboard/TrendChart";
import type { StreamEvent } from "@/lib/sensor-bus";

// Initial load runs server-side; live updates arrive over SSE.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  const role = session?.user?.role;

  const latest = await prisma.monitoringData.findFirst({ orderBy: { createdAt: "desc" } });

  const initialLatest: StreamEvent | null = latest
    ? {
        id: latest.id,
        suhu: latest.suhu,
        kelembapan: latest.kelembapan,
        amonia: latest.amonia,
        thi: latest.thi,
        statusLevel: latest.statusLevel,
        statusLabel: latest.statusLabel as StreamEvent["statusLabel"],
        createdAt: latest.createdAt.toISOString(),
      }
    : null;

  // ── Simplified view for petugas_kandang ──────────────────────────────────
  if (role === "petugas_kandang") {
    const threshold = await thresholdService.getThreshold();
    const trendText = await computeTrendText(latest);
    return (
      <DashboardSimple
        initialLatest={initialLatest}
        amoniaMax={threshold.amoniaMax}
        trendText={trendText}
      />
    );
  }

  // ── Full view for admin (unchanged) ──────────────────────────────────────
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [trendRows, dayRows, alertCount] = await Promise.all([
    prisma.monitoringData.findMany({
      where: { createdAt: { gte: oneHourAgo } },
      orderBy: { createdAt: "asc" },
      select: { suhu: true, kelembapan: true, amonia: true, thi: true, createdAt: true },
    }),
    prisma.monitoringData.findMany({
      where: { createdAt: { gte: dayAgo } },
      select: { suhu: true, kelembapan: true, amonia: true, thi: true },
    }),
    prisma.notification.count({ where: { createdAt: { gte: dayAgo } } }),
  ]);

  const initialTrend: TrendPoint[] = trendRows.map((r) => ({
    time: r.createdAt.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    suhu: r.suhu,
    kelembapan: r.kelembapan,
    amonia: r.amonia,
    thi: r.thi,
  }));

  return (
    <DashboardDetailed
      initialLatest={initialLatest}
      initialTrend={initialTrend}
      dayRows={dayRows}
      alertCount={alertCount}
    />
  );
}

// Qualitative trend: compare the current statusLevel against the reading whose
// createdAt is closest to (now − 30 min).
async function computeTrendText(
  latest: { statusLevel: number } | null,
): Promise<string> {
  const prefix = "Kondisi 1 jam terakhir:";
  if (!latest) return `${prefix} Stabil`;

  const target = new Date(Date.now() - 30 * 60 * 1000);
  const [before, after] = await Promise.all([
    prisma.monitoringData.findFirst({
      where: { createdAt: { lte: target } },
      orderBy: { createdAt: "desc" },
      select: { statusLevel: true, createdAt: true },
    }),
    prisma.monitoringData.findFirst({
      where: { createdAt: { gte: target } },
      orderBy: { createdAt: "asc" },
      select: { statusLevel: true, createdAt: true },
    }),
  ]);

  const t = target.getTime();
  const ref =
    !before ? after
    : !after ? before
    : Math.abs(before.createdAt.getTime() - t) <= Math.abs(after.createdAt.getTime() - t)
      ? before
      : after;

  if (!ref) return `${prefix} Stabil`;
  if (latest.statusLevel > ref.statusLevel) return `${prefix} Memburuk`;
  if (latest.statusLevel < ref.statusLevel) return `${prefix} Membaik`;
  return `${prefix} Stabil`;
}
