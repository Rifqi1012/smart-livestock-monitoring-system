"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/toast";

// VAPID public key is a URL-safe base64 string; PushManager needs a Uint8Array.
function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const output = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

export default function PushSubscribeButton() {
  // null = still checking on mount; then true/false = subscribed or not.
  const [subscribed, setSubscribed] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  // On load: reflect the browser's actual subscription state.
  useEffect(() => {
    async function check() {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setSubscribed(false);
        return;
      }
      // getRegistration() resolves with undefined if no SW yet (unlike `ready`).
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      setSubscribed(!!sub);
    }
    check().catch(() => setSubscribed(false));
  }, []);

  async function enable() {
    setBusy(true);
    try {
      // Service Worker / Push API only exist in a secure context (HTTPS or
      // localhost) — over http://<LAN-IP> navigator.serviceWorker is undefined.
      if (!window.isSecureContext) {
        throw new Error("Notifikasi butuh HTTPS. Buka lewat URL https (mis. tunnel), bukan http IP.");
      }
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        throw new Error("Browser tidak mendukung notifikasi push");
      }
      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!key) throw new Error("VAPID public key belum dikonfigurasi");

      const permission = await Notification.requestPermission();
      if (permission !== "granted") throw new Error("Izin notifikasi ditolak");

      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      });

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription),
      });
      if (!res.ok) throw new Error("Gagal menyimpan langganan di server");

      setSubscribed(true);
      toast("Notifikasi berhasil diaktifkan", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Terjadi kesalahan", "error");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.getSubscription();
      if (subscription) {
        const { endpoint } = subscription;
        await subscription.unsubscribe();
        // Remove the matching server record.
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint }),
        });
      }
      setSubscribed(false);
      toast("Notifikasi berhasil dimatikan", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Terjadi kesalahan", "error");
    } finally {
      setBusy(false);
    }
  }

  const label = busy
    ? "Memproses..."
    : subscribed === null
      ? "Memeriksa..."
      : subscribed
        ? "Matikan Notifikasi"
        : "Aktifkan Notifikasi";

  const cls = subscribed
    ? "border border-[#E5E7EB] bg-white text-[#6B7280] hover:bg-gray-50" // active → outline
    : "bg-[#10B981] text-white hover:bg-[#0ea371]"; // inactive → solid green

  return (
    <div>
      <button
        onClick={subscribed ? disable : enable}
        disabled={busy || subscribed === null}
        className={`rounded-xl px-4 py-2 text-sm font-semibold transition disabled:opacity-60 ${cls}`}
      >
        {label}
      </button>
    </div>
  );
}
