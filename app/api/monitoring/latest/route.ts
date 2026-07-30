import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const latest = await prisma.monitoringData.findFirst({
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ success: true, data: latest });
}
