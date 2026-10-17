import { Prisma } from "../src/generated/prisma/client";

const demoProducts = [
  {
    name: "Doodh Patti Chai",
    description: "Traditional Pakistani milk tea",
    price: new Prisma.Decimal("100.00"),
    category: "Tea & Beverages",
  },
  {
    name: "Karak Chai",
    description: "Strong, creamy karak tea",
    price: new Prisma.Decimal("120.00"),
    category: "Tea & Beverages",
  },
  {
    name: "Elaichi Chai",
    description: "Milk tea infused with cardamom",
    price: new Prisma.Decimal("130.00"),
    category: "Tea & Beverages",
  },
  {
    name: "Green Tea (Kehwa)",
    description: "Light green tea served hot",
    price: new Prisma.Decimal("100.00"),
    category: "Tea & Beverages",
  },
  {
    name: "Kashmiri Chai",
    description: "Traditional pink tea",
    price: new Prisma.Decimal("180.00"),
    category: "Tea & Beverages",
  },
  {
    name: "Plain Paratha",
    description: "Freshly fried flaky paratha",
    price: new Prisma.Decimal("100.00"),
    category: "Paratha & Bread",
  },
  {
    name: "Aloo Paratha",
    description: "Paratha stuffed with spiced potatoes",
    price: new Prisma.Decimal("180.00"),
    category: "Paratha & Bread",
  },
  {
    name: "Anda Paratha",
    description: "Paratha filled with egg",
    price: new Prisma.Decimal("200.00"),
    category: "Paratha & Bread",
  },
  {
    name: "Cheese Paratha",
    description: "Paratha stuffed with melted cheese",
    price: new Prisma.Decimal("250.00"),
    category: "Paratha & Bread",
  },
  {
    name: "Roghni Naan",
    description: "Soft naan topped with sesame seeds",
    price: new Prisma.Decimal("80.00"),
    category: "Paratha & Bread",
  },
  {
    name: "Fried Eggs (2)",
    description: "Two eggs fried to order",
    price: new Prisma.Decimal("180.00"),
    category: "Eggs & Breakfast",
  },
  {
    name: "Masala Omelette",
    description: "Egg omelette with onion, tomato, and green chilli",
    price: new Prisma.Decimal("200.00"),
    category: "Eggs & Breakfast",
  },
  {
    name: "Boiled Eggs (2)",
    description: "Two boiled eggs served with seasoning",
    price: new Prisma.Decimal("150.00"),
    category: "Eggs & Breakfast",
  },
  {
    name: "Halwa Poori Combo",
    description: "Poori served with halwa and chana",
    price: new Prisma.Decimal("350.00"),
    category: "Breakfast Combos",
  },
  {
    name: "Poori (2 Pieces)",
    description: "Two crispy fried pooris",
    price: new Prisma.Decimal("150.00"),
    category: "Breakfast Combos",
  },
  {
    name: "Chana Masala",
    description: "Chickpeas cooked with Pakistani spices",
    price: new Prisma.Decimal("180.00"),
    category: "Breakfast Combos",
  },
  {
    name: "Chicken Paratha Roll",
    description: "Spiced chicken wrapped in a paratha",
    price: new Prisma.Decimal("300.00"),
    category: "Snacks & Rolls",
  },
  {
    name: "Samosa (2 Pieces)",
    description: "Crispy pastry filled with spiced potatoes",
    price: new Prisma.Decimal("120.00"),
    category: "Snacks & Rolls",
  },
  {
    name: "Fresh Lime Soda",
    description: "Refreshing lime drink, sweet or salted",
    price: new Prisma.Decimal("180.00"),
    category: "Cold Drinks",
  },
  {
    name: "Mineral Water",
    description: "Bottled drinking water",
    price: new Prisma.Decimal("100.00"),
    category: "Cold Drinks",
  },
];

export default demoProducts;
