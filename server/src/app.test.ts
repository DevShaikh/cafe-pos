/**
 * @file src/app.test.ts
 * @description API tests for the Express app.
 *
 * No real database is used. Prisma's query method is replaced with a mock in
 * each test, so the real controller, service, routes and middleware all run.
 */

import assert from "node:assert/strict";
import { once } from "node:events";
import type { Server } from "node:http";
import os from "node:os";
import path from "node:path";
import type { AddressInfo } from "node:net";
import { after, afterEach, before, mock, test } from "node:test";
import jwt from "jsonwebtoken";

const CLIENT_ORIGIN = "http://localhost:3001";
const TEST_JWT_SECRET = "test-only-secret-for-authenticated-route-tests";

let server: Server;
let baseUrl: string;
let prismaClient: typeof import("./lib/prismaClient").prismaClient;
let originalQueryRaw: typeof prismaClient.$queryRaw;
let originalStaffFindUnique: typeof prismaClient.staff.findUnique;
let originalProductFindMany: typeof prismaClient.product.findMany;
let originalProductFindUnique: typeof prismaClient.product.findUnique;
let originalProductCreate: typeof prismaClient.product.create;
let originalProductUpdate: typeof prismaClient.product.update;
let originalProductUpdateMany: typeof prismaClient.product.updateMany;
let originalProductCount: typeof prismaClient.product.count;
let originalCategoryFindMany: typeof prismaClient.category.findMany;
let originalCategoryFindUnique: typeof prismaClient.category.findUnique;
let originalCategoryCreate: typeof prismaClient.category.create;
let originalCategoryUpdate: typeof prismaClient.category.update;
let originalCategoryDelete: typeof prismaClient.category.delete;
let originalOrderFindMany: typeof prismaClient.order.findMany;
let originalOrderCount: typeof prismaClient.order.count;
let originalExpenseFindMany: typeof prismaClient.expense.findMany;
let originalExpenseAggregate: typeof prismaClient.expense.aggregate;
let originalTransaction: typeof prismaClient.$transaction;

