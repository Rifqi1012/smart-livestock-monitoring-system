import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const MAX_ROWS = 5000; // ponytail: hard cap; add server-side pagination if a range ever exceeds this

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  // Default range: today.
  const now = new Date();
  const from = fromParam ? new Date(fromParam) : new Date(now.setHours(0, 0, 0, 0));
  const to = toParam ? new Date(toParam) : new Date();

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return Response.json({ success: false, message: "Invalid date range" }, { status: 400 });
  }

  const data = await prisma.monitoringData.findMany({
    where: { createdAt: { gte: from, lte: to } },
    orderBy: { createdAt: "desc" },
    take: MAX_ROWS,
  });

  return Response.json({ success: true, data });
}
