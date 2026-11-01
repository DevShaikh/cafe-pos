import { createHash } from "node:crypto";
import { prismaClient } from "../src/lib/prismaClient";

const DEMO_PREFIX = "DEMO-";
const PAGE_TEST_RECORDS = 125;
const DEMO_PRODUCTS = [
  {
    name: "Demo Cappuccino",
    description: "Demo fixture for menu and checkout testing.",
    category: "Demo Drinks",
    pricePaisa: 45000,
    isAvailable: true,
  },
  {
    name: "Demo Iced Latte",
    description: "Demo fixture for menu and checkout testing.",
    category: "Demo Drinks",
    pricePaisa: 52000,
    isAvailable: true,
  },
  {
    name: "Demo Lemon Tea",
    description: "Demo fixture for menu and checkout testing.",
    category: "Demo Drinks",
    pricePaisa: 30000,
    isAvailable: true,
  },
  {
    name: "Demo Brownie",
    description: "Demo fixture for menu and checkout testing.",
    category: "Demo Bakery",
    pricePaisa: 38000,
    isAvailable: true,
  },
  {
    name: "Demo Croissant",
    description: "Demo fixture for menu and checkout testing.",
    category: "Demo Bakery",
    pricePaisa: 42000,
    isAvailable: true,
  },
  {
    name: "Demo Sandwich",
    description: "Demo fixture for menu and checkout testing.",
    category: "Demo Food",
    pricePaisa: 65000,
    isAvailable: true,
  },
  {
    name: "Demo Soup",
    description: "Demo fixture for menu and checkout testing.",
    category: "Demo Food",
    pricePaisa: 58000,
    isAvailable: true,
  },
  {
    name: "Demo Seasonal Drink",
    description: "Unavailable product fixture for menu filter testing.",
    category: "Demo Drinks",
    pricePaisa: 40000,
    isAvailable: false,
  },
] as const;

const EXPENSE_CATEGORIES = [
  "INGREDIENTS",
  "PACKAGING",
  "UTILITIES",
  "RENT",
  "MAINTENANCE",
  "TRANSPORT",
  "OTHER",
] as const;

const PAYMENT_METHODS = ["CASH", "CARD_MANUAL", "EASYPAISA", "OTHER"] as const;

