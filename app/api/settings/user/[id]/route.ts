import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return Response.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  // Don't let an admin delete their own account (avoid locking themselves out).
  if (id === session.user.id) {
    return Response.json(
      { success: false, message: "Tidak bisa menghapus akun sendiri" },
      { status: 400 },
    );
  }

  try {
    await prisma.user.delete({ where: { id } });
    return Response.json({ success: true });
  } catch {
    return Response.json({ success: false, message: "User tidak ditemukan" }, { status: 404 });
  }
}
