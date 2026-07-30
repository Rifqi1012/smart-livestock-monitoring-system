import { STATUS_VISUAL, type StatusKey } from "@/components/status-visual";
import { formatTanggalIndo } from "@/lib/format-date";

// Hero status card — the most prominent element on the dashboard. Solid status
// color, large lucide icon, bold status title, and action guidance.
export default function StatusHero({
  status,
  updatedAt,
}: {
  status: StatusKey;
  updatedAt?: string | null;
}) {
  const { title, guidance, hex, Icon } = STATUS_VISUAL[status];

  return (
    <section
      className="flex items-center gap-5 rounded-2xl p-6 text-white shadow-sm sm:p-8"
      style={{ backgroundColor: hex }}
    >
      <Icon size={48} strokeWidth={2} className="shrink-0 text-white" aria-hidden />
      <div className="min-w-0">
        <p className="text-2xl font-bold tracking-wide sm:text-3xl">{title}</p>
        <p className="mt-1 text-sm text-white/85 sm:text-base">{guidance}</p>
        {updatedAt && (
          <p className="mt-2 text-xs text-white/75">
            Pembaruan terakhir: {formatTanggalIndo(updatedAt)}
          </p>
        )}
      </div>
    </section>
  );
}
