// lib/prismadb.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prismadb = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV === "development") {
  globalForPrisma.prisma = prismadb;
}

export default prismadb;
