import "dotenv/config";
import { configuration } from "./config.js";
import { createApp } from "./app.js";
import { PrismaHealthRepository } from "./features/health/health.repository.js";
import { HealthService } from "./features/health/health.service.js";
import { PrismaProductRepository } from "./features/products/product.repository.js";
import { ProductService } from "./features/products/product.service.js";
import { prisma } from "./lib/prisma.js";

const app = createApp({
  clientOrigin: configuration.clientOrigin,
  healthService: new HealthService(new PrismaHealthRepository(prisma)),
  productService: new ProductService(new PrismaProductRepository(prisma)),
});

app.listen(configuration.port, () => {
  console.log(`Cafe POS server listening on port ${configuration.port}`);
});