before(async () => {
  // Must be set BEFORE the app is imported: config/env.ts reads these on import.
  // Values set here win over anything in server/.env.
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = `file:${path.join(os.tmpdir(), "cafe-pos-test.db")}`;
  process.env.CLIENT_ORIGIN = CLIENT_ORIGIN;
  process.env.JWT_SECRET = TEST_JWT_SECRET;

  // tsx loads these as CommonJS, so the app is the module's `default` export.
  // TypeScript's NodeNext typing wraps it one level deeper, hence the cast.
  const { default: app } =
    (await import("./app.js")) as unknown as typeof import("./app");
  ({ prismaClient } = await import("./lib/prismaClient.js"));
  originalQueryRaw = prismaClient.$queryRaw;
  originalStaffFindUnique = prismaClient.staff.findUnique;
  originalProductFindMany = prismaClient.product.findMany;
  originalProductFindUnique = prismaClient.product.findUnique;
  originalProductCreate = prismaClient.product.create;
  originalProductUpdate = prismaClient.product.update;
  originalProductUpdateMany = prismaClient.product.updateMany;
  originalProductCount = prismaClient.product.count;
  originalCategoryFindMany = prismaClient.category.findMany;
  originalCategoryFindUnique = prismaClient.category.findUnique;
  originalCategoryCreate = prismaClient.category.create;
  originalCategoryUpdate = prismaClient.category.update;
  originalCategoryDelete = prismaClient.category.delete;
  originalOrderFindMany = prismaClient.order.findMany;
  originalOrderCount = prismaClient.order.count;
  originalExpenseFindMany = prismaClient.expense.findMany;
  originalExpenseAggregate = prismaClient.expense.aggregate;
  originalTransaction = prismaClient.$transaction;

  server = app.listen(0);
  await once(server, "listening");
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

afterEach(() => {
  mock.restoreAll();
  prismaClient.$queryRaw = originalQueryRaw;
  prismaClient.staff.findUnique = originalStaffFindUnique;
  prismaClient.product.findMany = originalProductFindMany;
  prismaClient.product.findUnique = originalProductFindUnique;
  prismaClient.product.create = originalProductCreate;
  prismaClient.product.update = originalProductUpdate;
  prismaClient.product.updateMany = originalProductUpdateMany;
  prismaClient.product.count = originalProductCount;
  prismaClient.category.findMany = originalCategoryFindMany;
  prismaClient.category.findUnique = originalCategoryFindUnique;
  prismaClient.category.create = originalCategoryCreate;
  prismaClient.category.update = originalCategoryUpdate;
  prismaClient.category.delete = originalCategoryDelete;
  prismaClient.order.findMany = originalOrderFindMany;
  prismaClient.order.count = originalOrderCount;
  prismaClient.expense.findMany = originalExpenseFindMany;
  prismaClient.expense.aggregate = originalExpenseAggregate;
  prismaClient.$transaction = originalTransaction;
});

// Prisma's client is a Proxy, which node:test's mock.method cannot wrap, so
// $queryRaw is swapped by hand here and restored in afterEach.
function stubQueryRaw(implementation: () => Promise<unknown>) {
  prismaClient.$queryRaw =
    implementation as unknown as typeof prismaClient.$queryRaw;
}

/** Pretend the database answers `SELECT 1` successfully. */
function mockDatabaseUp() {
  stubQueryRaw(async () => [{ "?column?": 1 }]);
}

/** Pretend the database cannot be reached. */
function mockDatabaseDown() {
  mock.method(console, "error", () => {}); // keep test output clean
  stubQueryRaw(async () => {
    throw new Error("connect ECONNREFUSED");
  });
}

function mockAuthenticatedStaff() {
  prismaClient.staff.findUnique = (async () => ({
    id: "test-staff",
    name: "Test Cashier",
    role: "ADMIN",
    active: true,
  })) as unknown as typeof prismaClient.staff.findUnique;
  return jwt.sign({ id: "test-staff" }, TEST_JWT_SECRET);
}

function mockTransaction() {
  prismaClient.$transaction = ((
    operation: (transaction: typeof prismaClient) => Promise<unknown>,
  ) => operation(prismaClient)) as unknown as typeof prismaClient.$transaction;
}

function mockArrayTransaction() {
  prismaClient.$transaction = (async (operations: Promise<unknown>[]) =>
    Promise.all(operations)) as unknown as typeof prismaClient.$transaction;
}

test("GET /api/health returns 200 when the database is reachable", async () => {
  mockDatabaseUp();

  const response = await fetch(`${baseUrl}/api/health`);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    success: true,
    message: "Health check passed",
    data: { status: "ok", database: "connected" },
  });
});

test("product list rejects repeated filter parameters", async () => {
  const token = mockAuthenticatedStaff();

  const response = await fetch(
    `${baseUrl}/api/products?search=tea&search=coffee`,
    { headers: { Cookie: `pos_session=${token}` } },
  );

  assert.equal(response.status, 400);
  assert.equal((await response.json()).error.code, "VALIDATION_ERROR");
});

test("product list filters unavailable products unless explicitly included", async () => {
  const token = mockAuthenticatedStaff();
  const whereValues: unknown[] = [];
  prismaClient.product.findMany = (async (args) => {
    whereValues.push(args?.where);
    return [];
  }) as typeof prismaClient.product.findMany;

  for (const query of ["", "?includeUnavailable=true"]) {
    const response = await fetch(`${baseUrl}/api/products${query}`, {
      headers: { Cookie: `pos_session=${token}` },
    });
    assert.equal(response.status, 200);
  }

  assert.deepEqual(whereValues, [{ isAvailable: true }, {}]);
});

test("order search filters order results, unpaid count, and total count by receipt number", async () => {
  const token = mockAuthenticatedStaff();
  mockArrayTransaction();
  const resultFilters: unknown[] = [];
  const countFilters: unknown[] = [];
  prismaClient.order.findMany = (async (args) => {
    resultFilters.push(args?.where);
    return [];
  }) as typeof prismaClient.order.findMany;
  prismaClient.order.count = (async (args) => {
    countFilters.push(args?.where);
    return 0;
  }) as typeof prismaClient.order.count;

  const response = await fetch(
    `${baseUrl}/api/orders?search=R-104&status=PLACED`,
    { headers: { Cookie: `pos_session=${token}` } },
  );

  assert.equal(response.status, 200);
  assert.deepEqual(resultFilters, [
    { receiptNumber: { contains: "R-104" }, status: "PLACED" },
  ]);
  assert.deepEqual(countFilters, [
    { receiptNumber: { contains: "R-104" }, status: "PLACED" },
    { receiptNumber: { contains: "R-104" }, status: "PLACED" },
  ]);
});

