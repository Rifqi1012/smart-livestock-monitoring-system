import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { thresholdService } from "@/lib/threshold-service";
import ThresholdForm from "@/components/settings/ThresholdForm";
import UserManagement from "@/components/settings/UserManagement";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();
  // Defense in depth — proxy.ts already blocks non-admins, but guard here too.
  if (session?.user?.role !== "admin") redirect("/dashboard");

  const [threshold, users] = await Promise.all([
    thresholdService.getThreshold(),
    prisma.user.findMany({
      select: { id: true, name: true, username: true, role: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return (
    <main className="space-y-8 p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-semibold text-[#1F2937]">Pengaturan</h1>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-[#1F2937]">Kelola Threshold</h2>
        <ThresholdForm
          initial={{
            thiMax: threshold.thiMax,
            amoniaMax: threshold.amoniaMax,
            updatedBy: threshold.updatedBy,
            updatedAt: threshold.updatedAt.toISOString(),
          }}
        />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-[#1F2937]">Kelola User</h2>
        <UserManagement initialUsers={users} currentUserId={session.user.id} />
      </section>
    </main>
  );
}
