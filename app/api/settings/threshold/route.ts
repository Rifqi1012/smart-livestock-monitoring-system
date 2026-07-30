import { auth } from "@/auth";
import { thresholdService } from "@/lib/threshold-service";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  const threshold = await thresholdService.getThreshold();
  return Response.json({ success: true, data: threshold });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return Response.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ success: false, message: "Invalid JSON" }, { status: 400 });
  }

  const { thiMax, amoniaMax } = (body ?? {}) as Record<string, unknown>;
  const input = { thiMax: Number(thiMax), amoniaMax: Number(amoniaMax) };

  const error = thresholdService.validate(input);
  if (error) {
    return Response.json({ success: false, message: error }, { status: 400 });
  }

  const saved = await thresholdService.saveThreshold({
    ...input,
    updatedBy: session.user.name ?? session.user.username,
  });
  return Response.json({ success: true, data: saved });
}
