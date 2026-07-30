import { type LucideIcon } from "lucide-react";

// Small rounded icon tile — light green background, green icon — matching the
// SLMS logo and the Suhu/Kelembapan/Amonia tiles on the Login page.
const SIZES = {
  sm: { box: "h-8 w-8 rounded-lg", icon: 16 },
  md: { box: "h-10 w-10 rounded-xl", icon: 20 },
  lg: { box: "h-12 w-12 rounded-2xl", icon: 24 },
} as const;

export default function IconBadge({
  icon: Icon,
  size = "md",
}: {
  icon: LucideIcon;
  size?: "sm" | "md" | "lg";
}) {
  const s = SIZES[size];
  return (
    <span className={`inline-flex shrink-0 items-center justify-center bg-[#ECFDF5] ${s.box}`}>
      <Icon size={s.icon} className="text-[#10B981]" aria-hidden />
    </span>
  );
}
