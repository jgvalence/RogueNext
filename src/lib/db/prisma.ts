import { PrismaClient } from "@prisma/client";
import { env } from "@/lib/env";

/**
 * Prisma Client Singleton
 *
 * This ensures we don't create multiple instances of PrismaClient
 * during development (hot reloading), which would exhaust the database connections.
 *
 * @see https://www.prisma.io/docs/guides/other/troubleshooting-orm/help-articles/nextjs-prisma-client-dev-practices
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * Helper to exclude fields from Prisma results
 *
 * Usage:
 * const userWithoutPassword = exclude(user, ['password'])
 */
export function exclude<T, Key extends keyof T>(
  model: T,
  keys: Key[]
): Omit<T, Key> {
  const result = { ...model };
  for (const key of keys) {
    delete result[key];
  }
  return result;
}
