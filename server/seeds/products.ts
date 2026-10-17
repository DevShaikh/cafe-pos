/** Prices are written in rupees here and stored as paisa (1 PKR = 100 paisa). */
const rupees = (amount: number) => Math.round(amount * 100);

const demoProducts = [
  {
    name: "Doodh Patti Chai",
    description: "Traditional Pakistani milk tea",
    pricePaisa: rupees(100),
    category: "Tea & Beverages",
  },
  {
    name: "Karak Chai",
    description: "Strong, creamy karak tea",
    pricePaisa: rupees(120),
    category: "Tea & Beverages",
  },
  {
    name: "Elaichi Chai",
    description: "Milk tea infused with cardamom",
    pricePaisa: rupees(130),
    category: "Tea & Beverages",
  },
  {
    name: "Green Tea (Kehwa)",
    description: "Light green tea served hot",
    pricePaisa: rupees(100),
    category: "Tea & Beverages",
  },
  {
    name: "Kashmiri Chai",
    description: "Traditional pink tea",
    pricePaisa: rupees(180),
    category: "Tea & Beverages",
  },
  {
    name: "Plain Paratha",
    description: "Freshly fried flaky paratha",
    pricePaisa: rupees(100),
    category: "Paratha & Bread",
  },
  {
    name: "Aloo Paratha",
    description: "Paratha stuffed with spiced potatoes",
    pricePaisa: rupees(180),
    category: "Paratha & Bread",
  },
  {
    name: "Anda Paratha",
    description: "Paratha filled with egg",
    pricePaisa: rupees(200),
    category: "Paratha & Bread",
  },
  {
    name: "Cheese Paratha",
    description: "Paratha stuffed with melted cheese",
    pricePaisa: rupees(250),
    category: "Paratha & Bread",
  },
  {
    name: "Roghni Naan",
    description: "Soft naan topped with sesame seeds",
    pricePaisa: rupees(80),
    category: "Paratha & Bread",
  },
  {
    name: "Fried Eggs (2)",
    description: "Two eggs fried to order",
    pricePaisa: rupees(180),
    category: "Eggs & Breakfast",
  },
  {
    name: "Masala Omelette",
    description: "Egg omelette with onion, tomato, and green chilli",
    pricePaisa: rupees(200),
    category: "Eggs & Breakfast",
  },
  {
    name: "Boiled Eggs (2)",
    description: "Two boiled eggs served with seasoning",
    pricePaisa: rupees(150),
    category: "Eggs & Breakfast",
  },
  {
    name: "Halwa Poori Combo",
    description: "Poori served with halwa and chana",
    pricePaisa: rupees(350),
    category: "Breakfast Combos",
  },
  {
    name: "Poori (2 Pieces)",
    description: "Two crispy fried pooris",
    pricePaisa: rupees(150),
    category: "Breakfast Combos",
  },
  {
    name: "Chana Masala",
    description: "Chickpeas cooked with Pakistani spices",
    pricePaisa: rupees(180),
    category: "Breakfast Combos",
  },
  {
    name: "Chicken Paratha Roll",
    description: "Spiced chicken wrapped in a paratha",
    pricePaisa: rupees(300),
    category: "Snacks & Rolls",
  },
  {
    name: "Samosa (2 Pieces)",
    description: "Crispy pastry filled with spiced potatoes",
    pricePaisa: rupees(120),
    category: "Snacks & Rolls",
  },
  {
    name: "Fresh Lime Soda",
    description: "Refreshing lime drink, sweet or salted",
    pricePaisa: rupees(180),
    category: "Cold Drinks",
  },
  {
    name: "Mineral Water",
    description: "Bottled drinking water",
    pricePaisa: rupees(100),
    category: "Cold Drinks",
  },
];

export default demoProducts;
