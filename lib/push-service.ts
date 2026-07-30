import webpush from "web-push";
import { prisma } from "@/lib/prisma";
import type { StatusLabel } from "@/lib/classifier";

// Capture the key THIS module instance loaded with. If a hot-reload leaves a
// stale module around, the logged key won't match the current .env — that's the
// signal we print on every notifyIfNeeded() call (see below).
const ACTIVE_VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY ?? "";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || "mailto:admin@slms.local",
  ACTIVE_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY as string,
);

// Cap each send so an unreachable push endpoint can't hang forever (which would
// leave the notification stuck at "pending"). A timeout rejects → we catch it.
const SEND_TIMEOUT_MS = 10_000;

type PushSub = { id: string; endpoint: string; p256dh: string; auth: string };

type Payload = { title: string; body: string; status: StatusLabel };

type SendResult = { ok: boolean; deadId?: string; error?: string };

// Send one push. Never throws — every outcome is captured in the result so the
// caller can always record a terminal delivery status.
export async function sendPushNotification(
  subscription: PushSub,
  payload: Payload,
): Promise<SendResult> {
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      JSON.stringify(payload),
      { timeout: SEND_TIMEOUT_MS },
    );
    return { ok: true };
  } catch (err) {
    const statusCode = (err as { statusCode?: number }).statusCode;
    const message = err instanceof Error ? err.message : String(err);
    // 404 Not Found / 410 Gone → subscription is dead, prune it.
    if (statusCode === 404 || statusCode === 410) {
      return { ok: false, deadId: subscription.id, error: `${statusCode} ${message}` };
    }
    // Any other error → do NOT delete; report it so status becomes "failed".
    console.error(`[push] send failed (status ${statusCode ?? "?"}): ${message}`);
    return { ok: false, error: statusCode ? `${statusCode} ${message}` : message };
  }
}

// Fan out a status alert to every registered subscription (admin + petugas).
// Guarantees the notification ends in a terminal state ("sent" or "failed") —
// never stuck at "pending" — recording the error message when delivery fails.
export async function notifyIfNeeded(
  level: number,
  statusLabel: StatusLabel,
  monitoringData: { suhu: number; kelembapan: number; amonia: number; thi: number },
  notificationId?: string,
): Promise<void> {
  if (level < 1) return;

  // Print the key this module is actually using, to compare against .env and
  // rule out a stale hot-reloaded module holding an old VAPID key.
  console.log(`[push] active VAPID_PUBLIC_KEY (module): ${ACTIVE_VAPID_PUBLIC_KEY.slice(0, 10)}…`);

  let pushStatus = "failed";
  let deliveryError: string | null = null;

  try {
    // Send to every subscription regardless of role (admin + petugas_kandang).
    const subs = await prisma.pushSubscription.findMany({
      select: { id: true, endpoint: true, p256dh: true, auth: true },
    });

    if (subs.length === 0) {
      deliveryError = "Tidak ada subscription aktif";
    } else {
      const title = `Peringatan: Kondisi Kandang ${statusLabel.charAt(0).toUpperCase()}${statusLabel.slice(1)}`;
      const body =
        `Suhu ${monitoringData.suhu}°C, Kelembapan ${monitoringData.kelembapan}%, ` +
        `Amonia ${monitoringData.amonia} ppm, THI ${monitoringData.thi.toFixed(1)}`;
      const payload: Payload = { title, body, status: statusLabel };

      const results = await Promise.all(subs.map((s) => sendPushNotification(s, payload)));

      // Prune dead subscriptions (404/410 only).
      const dead = results.map((r) => r.deadId).filter((id): id is string => !!id);
      if (dead.length > 0) {
        await prisma.pushSubscription.deleteMany({ where: { id: { in: dead } } });
      }

      if (results.some((r) => r.ok)) {
        pushStatus = "sent";
        deliveryError = null;
      } else {
        pushStatus = "failed";
        deliveryError = results.find((r) => r.error)?.error ?? "Semua pengiriman gagal";
      }
    }
  } catch (err) {
    // Unexpected failure (DB query, prune, etc.) — still record it, don't hang.
    pushStatus = "failed";
    deliveryError = err instanceof Error ? err.message : String(err);
    console.error("[push] notifyIfNeeded failed:", err);
  } finally {
    if (notificationId) {
      try {
        await prisma.notification.update({
          where: { id: notificationId },
          data: { pushStatus, deliveryError },
        });
      } catch (e) {
        console.error("[push] could not update notification delivery status:", e);
      }
    }
  }
}
