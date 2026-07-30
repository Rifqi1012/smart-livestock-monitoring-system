import { CheckCircle2, AlertTriangle, ShieldAlert, type LucideIcon } from "lucide-react";

export type StatusKey = "normal" | "waspada" | "bahaya";

// Single source of truth for status visuals (icon + copy + color) across the app.
export const STATUS_VISUAL: Record<
  StatusKey,
  { title: string; guidance: string; hex: string; Icon: LucideIcon; badge: string }
> = {
  normal: {
    title: "KANDANG AMAN",
    guidance: "Kondisi kandang baik, tidak perlu tindakan",
    hex: "#10B981",
    Icon: CheckCircle2,
    badge: "bg-emerald-100 text-emerald-700",
  },
  waspada: {
    title: "KANDANG PERLU DIPERIKSA",
    guidance: "Periksa kandang, buka ventilasi jika perlu",
    hex: "#F59E0B",
    Icon: AlertTriangle,
    badge: "bg-amber-100 text-amber-700",
  },
  bahaya: {
    title: "KANDANG BAHAYA",
    guidance: "Segera periksa kandang dan buka ventilasi tambahan",
    hex: "#EF4444",
    Icon: ShieldAlert,
    badge: "bg-red-100 text-red-700",
  },
};

export const LEVEL_TO_KEY: Record<number, StatusKey> = { 0: "normal", 1: "waspada", 2: "bahaya" };
