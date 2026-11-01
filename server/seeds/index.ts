import { prismaClient } from "../src/lib/prismaClient";
import products from "./products";

async function main() {
  console.log("Starting seed...");

  // 1. Seed Settings
  const settings = await prismaClient.settings.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      cafeName: "Cafe POS",
      currency: "PKR",
      taxRateBps: 800, // 8%
      receiptPrefix: "R",
    },
  });
  console.log("✅ Settings created:", settings.cafeName);

  // Add missing sample products without replacing the cafe's catalog.
  const existingProducts = await prismaClient.product.findMany({
    select: { name: true, category: true },
  });
  const existingNames = new Set(existingProducts.map(({ name }) => name));
  const productsToCreate = products.filter(
    ({ name }) => !existingNames.has(name),
  );

  if (productsToCreate.length > 0) {
    await prismaClient.product.createMany({ data: productsToCreate });
  }

  const categoryNames = new Set([
    ...existingProducts
      .map(({ category }) => category?.trim())
      .filter((name): name is string => Boolean(name)),
    ...productsToCreate.map(({ category }) => category),
  ]);
  for (const name of categoryNames) {
    await prismaClient.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log(
    `Products preserved: ${existingProducts.length}; demo products added: ${productsToCreate.length}.`,
  );

  console.log("Seeding finished successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prismaClient.$disconnect();
  });
