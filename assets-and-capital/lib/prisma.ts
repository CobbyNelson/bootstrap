import { PrismaClient } from "@prisma/client";

// Prisma client singleton — avoids exhausting connections during dev HMR and
// on serverless. Uses DATABASE_URL (pooled) + DIRECT_URL (migrations) from env.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
