import { prismaClient } from "../src/lib/prismaClient";

import demoProducts from "./products";

async function main() {
  const result = await prismaClient.product.createMany({
    data: demoProducts,
  });

  console.log(`Seed complete: created ${result.count} products.`);
}

main()
  .catch((error: unknown) => {
    console.error("Product seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prismaClient.$disconnect();
  });
