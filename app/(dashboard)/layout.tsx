import { auth } from "@/auth";
import BottomNav from "@/components/BottomNav";
import TopBar from "@/components/TopBar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const isAdmin = session?.user?.role === "admin";

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-[#1F2937]">
      {/* Top bar (title + logout) — shown on all screen sizes. */}
      <TopBar />
      {/* Padding so content clears the fixed top bar (+ safe area) and bottom nav. */}
      <div className="overflow-x-auto pt-[calc(3.5rem+env(safe-area-inset-top))] pb-[calc(6rem+env(safe-area-inset-bottom))]">
        {children}
      </div>
      {/* Bottom nav — shown on all screen sizes. */}
      <BottomNav isAdmin={isAdmin} />
    </div>
  );
}