test("expense search filters description, note, and the total aggregate", async () => {
  const token = mockAuthenticatedStaff();
  mockArrayTransaction();
  const resultFilters: unknown[] = [];
  const aggregateFilters: unknown[] = [];
  prismaClient.expense.findMany = (async (args) => {
    resultFilters.push(args?.where);
    return [];
  }) as typeof prismaClient.expense.findMany;
  prismaClient.expense.aggregate = (async (
    args: Parameters<typeof prismaClient.expense.aggregate>[0],
  ) => {
    aggregateFilters.push(args?.where);
    return { _sum: { amountPaisa: null }, _count: { _all: 0 } };
  }) as unknown as typeof prismaClient.expense.aggregate;

  const response = await fetch(`${baseUrl}/api/expenses?search=Milk`, {
    headers: { Cookie: `pos_session=${token}` },
  });

  const expectedWhere = {
    OR: [
      { description: { contains: "Milk" } },
      { note: { contains: "Milk" } },
    ],
  };
  assert.equal(response.status, 200);
  assert.deepEqual(resultFilters, [expectedWhere]);
  assert.deepEqual(aggregateFilters, [expectedWhere]);
});

test("category management requires an authenticated cashier", async () => {
  const response = await fetch(`${baseUrl}/api/categories`);
  assert.equal(response.status, 401);
  assert.equal((await response.json()).error.code, "UNAUTHORIZED");
});

test("category creation trims and persists a validated name", async () => {
  const token = mockAuthenticatedStaff();
  prismaClient.category.findMany = (async () => []) as typeof prismaClient.category.findMany;
  prismaClient.category.create = (async ({ data }) => ({
    id: "category-test",
    name: data.name,
    createdAt: new Date(),
    updatedAt: new Date(),
  })) as typeof prismaClient.category.create;

  const response = await fetch(`${baseUrl}/api/categories`, {
    method: "POST",
    headers: {
      Cookie: `pos_session=${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: "  Cold Drinks  " }),
  });

  assert.equal(response.status, 201);
  assert.equal((await response.json()).data.name, "Cold Drinks");
});

test("product creation preserves integer paisa and uses the canonical category", async () => {
  const token = mockAuthenticatedStaff();
  mockTransaction();
  let createdProduct: { pricePaisa: number; category: string } | undefined;
  prismaClient.category.findMany = (async () => [{ name: "Tea" }]) as typeof prismaClient.category.findMany;
  prismaClient.product.create = (async (args: {
    data: {
      name: string;
      pricePaisa: number;
      category: string;
      description?: string | null;
      imageUrl?: string | null;
    };
  }) => {
    createdProduct = args.data;
    return {
      id: "00000000-0000-4000-8000-000000000001",
      ...args.data,
      isAvailable: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }) as unknown as typeof prismaClient.product.create;

  const response = await fetch(`${baseUrl}/api/products`, {
    method: "POST",
    headers: {
      Cookie: `pos_session=${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "Karak Chai",
      pricePaisa: 12550,
      category: "tea",
    }),
  });

  assert.equal(response.status, 201);
  assert.equal(createdProduct?.pricePaisa, 12550);
  assert.equal(createdProduct?.category, "Tea");
});

