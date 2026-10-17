import assert from "node:assert/strict";
import { once } from "node:events";
import { test } from "node:test";
import type { AddressInfo } from "node:net";
import { createApp } from "./app.js";
import { AppError } from "./utils/app-error.js";
import type { ProductRecord } from "./modules/products/product.service.js";
import { HealthService } from "./modules/health/health.service.js";

const sampleProduct: ProductRecord = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  name: "Flat White",
  description: null,
  price: "4.50",
  category: "Coffee",
  imageUrl: null,
  isAvailable: true,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

const productService = {
  async list() {
    return [sampleProduct];
  },
  async getById(id: string) {
    if (id !== sampleProduct.id) {
      throw new AppError(404, "PRODUCT_NOT_FOUND", "Product was not found.");
    }

    return sampleProduct;
  },
  async create() {
    return sampleProduct;
  },
};

const dependencies = {
  clientOrigin: "http://localhost:3000",
  healthService: {
    async checkDatabase() {},
  },
  productService,
};

test("health route reports a connected database", async () => {
  await withApp(dependencies, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/health`);

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    assert.deepEqual(await response.json(), {
      status: "ok",
      database: "connected",
    });
  });
});

test("health route reports database failures as service unavailable", async () => {
  const unavailableDependencies = {
    ...dependencies,
    healthService: new HealthService({
      async checkConnection() {
        throw new Error("Connection refused");
      },
    }),
  };

  await withApp(unavailableDependencies, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/health`);

    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), {
      error: {
        code: "DATABASE_UNAVAILABLE",
        message: "The database is unavailable.",
      },
    });
  });
});

test("product list route returns service results and CORS headers", async () => {
  await withApp(dependencies, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/products`, {
      headers: { Origin: "http://localhost:3000" },
    });

    assert.equal(response.status, 200);
    assert.equal(
      response.headers.get("access-control-allow-origin"),
      "http://localhost:3000",
    );
    assert.deepEqual(await response.json(), {
      data: [
        {
          ...sampleProduct,
          createdAt: sampleProduct.createdAt.toISOString(),
          updatedAt: sampleProduct.updatedAt.toISOString(),
        },
      ],
    });
  });
});

test("CORS only allows the configured client origin", async () => {
  await withApp(dependencies, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/products`, {
      headers: { Origin: "http://untrusted.example" },
    });

    assert.equal(response.status, 200);
    assert.equal(
      response.headers.get("access-control-allow-origin"),
      "http://localhost:3000",
    );
  });
});

test("product detail route returns a product by UUID", async () => {
  await withApp(dependencies, async (baseUrl) => {
    const response = await fetch(
      `${baseUrl}/api/products/${sampleProduct.id}`,
    );

    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.data.id, sampleProduct.id);
    assert.equal(body.data.price, "4.50");
  });
});

test("product query parameters are validated before calling the service", async () => {
  await withApp(dependencies, async (baseUrl) => {
    const response = await fetch(
      `${baseUrl}/api/products?includeUnavailable=sometimes`,
    );

    assert.equal(response.status, 400);
    assert.equal(
      (await response.json()).error.code,
      "VALIDATION_ERROR",
    );
  });
});

test("product creation accepts exact decimal string prices", async () => {
  await withApp(dependencies, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Flat White",
        price: "4.50",
        category: "Coffee",
      }),
    });

    assert.equal(response.status, 201);
    const body = await response.json();
    assert.equal(body.data.price, "4.50");
  });
});

test("product creation validates decimal price input", async () => {
  await withApp(dependencies, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Flat White",
        price: 4.5,
        category: "Coffee",
      }),
    });

    assert.equal(response.status, 400);
    assert.equal(
      (await response.json()).error.code,
      "VALIDATION_ERROR",
    );
  });
});

test("product creation accepts urlencoded form bodies", async () => {
  await withApp(dependencies, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/products`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        name: "Flat White",
        price: "4.50",
        category: "Coffee",
      }),
    });

    assert.equal(response.status, 201);
  });
});

test("missing products return a structured not-found error", async () => {
  await withApp(dependencies, async (baseUrl) => {
    const response = await fetch(
      `${baseUrl}/api/products/550e8400-e29b-41d4-a716-446655440001`,
    );

    assert.equal(response.status, 404);
    assert.equal((await response.json()).error.code, "PRODUCT_NOT_FOUND");
  });
});

test("unknown API routes return a structured not-found error", async () => {
  await withApp(dependencies, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/not-a-route`);

    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), {
      error: {
        code: "ROUTE_NOT_FOUND",
        message: "Route was not found.",
      },
    });
  });
});

async function withApp(
  appDependencies: Parameters<typeof createApp>[0],
  callback: (baseUrl: string) => Promise<void>,
): Promise<void> {
  const server = createApp(appDependencies).listen(0);
  await once(server, "listening");

  const address = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    await callback(baseUrl);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}
