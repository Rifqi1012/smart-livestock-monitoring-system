import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ success: false, message: "Invalid JSON" }, { status: 400 });
  }

  const { endpoint, keys } = (body ?? {}) as {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
  };
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return Response.json({ success: false, message: "Invalid subscription" }, { status: 400 });
  }

  // endpoint is unique → upsert so re-subscribing on the same browser is idempotent.
  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: { p256dh: keys.p256dh, auth: keys.auth, userId: session.user.id },
    create: { endpoint, p256dh: keys.p256dh, auth: keys.auth, userId: session.user.id },
  });

  return Response.json({ success: true });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ success: false, message: "Invalid JSON" }, { status: 400 });
  }

  const { endpoint } = (body ?? {}) as { endpoint?: string };
  if (!endpoint) {
    return Response.json({ success: false, message: "Endpoint required" }, { status: 400 });
  }

  // Scope to the logged-in user so an endpoint can only delete its own row.
  await prisma.pushSubscription.deleteMany({ where: { endpoint, userId: session.user.id } });

  return Response.json({ success: true });
}
