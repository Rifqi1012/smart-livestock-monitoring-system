import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return Response.json({ success: false, message: "Forbidden" }, { status: 403 });
  }
  const users = await prisma.user.findMany({
    select: { id: true, name: true, username: true, role: true },
    orderBy: { createdAt: "asc" },
  });
  return Response.json({ success: true, data: users });
}

export async function POST(req: Request) {
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

  const { name, username, password, role } = (body ?? {}) as Record<string, unknown>;
  if (typeof username !== "string" || !username.trim()) {
    return Response.json({ success: false, message: "Username wajib diisi" }, { status: 400 });
  }
  if (typeof password !== "string" || password.length < 6) {
    return Response.json({ success: false, message: "Password minimal 6 karakter" }, { status: 400 });
  }
  if (role !== "admin" && role !== "petugas_kandang") {
    return Response.json({ success: false, message: "Role tidak valid" }, { status: 400 });
  }

  const exists = await prisma.user.findUnique({ where: { username } });
  if (exists) {
    return Response.json({ success: false, message: "Username sudah digunakan" }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: {
      name: typeof name === "string" && name.trim() ? name : username,
      username,
      passwordHash: await bcrypt.hash(password, 10),
      role,
    },
    select: { id: true, name: true, username: true, role: true },
  });
  return Response.json({ success: true, data: user });
}
