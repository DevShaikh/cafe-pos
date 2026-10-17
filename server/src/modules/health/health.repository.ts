import type { PrismaClient } from "../../generated/prisma/client.js";
import type { DatabaseHealthRepository } from "./health.service.js";

export class PrismaHealthRepository implements DatabaseHealthRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async checkConnection(): Promise<void> {
    await this.prisma.$queryRaw`SELECT 1`;
  }
}