function stableId(name: string): string {
  const hash = createHash("sha256")
    .update(`cafe-pos-demo:${name}`)
    .digest("hex")
    .slice(0, 32);
  const variant = Number.parseInt(hash.slice(16, 17), 16);
  const value = `${hash.slice(0, 12)}5${hash.slice(13, 16)}${((variant & 0x3) | 0x8).toString(16)}${hash.slice(17)}`;
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`;
}

function daysAgo(days: number, hour: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, (days * 7) % 60, 0, 0);
  return date;
}

function requiredAt<T>(items: readonly T[], index: number, label: string): T {
  const item = items[index];
  if (!item) throw new Error(`Missing ${label} demo fixture.`);
  return item;
}

async function seedDemoProducts() {
  const categoryNames = new Set<string>(
    DEMO_PRODUCTS.map(({ category }) => category),
  );
  categoryNames.add("Demo - Safe to Delete");

  for (const name of categoryNames) {
    await prismaClient.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  for (const product of DEMO_PRODUCTS) {
    const id = stableId(`product:${product.name}`);
    await prismaClient.product.upsert({
      where: { id },
      update: {},
      create: { id, ...product },
    });
  }

  return DEMO_PRODUCTS.filter(({ isAvailable }) => isAvailable).map(
    (product) => ({
      id: stableId(`product:${product.name}`),
      name: product.name,
      pricePaisa: product.pricePaisa,
    }),
  );
}

async function seedDemoSessions(staffId: string) {
  const sessions = [
    { key: "session:one", openedDaysAgo: 100, closedDaysAgo: 99 },
    { key: "session:two", openedDaysAgo: 60, closedDaysAgo: 59 },
  ];

  for (const session of sessions) {
    await prismaClient.registerSession.upsert({
      where: { id: stableId(session.key) },
      update: {},
      create: {
        id: stableId(session.key),
        staffId,
        status: "CLOSED",
        openedAt: daysAgo(session.openedDaysAgo, 8),
        closedAt: daysAgo(session.closedDaysAgo, 18),
      },
    });
  }

  return sessions.map(({ key }) => stableId(key));
}

async function seedDemoOrders(
  staffId: string,
  sessionIds: string[],
  products: { id: string; name: string; pricePaisa: number }[],
) {
  const settings = await prismaClient.settings.findUnique({
    where: { id: "singleton" },
  });
  const taxRateBps =
    settings?.taxEnabled === false ? 0 : settings?.taxRateBps ?? 800;
  let createdCount = 0;

  for (let index = 1; index <= PAGE_TEST_RECORDS; index += 1) {
    const id = stableId(`order:${index}`);
    const receiptNumber = `${DEMO_PREFIX}${String(index).padStart(4, "0")}`;
    if (await prismaClient.order.findUnique({ where: { id } })) continue;

    const conflictingReceipt = await prismaClient.order.findUnique({
      where: { receiptNumber },
      select: { id: true },
    });
    if (conflictingReceipt) {
      throw new Error(
        `Cannot seed demo receipt ${receiptNumber}: that receipt number is already in use.`,
      );
    }

    const product = requiredAt(
      products,
      index % products.length,
      "order product",
    );
    const secondProduct = requiredAt(
      products,
      (index + 2) % products.length,
      "second order product",
    );
    const sessionId = requiredAt(
      sessionIds,
      index % sessionIds.length,
      "register session",
    );
    const paymentMethod = requiredAt(
      PAYMENT_METHODS,
      index % PAYMENT_METHODS.length,
      "payment method",
    );
    const firstQuantity = (index % 3) + 1;
    const secondQuantity = index % 4 === 0 ? 1 : 0;
    const items = [
      {
        productId: product.id,
        nameSnapshot: product.name,
        unitPricePaisa: product.pricePaisa,
        quantity: firstQuantity,
        lineTotalPaisa: product.pricePaisa * firstQuantity,
      },
      ...(secondQuantity
        ? [
            {
              productId: secondProduct.id,
              nameSnapshot: secondProduct.name,
              unitPricePaisa: secondProduct.pricePaisa,
              quantity: secondQuantity,
              lineTotalPaisa: secondProduct.pricePaisa * secondQuantity,
            },
          ]
        : []),
    ];
    const subtotalPaisa = items.reduce(
      (sum, item) => sum + item.lineTotalPaisa,
      0,
    );
    const taxPaisa = Math.floor(
      (subtotalPaisa * taxRateBps + 5000) / 10000,
    );
    const totalPaisa = subtotalPaisa + taxPaisa;
    const createdAt = daysAgo((index * 7) % 100, 8 + (index % 12));
    const paid = index <= PAGE_TEST_RECORDS - 10;
    const paidAt = paid
      ? new Date(createdAt.getTime() + 5 * 60_000)
      : undefined;
    const status = paid ? "PAID" : "PLACED";

    await prismaClient.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          id,
          receiptNumber,
          orderType: index % 2 === 0 ? "DINE_IN" : "TAKEAWAY",
          status,
          subtotalPaisa,
          taxPaisa,
          totalPaisa,
          taxRateBps,
          createdById: staffId,
          sessionId,
          createdAt,
          paidAt,
          items: { create: items },
          events: {
            create: [
              {
                eventType: "order.placed",
                payload: JSON.stringify({
                  orderType: index % 2 === 0 ? "DINE_IN" : "TAKEAWAY",
                }),
                createdAt,
              },
              ...(paid
                ? [
                    {
                      eventType: "order.paid",
                      payload: JSON.stringify({
                        method: paymentMethod,
                        paidAt,
                      }),
                      createdAt: paidAt,
                    },
                  ]
                : []),
            ],
          },
          ...(paid
            ? {
                payments: {
                  create: {
                    method: paymentMethod,
                    amountPaisa: totalPaisa,
                    createdById: staffId,
                    createdAt: paidAt,
                  },
                },
              }
            : {}),
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: staffId,
          action: "order.created",
          entity: "order",
          entityId: order.id,
          after: JSON.stringify({ receiptNumber, status, totalPaisa }),
          createdAt,
        },
      });
      if (paid && paidAt) {
        await tx.auditLog.create({
          data: {
            actorId: staffId,
            action: "order.paid",
            entity: "order",
            entityId: order.id,
            after: JSON.stringify({
              status: "PAID",
              method: paymentMethod,
            }),
            createdAt: paidAt,
          },
        });
      }
    });
    createdCount += 1;
  }

  return createdCount;
}

async function seedDemoExpenses(staffId: string) {
  let createdCount = 0;

  for (let index = 1; index <= PAGE_TEST_RECORDS; index += 1) {
    const id = stableId(`expense:${index}`);
    if (await prismaClient.expense.findUnique({ where: { id } })) continue;

    const category = requiredAt(
      EXPENSE_CATEGORIES,
      index % EXPENSE_CATEGORIES.length,
      "expense category",
    );
    const amountPaisa = 12_500 + ((index * 3_875) % 275_000);
    const spentAt = daysAgo((index * 11) % 100, 7 + (index % 13));
    const description =
      index % 3 === 0
        ? "Demo milk purchase"
        : index % 3 === 1
          ? "Demo cafe supplies"
          : "Demo utility expense";
    const note = index % 4 === 0 ? "Demo fixture for filter testing." : null;

    await prismaClient.$transaction(async (tx) => {
      const expense = await tx.expense.create({
        data: {
          id,
          description,
          category,
          amountPaisa,
          spentAt,
          note,
          createdById: staffId,
          createdAt: spentAt,
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: staffId,
          action: "expense.recorded",
          entity: "expense",
          entityId: expense.id,
          after: JSON.stringify({
            description,
            category,
            amountPaisa,
            spentAt,
            note,
          }),
          createdAt: spentAt,
        },
      });
    });
    createdCount += 1;
  }

  return createdCount;
}

async function main() {
  const staff = await prismaClient.staff.findFirst({
    where: { active: true },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true },
  });
  if (!staff) {
    throw new Error(
      "No active staff account exists. Run `npm run db:seed --prefix server` first.",
    );
  }

  const products = await seedDemoProducts();
  const sessionIds = await seedDemoSessions(staff.id);
  const ordersCreated = await seedDemoOrders(staff.id, sessionIds, products);
  const expensesCreated = await seedDemoExpenses(staff.id);

  console.log(`Demo fixtures added for ${staff.name}:`);
  console.log(`- ${DEMO_PRODUCTS.length} demo products across 3 categories`);
  console.log('- 1 empty "Demo - Safe to Delete" category');
  console.log(`- ${sessionIds.length} closed cashier sessions`);
  console.log(
    `- ${PAGE_TEST_RECORDS} paginated orders (${PAGE_TEST_RECORDS - 10} paid, 10 unpaid; ${ordersCreated} created this run)`,
  );
  console.log(
    `- ${PAGE_TEST_RECORDS} paginated expenses (${expensesCreated} created this run)`,
  );
  console.log("Existing cafe data was not modified or removed.");
}

main()
  .catch((error: unknown) => {
    console.error("Demo data seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prismaClient.$disconnect();
  });
