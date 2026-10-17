import { Prisma } from "../../generated/prisma/client.js";
import type { PrismaClient } from "../../generated/prisma/client.js";
import type { CreateProductInput, ProductListQuery } from "./product.schema.js";
import type { ProductRecord, ProductRepository } from "./product.service.js";

export class PrismaProductRepository implements ProductRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findMany(query: ProductListQuery): Promise<ProductRecord[]> {
    const products = await this.prisma.product.findMany({
      where: {
        ...(query.includeUnavailable === "true" ? {} : { isAvailable: true }),
        ...(query.category ? { category: query.category } : {}),
        ...(query.search
          ? {
              OR: [
                { name: { contains: query.search, mode: "insensitive" } },
                { description: { contains: query.search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    return products.map(toProductRecord);
  }

  async findById(id: string): Promise<ProductRecord | null> {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    return product ? toProductRecord(product) : null;
  }

  async create(input: CreateProductInput): Promise<ProductRecord> {
    const product = await this.prisma.product.create({
      data: {
        name: input.name,
        description: input.description ?? null,
        price: new Prisma.Decimal(input.price),
        category: input.category,
        imageUrl: input.imageUrl ?? null,
      },
    });

    return toProductRecord(product);
  }
}

function toProductRecord(
  product: Awaited<ReturnType<PrismaClient["product"]["findUniqueOrThrow"]>>,
): ProductRecord {
  return {
    ...product,
    price: product.price.toFixed(2),
  };
}
