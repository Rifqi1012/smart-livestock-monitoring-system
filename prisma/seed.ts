import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const prisma = new PrismaClient({
  adapter: new PrismaMariaDb(process.env.DATABASE_URL as string),
});

async function main() {
  const username = "admin";
  const password = "admin123"; // ponytail: default dev password, change after first login

  await prisma.user.upsert({
    where: { username },
    update: {},
    create: {
      name: "Administrator",
      username,
      passwordHash: await bcrypt.hash(password, 10),
      role: "admin",
    },
  });

  console.log(`Seeded admin account → username: ${username}  password: ${password}`);

  await prisma.user.upsert({
    where: { username: "petugas1" },
    update: {},
    create: {
      name: "Petugas Kandang",
      username: "petugas1",
      passwordHash: await bcrypt.hash("petugas123", 10),
      role: "petugas_kandang",
    },
  });
  console.log("Seeded petugas account → username: petugas1  password: petugas123");

  const deviceId = "esp32-barn-01";
  const apiKey = process.env.DEVICE_API_KEY;
  if (!apiKey) throw new Error("DEVICE_API_KEY is not set in .env");

  await prisma.device.upsert({
    where: { deviceId },
    update: { apiKey },
    create: { deviceId, name: "Kandang Sapi 01", apiKey },
  });

  console.log(`Seeded device → deviceId: ${deviceId}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
