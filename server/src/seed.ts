import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "./generated/prisma/client.js";
import { configuration } from "./config.js";

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: configuration.databaseUrl,
  }),
});

const demoProducts = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    name: "Demo Espresso",
    description: "Demo item for local development; replace with your menu.",
    price: new Prisma.Decimal("2.50"),
    category: "Demo Coffee",
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    name: "Demo Cappuccino",
    description: "Demo item for local development; replace with your menu.",
    price: new Prisma.Decimal("3.75"),
    category: "Demo Coffee",
  },
  {
    id: "00000000-0000-4000-8000-000000000003",
    name: "Demo Latte",
    description: "Demo item for local development; replace with your menu.",
    price: new Prisma.Decimal("4.00"),
    category: "Demo Coffee",
  },
] satisfies Prisma.ProductCreateManyInput[];

async function seedDemoProducts(): Promise<void> {
  try {
    const result = await prisma.product.createMany({
      data: demoProducts,
      skipDuplicates: true,
    });

    console.info(
      `Inserted ${result.count} demo product(s); existing rows were left unchanged.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

void seedDemoProducts().catch((error: unknown) => {
  console.error("Failed to seed demo products.", error);
  process.exitCode = 1;
});
