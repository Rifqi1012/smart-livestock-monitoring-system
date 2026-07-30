"use client";

import { usePathname } from "next/navigation";

const TITLES: { prefix: string; title: string }[] = [
  { prefix: "/dashboard", title: "Dashboard" },
  { prefix: "/monitoring", title: "Monitoring" },
  { prefix: "/alerts", title: "Riwayat Alert" },
  { prefix: "/settings", title: "Pengaturan" },
];

// Top bar on every screen size: current page title. (Logout lives in the
// bottom dock now.)
export default function TopBar() {
  const pathname = usePathname();
  const title = TITLES.find((t) => pathname.startsWith(t.prefix))?.title ?? "SLMS";

  return (
    <header
      className="fixed inset-x-0 top-0 z-40 border-b border-[#E5E7EB] bg-white"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="flex h-14 items-center px-4">
        <span className="text-base font-semibold text-[#1F2937]">{title}</span>
      </div>
    </header>
  );
}
