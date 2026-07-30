import { CheckCircle2, AlertTriangle, ShieldAlert } from "lucide-react";

// Level → colored pill with a small icon. Levels: 0 Normal, 1 Waspada, 2 Bahaya.
const MAP = {
  0: { label: "Normal", cls: "bg-emerald-100 text-emerald-700", Icon: CheckCircle2 },
  1: { label: "Waspada", cls: "bg-amber-100 text-amber-700", Icon: AlertTriangle },
  2: { label: "Bahaya", cls: "bg-red-100 text-red-700", Icon: ShieldAlert },
} as const;

export default function StatusBadge({ level }: { level: 0 | 1 | 2 }) {
  const s = MAP[level];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${s.cls}`}
    >
      <s.Icon size={13} aria-hidden />
      {s.label}
    </span>
  );
}
