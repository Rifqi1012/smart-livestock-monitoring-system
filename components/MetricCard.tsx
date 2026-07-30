import { type LucideIcon } from "lucide-react";
import IconBadge from "@/components/ui/icon-badge";

// White rounded card with an IconBadge in the corner. Used for raw metric
// values (Suhu, Kelembapan, Amonia, THI) and qualitative info cards.
export default function MetricCard({
  label,
  value,
  unit,
  Icon,
}: {
  label: string;
  value: string;
  unit?: string;
  Icon: LucideIcon;
}) {
  return (
    <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm sm:p-6">
      <div className="flex items-start justify-between">
        <p className="text-sm text-[#6B7280]">{label}</p>
        <IconBadge icon={Icon} size="sm" />
      </div>
      <p className="mt-2 text-2xl font-semibold text-[#1F2937]">
        {value}
        {unit && <span className="ml-1 text-base font-normal text-[#9CA3AF]">{unit}</span>}
      </p>
    </div>
  );
}
