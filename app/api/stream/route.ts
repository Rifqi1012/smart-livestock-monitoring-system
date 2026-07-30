import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sensorBus, type StreamEvent } from "@/lib/sensor-bus";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Initial snapshot: push the latest reading the moment the connection opens.
  const latest = await prisma.monitoringData.findFirst({ orderBy: { createdAt: "desc" } });
  const initial: StreamEvent | undefined = latest
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
    : undefined;

  const stream = sensorBus.subscribe(initial);

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
