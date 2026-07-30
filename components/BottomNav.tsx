"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LayoutDashboard, LineChart, Bell, Settings, LogOut, type LucideIcon } from "lucide-react";
import ConfirmDialog from "@/components/ConfirmDialog";

const NAV: { href: string; label: string; Icon: LucideIcon; adminOnly?: boolean }[] = [
  { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/monitoring", label: "Monitoring", Icon: LineChart },
  { href: "/alerts", label: "Alert", Icon: Bell },
  { href: "/settings", label: "Settings", Icon: Settings, adminOnly: true },
];

const ACTIVE = "#10B981";
const INACTIVE = "#9CA3AF";

// Floating liquid-glass dock pill, shown on every screen size. Icon-only, with a
// magnify on the active item, plus a logout action at the end.
export default function BottomNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const items = NAV.filter((n) => !n.adminOnly || isAdmin);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)" }}
    >
      <div className="flex items-center gap-8 rounded-full border border-white/50 bg-white/70 px-8 py-3 shadow-[0_10px_35px_rgba(0,0,0,0.18)] backdrop-blur-2xl">
        {items.map((n) => {
          const active = pathname === n.href || pathname.startsWith(n.href + "/");
          return (
            <Link
              key={n.href}
              href={n.href}
              aria-label={n.label}
              className={`transition-transform duration-200 ${active ? "scale-125" : "scale-100"}`}
            >
              <n.Icon size={24} style={{ color: active ? ACTIVE : INACTIVE }} aria-hidden />
            </Link>
          );
        })}

        {/* Divider between navigation and the logout action. */}
        <span className="h-6 w-px bg-black/10" aria-hidden />

        <ConfirmDialog
          title="Keluar dari Aplikasi?"
          description="Anda perlu login kembali untuk mengakses dashboard."
          confirmText="Ya, Keluar"
          cancelText="Batal"
          variant="destructive"
          onConfirm={() => signOut({ callbackUrl: "/login" })}
          trigger={
            <button
              aria-label="Keluar"
              className="transition-transform duration-200 hover:scale-110"
            >
              <LogOut size={24} style={{ color: INACTIVE }} aria-hidden />
            </button>
          }
        />
      </div>
    </nav>
  );
}
