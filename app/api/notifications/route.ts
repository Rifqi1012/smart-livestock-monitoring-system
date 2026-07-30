import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/app/generated/prisma/client";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const jenis = searchParams.get("jenis"); // waspada | bahaya | semua | null
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  const where: Prisma.NotificationWhereInput = {};
  if (jenis === "waspada" || jenis === "bahaya") where.statusLabel = jenis;

  if (fromParam || toParam) {
    const from = fromParam ? new Date(fromParam) : undefined;
    const to = toParam ? new Date(toParam) : undefined;
    if ((from && Number.isNaN(from.getTime())) || (to && Number.isNaN(to.getTime()))) {
      return Response.json({ success: false, message: "Invalid date range" }, { status: 400 });
    }
    where.createdAt = { ...(from && { gte: from }), ...(to && { lte: to }) };
  }

  const data = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { monitoringData: true },
    take: 1000,
  });

  return Response.json({ success: true, data });
}
