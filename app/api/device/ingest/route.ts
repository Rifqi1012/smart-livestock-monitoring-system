import { prisma } from "@/lib/prisma";
import { THICalculator } from "@/lib/thi-calculator";
import { Classifier } from "@/lib/classifier";
import { thresholdService } from "@/lib/threshold-service";
import { notifyIfNeeded } from "@/lib/push-service";
import { sensorBus } from "@/lib/sensor-bus";

const thiCalculator = new THICalculator();
const classifier = new Classifier();

const LED = ["hijau", "kuning", "merah"] as const;

export async function POST(req: Request) {
  // 1. Device auth: API key from header must match a registered Device.
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey) {
    return Response.json({ success: false, message: "Missing API key" }, { status: 401 });
  }
  const device = await prisma.device.findUnique({ where: { apiKey } });
  if (!device) {
    return Response.json({ success: false, message: "Invalid API key" }, { status: 401 });
  }

  // 2. Body validation.
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ success: false, message: "Invalid JSON" }, { status: 400 });
  }
  const { deviceId, temperature, humidity, ammonia, timestamp } = (body ?? {}) as Record<
    string,
    unknown
  >;

  if (typeof deviceId !== "string" || !deviceId) {
    return Response.json({ success: false, message: "deviceId is required" }, { status: 400 });
  }
  if (typeof timestamp !== "string" || !timestamp) {
    return Response.json({ success: false, message: "timestamp is required" }, { status: 400 });
  }
  const nums = { temperature, humidity, ammonia };
  for (const [key, val] of Object.entries(nums)) {
    if (typeof val !== "number" || Number.isNaN(val)) {
      return Response.json({ success: false, message: `${key} must be a number` }, { status: 400 });
    }
  }
  const suhu = temperature as number;
  const kelembapan = humidity as number;
  const amonia = ammonia as number;

  // 3. SAW classification (THI + Amonia). LED follows the combined index;
  //    relay is computed SEPARATELY and only follows ammonia.
  const { thiMax, amoniaMax } = await thresholdService.getThreshold();
  const thi = thiCalculator.calculate(suhu, kelembapan);
  const { ig, statusLevel, statusLabel } = classifier.calculateSAW(thi, amonia, thiMax, amoniaMax);
  const relayActive = classifier.checkRelay(amonia, amoniaMax);
  const message = `Kondisi kandang ${statusLabel.charAt(0).toUpperCase()}${statusLabel.slice(1)}`;

  // 4. Persist reading (including the combined index).
  const reading = await prisma.monitoringData.create({
    data: { suhu, kelembapan, amonia, thi, indeksGabungan: ig, statusLevel, statusLabel },
  });

  // 5. Waspada/Bahaya → log a Notification + fire push. Driven by statusLevel
  //    only — NOT by relayActive.
  if (statusLevel >= 1) {
    const notification = await prisma.notification.create({
      data: { monitoringDataId: reading.id, statusLabel, message },
    });
    await notifyIfNeeded(statusLevel, statusLabel, { suhu, kelembapan, amonia, thi }, notification.id);
  }

  // 6. Push the new reading to every open dashboard/alert (live, no refresh).
  sensorBus.broadcast({
    id: reading.id,
    suhu,
    kelembapan,
    amonia,
    thi,
    statusLevel,
    statusLabel,
    createdAt: reading.createdAt.toISOString(),
  });

  // 7. Response contract. `led` follows the SAW status; `relayActive` follows
  //    checkRelay() independently — neither drives the other.
  return Response.json({
    success: true,
    status: statusLabel,
    ig,
    led: LED[statusLevel],
    relayActive,
    message,
  });
}
