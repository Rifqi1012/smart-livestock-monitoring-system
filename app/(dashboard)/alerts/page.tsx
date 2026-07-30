import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatTanggalIndo } from "@/lib/format-date";
import AlertsTable from "@/components/alerts/AlertsTable";
import AlertsTableSimple from "@/components/alerts/AlertsTableSimple";

export const dynamic = "force-dynamic";

export default async function AlertsPage() {
  const session = await auth();
  const isPetugas = session?.user?.role === "petugas_kandang";

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [todayCount, weekCount, latest] = await Promise.all([
    prisma.notification.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.notification.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.notification.findFirst({ orderBy: { createdAt: "desc" } }),
  ]);

  const latestSummary = latest
    ? `${latest.statusLabel.charAt(0).toUpperCase()}${latest.statusLabel.slice(1)} · ${formatTanggalIndo(latest.createdAt)}`
    : "Belum ada alert";

  const cards = [
    { label: "Alert Hari Ini", value: String(todayCount) },
    { label: "Alert 7 Hari Terakhir", value: String(weekCount) },
    { label: "Alert Terakhir", value: latestSummary },
  ];

  return (
    <main className="space-y-5 p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-semibold text-[#1F2937]">Riwayat Alert</h1>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm sm:p-6">
            <p className="text-sm text-[#6B7280]">{c.label}</p>
            <p className="mt-2 text-xl font-semibold text-[#1F2937]">{c.value}</p>
          </div>
        ))}
      </section>

      {isPetugas ? <AlertsTableSimple /> : <AlertsTable />}
    </main>
  );
}
