import { prismaClient } from "../src/lib/prismaClient";
import bcrypt from "bcryptjs";

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

  // 3. Seed Products
  // We clear old products because the price type changed from String to Float.
  // In production, you would never delete products like this, but for dev re-seeding it's fine.
  await prismaClient.orderItem.deleteMany();
  await prismaClient.product.deleteMany();

  const products = [
    {
      name: "Doodh Patti Chai",
      description: "Traditional Pakistani milk tea",
      price: 100.0,
      category: "Tea & Beverages",
    },
    {
      name: "Karak Chai",
      description: "Strong, creamy karak tea",
      price: 120.0,
      category: "Tea & Beverages",
    },
    {
      name: "Elachi Chai",
      description: "Milk tea infused with cardamom",
      price: 130.0,
      category: "Tea & Beverages",
    },
    {
      name: "Green Tea (Kehwa)",
      description: "Light green tea served hot",
      price: 100.0,
      category: "Tea & Beverages",
    },
    {
      name: "Kashmiri Chai",
      description: "Traditional pink tea",
      price: 180.0,
      category: "Tea & Beverages",
    },
    {
      name: "Plain Paratha",
      description: "Freshly fried flaky paratha",
      price: 100.0,
      category: "Breakfast",
    },
    {
      name: "Aloo Paratha",
      description: "Paratha stuffed with spiced potatoes",
      price: 180.0,
      category: "Breakfast",
    },
    {
      name: "Anda Paratha",
      description: "Paratha filled with egg",
      price: 200.0,
      category: "Breakfast",
    },
    {
      name: "Cheese Paratha",
      description: "Paratha stuffed with melted cheese",
      price: 250.0,
      category: "Breakfast",
    },
    {
      name: "Roghni Naan",
      description: "Soft naan topped with sesame seeds",
      price: 150.0,
      category: "Breakfast",
    },
    {
      name: "Fried Eggs (2)",
      description: "Two eggs fried to order",
      price: 120.0,
      category: "Breakfast",
    },
    {
      name: "Masala Omelette",
      description: "Egg omelette with onion, tomato, green chilli",
      price: 180.0,
      category: "Breakfast",
    },
    {
      name: "Chicken Karahi (Half)",
      description: "Spicy chicken karahi cooked in tomatoes",
      price: 1200.0,
      category: "Lunch",
    },
    {
      name: "Chicken Karahi (Full)",
      description: "Full portion of our signature karahi",
      price: 2200.0,
      category: "Lunch",
    },
    {
      name: "Daal Fry",
      description: "Yellow lentils tempered with cumin",
      price: 400.0,
      category: "Lunch",
    },
    {
      name: "Chicken Biryani",
      description: "Aromatic basmati rice with chicken",
      price: 450.0,
      category: "Lunch",
    },
    {
      name: "Club Sandwich",
      description: "Triple decker with chicken and egg",
      price: 550.0,
      category: "Lunch",
    },
    {
      name: "Chicken Shawarma",
      description: "Wrap with garlic sauce and pickles",
      price: 350.0,
      category: "Lunch",
    },
    {
      name: "Zinger Burger",
      description: "Crispy chicken fillet burger",
      price: 600.0,
      category: "Lunch",
    },
    {
      name: "French Fries",
      description: "Crispy golden fries",
      price: 250.0,
      category: "Lunch",
    },
  ];

  await prismaClient.product.createMany({
    data: products,
  });
  console.log(`✅ ${products.length} products seeded.`);

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
