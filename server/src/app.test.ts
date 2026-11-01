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