test("product availability can be updated without changing its price", async () => {
  const token = mockAuthenticatedStaff();
  mockTransaction();
  const productId = "00000000-0000-4000-8000-000000000001";
  prismaClient.product.findUnique = (async () => ({
    id: productId,
    name: "Chai",
    description: null,
    pricePaisa: 10000,
    category: "Tea",
    imageUrl: null,
    isAvailable: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  })) as unknown as typeof prismaClient.product.findUnique;
  prismaClient.product.update = (async ({ data }) => ({
    id: productId,
    name: "Chai",
    description: null,
    pricePaisa: 10000,
    category: "Tea",
    imageUrl: null,
    isAvailable: data.isAvailable,
    createdAt: new Date(),
    updatedAt: new Date(),
  })) as typeof prismaClient.product.update;

  const response = await fetch(`${baseUrl}/api/products/${productId}`, {
    method: "PATCH",
    headers: {
      Cookie: `pos_session=${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ isAvailable: false }),
  });

  assert.equal(response.status, 200);
  const product = (await response.json()).data;
  assert.equal(product.isAvailable, false);
  assert.equal(product.pricePaisa, 10000);
});

test("category deletion is rejected while products are assigned", async () => {
  const token = mockAuthenticatedStaff();
  mockTransaction();
  const categoryId = "00000000-0000-4000-8000-000000000001";
  prismaClient.category.findUnique = (async () => ({
    id: categoryId,
    name: "Tea",
    createdAt: new Date(),
    updatedAt: new Date(),
  })) as typeof prismaClient.category.findUnique;
  prismaClient.product.count = (async () => 1) as typeof prismaClient.product.count;

  const response = await fetch(`${baseUrl}/api/categories/${categoryId}`, {
    method: "DELETE",
    headers: { Cookie: `pos_session=${token}` },
  });

  assert.equal(response.status, 409);
  assert.equal((await response.json()).error.code, "CATEGORY_IN_USE");
});

test("renaming a category also updates its products", async () => {
  const token = mockAuthenticatedStaff();
  mockTransaction();
  const categoryId = "00000000-0000-4000-8000-000000000001";
  let updatedProductCategory: unknown;
  prismaClient.category.findUnique = (async () => ({
    id: categoryId,
    name: "Tea",
    createdAt: new Date(),
    updatedAt: new Date(),
  })) as typeof prismaClient.category.findUnique;
  prismaClient.category.findMany = (async () => []) as typeof prismaClient.category.findMany;
  prismaClient.category.update = (async ({ data }) => ({
    id: categoryId,
    name: data.name,
    createdAt: new Date(),
    updatedAt: new Date(),
  })) as typeof prismaClient.category.update;
  prismaClient.product.updateMany = (async ({ data }) => {
    updatedProductCategory = data.category;
    return { count: 2 };
  }) as typeof prismaClient.product.updateMany;

  const response = await fetch(`${baseUrl}/api/categories/${categoryId}`, {
    method: "PATCH",
    headers: {
      Cookie: `pos_session=${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: "Hot Drinks" }),
  });

  assert.equal(response.status, 200);
  assert.equal(updatedProductCategory, "Hot Drinks");
  assert.equal((await response.json()).data.name, "Hot Drinks");
});

test("GET /api/health returns a JSON error when the database is down", async () => {
  mockDatabaseDown();

  const response = await fetch(`${baseUrl}/api/health`);

  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), {
    error: {
      code: "DATABASE_CONNECTION_ERROR",
      message: "Failed to connect to the database",
    },
  });
});

test("responses include Helmet security headers", async () => {
  mockDatabaseUp();

  const response = await fetch(`${baseUrl}/api/health`);

  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
});

test("CORS names only the configured client origin", async () => {
  mockDatabaseUp();

  for (const origin of [CLIENT_ORIGIN, "http://untrusted.example"]) {
    const response = await fetch(`${baseUrl}/api/health`, {
      headers: { Origin: origin },
    });

    // Browsers compare this header with the calling page's own origin, so a
    // page served from untrusted.example is blocked from reading the response.
    assert.equal(
      response.headers.get("access-control-allow-origin"),
      CLIENT_ORIGIN,
    );
  }
});

test("unknown routes return a JSON 404", async () => {
  const response = await fetch(`${baseUrl}/api/not-a-route`);

  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), {
    error: {
      code: "NOT_FOUND",
      message: "Route /api/not-a-route not found.",
    },
  });
});

test("malformed JSON bodies return a JSON 400", async () => {
  const response = await fetch(`${baseUrl}/api/health`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{ not valid json",
  });

  assert.equal(response.status, 400);
  assert.equal((await response.json()).error.code, "INVALID_JSON");
});

test("error handler hides details of unexpected errors", async () => {
  mock.method(console, "error", () => {});
  const { errorHandler } = await import("./middleware/error-handler.js");

  let statusCode = 0;
  let body: unknown;
  const fakeResponse = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(payload: unknown) {
      body = payload;
      return this;
    },
  };

  errorHandler(
    new Error("secret internal detail"),
    {} as never,
    fakeResponse as never,
    () => {},
  );

  assert.equal(statusCode, 500);
  assert.deepEqual(body, {
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred.",
    },
  });
});
