import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Mark a notification as read (Tandai Terbaca). Next 16: params is a Promise.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Body optional; default action is to mark read. Accept { read: boolean } too.
  let read = true;
  try {
    const body = await req.json();
    if (typeof body?.read === "boolean") read = body.read;
  } catch {
    // no body → default read = true
  }

  try {
    const updated = await prisma.notification.update({ where: { id }, data: { read } });
    return Response.json({ success: true, data: updated });
  } catch {
    return Response.json({ success: false, message: "Notification not found" }, { status: 404 });
  }
}
