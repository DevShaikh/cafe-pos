/** Prices are written in rupees here and stored as paisa (1 PKR = 100 paisa). */
const rupees = (amount: number) => Math.round(amount * 100);

const demoProducts = [
  {
    name: "Doodh Patti Chai",
    description: "Traditional Pakistani milk tea",
    price: rupees(100),
    category: "Tea & Beverages",
  },
  {
    name: "Karak Chai",
    description: "Strong, creamy karak tea",
    price: rupees(120),
    category: "Tea & Beverages",
  },
  {
    name: "Elaichi Chai",
    description: "Milk tea infused with cardamom",
    price: rupees(130),
    category: "Tea & Beverages",
  },
  {
    name: "Green Tea (Kehwa)",
    description: "Light green tea served hot",
    price: rupees(100),
    category: "Tea & Beverages",
  },
  {
    name: "Kashmiri Chai",
    description: "Traditional pink tea",
    price: rupees(180),
    category: "Tea & Beverages",
  },
  {
    name: "Plain Paratha",
    description: "Freshly fried flaky paratha",
    price: rupees(100),
    category: "Paratha & Bread",
  },
  {
    name: "Aloo Paratha",
    description: "Paratha stuffed with spiced potatoes",
    price: rupees(180),
    category: "Paratha & Bread",
  },
  {
    name: "Anda Paratha",
    description: "Paratha filled with egg",
    price: rupees(200),
    category: "Paratha & Bread",
  },
  {
    name: "Cheese Paratha",
    description: "Paratha stuffed with melted cheese",
    price: rupees(250),
    category: "Paratha & Bread",
  },
  {
    name: "Roghni Naan",
    description: "Soft naan topped with sesame seeds",
    price: rupees(80),
    category: "Paratha & Bread",
  },
  {
    name: "Fried Eggs (2)",
    description: "Two eggs fried to order",
    price: rupees(180),
    category: "Eggs & Breakfast",
  },
  {
    name: "Masala Omelette",
    description: "Egg omelette with onion, tomato, and green chilli",
    price: rupees(200),
    category: "Eggs & Breakfast",
  },
  {
    name: "Boiled Eggs (2)",
    description: "Two boiled eggs served with seasoning",
    price: rupees(150),
    category: "Eggs & Breakfast",
  },
  {
    name: "Halwa Poori Combo",
    description: "Poori served with halwa and chana",
    price: rupees(350),
    category: "Breakfast Combos",
  },
  {
    name: "Poori (2 Pieces)",
    description: "Two crispy fried pooris",
    price: rupees(150),
    category: "Breakfast Combos",
  },
  {
    name: "Chana Masala",
    description: "Chickpeas cooked with Pakistani spices",
    price: rupees(180),
    category: "Breakfast Combos",
  },
  {
    name: "Chicken Paratha Roll",
    description: "Spiced chicken wrapped in a paratha",
    price: rupees(300),
    category: "Snacks & Rolls",
  },
  {
    name: "Samosa (2 Pieces)",
    description: "Crispy pastry filled with spiced potatoes",
    price: rupees(120),
    category: "Snacks & Rolls",
  },
  {
    name: "Fresh Lime Soda",
    description: "Refreshing lime drink, sweet or salted",
    price: rupees(180),
    category: "Cold Drinks",
  },
  {
    name: "Mineral Water",
    description: "Bottled drinking water",
    price: rupees(100),
    category: "Cold Drinks",
  },
];

export default demoProducts;
