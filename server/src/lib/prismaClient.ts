import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";
import { configuration } from "../config/env.js";

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

const adapter = new PrismaPg({
  connectionString: configuration.databaseUrl,
});

export const prismaClient =
  globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prismaClient;
}
