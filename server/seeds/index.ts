import { prismaClient } from "../src/lib/prismaClient";

import demoProducts from "./products";

/**
 * Inserts demo products that do not exist yet.
 *
 * Safe to run more than once: a product is skipped when one with the same
 * category and name is already in the database. Existing rows are never
 * updated or deleted.
 */
async function main() {
  const existing = await prismaClient.product.findMany({
    select: { name: true, category: true },
  });

  const keyOf = (product: { name: string; category: string }) =>
    JSON.stringify([product.category, product.name]);

  const existingKeys = new Set(existing.map(keyOf));
  const missing = demoProducts.filter(
    (product) => !existingKeys.has(keyOf(product)),
  );
  const skipped = demoProducts.length - missing.length;

  if (missing.length === 0) {
    console.log(`Seed skipped: all ${skipped} demo products already exist.`);
    return;
  }

  const result = await prismaClient.product.createMany({ data: missing });

  console.log(
    `Seed complete: created ${result.count} products, skipped ${skipped} existing.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error("Product seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prismaClient.$disconnect();
  });
