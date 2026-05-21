import { prisma } from "./src/utils/prismaClient.js";

try {
  await prisma.$queryRaw`SELECT 1`;
  console.log("Prisma / Postgres connection OK");
} catch (e) {
  console.error("Connection failed:", e.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect().catch(() => {});
}
