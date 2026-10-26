import { prismaClient } from "../src/lib/prismaClient";
import bcrypt from "bcryptjs";
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
      taxRate: 0.08, // 8%
      receiptPrefix: "R",
    },
  });
  console.log("✅ Settings created:", settings.cafeName);

  // 2. Seed Admin User (Default PIN: 1234)
  const existingAdmin = await prismaClient.staff.findFirst({
    where: { role: "ADMIN" },
  });

  if (!existingAdmin) {
    const pinHash = await bcrypt.hash("1234", 10);
    const admin = await prismaClient.staff.create({
      data: {
        name: "Admin",
        role: "ADMIN",
        pinHash: pinHash,
      },
    });
    console.log("✅ Admin user created. Name:", admin.name, "| PIN: 1234");
  } else {
    console.log("ℹ️ Admin user already exists.");
  }

  // 3. Add missing demo products without replacing the cafe's catalog.
  const existingProducts = await prismaClient.product.findMany({
    select: { name: true },
  });
  const existingNames = new Set(existingProducts.map(({ name }) => name));
  const productsToCreate = products.filter(
    ({ name }) => !existingNames.has(name),
  );

  if (productsToCreate.length > 0) {
    await prismaClient.product.createMany({ data: productsToCreate });
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
