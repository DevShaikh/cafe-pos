import { createServer } from "node:http";
import { createApp } from "./app.js";
import { configuration } from "./config/env.js";
import { prisma } from "./lib/prismaClient.js";
import { PrismaHealthRepository } from "./modules/health/health.repository.js";
import { HealthService } from "./modules/health/health.service.js";
import { PrismaProductRepository } from "./modules/product/product.repository.js";
import { ProductService } from "./modules/product/product.service.js";

const app = createApp({
  clientOrigin: configuration.clientOrigin,
  healthService: new HealthService(new PrismaHealthRepository(prisma)),
  productService: new ProductService(new PrismaProductRepository(prisma)),
});

const server = createServer(app);
let shutdownStarted = false;

function shutdown(reason: string, exitCode = 0): void {
  if (shutdownStarted) {
    return;
  }

  shutdownStarted = true;
  console.info(`Shutting down Cafe POS server (${reason}).`);

  let finalExitCode = exitCode;
  const forceShutdownTimer = setTimeout(() => {
    console.error("Graceful shutdown timed out; forcing process exit.");
    process.exit(1);
  }, 10_000);
  forceShutdownTimer.unref();

  const closeHttpServer = new Promise<void>((resolve) => {
    if (!server.listening) {
      resolve();
      return;
    }

    server.close((error) => {
      if (error) {
        console.error("Failed to close the HTTP server cleanly.", error);
        finalExitCode = 1;
      }
      resolve();
    });
  });

  void closeHttpServer
    .then(() => prisma.$disconnect())
    .then(() => {
      process.exitCode = finalExitCode;
    })
    .catch((error: unknown) => {
      console.error("Failed to disconnect Prisma cleanly.", error);
      process.exitCode = 1;
    })
    .finally(() => {
      clearTimeout(forceShutdownTimer);
    });
}

server.on("error", (error: Error) => {
  console.error("HTTP server error.", error);
  shutdown("HTTP server error", 1);
});

process.on("uncaughtException", (error: Error) => {
  console.error("Uncaught exception.", error);
  shutdown("uncaught exception", 1);
});

process.on("unhandledRejection", (reason: unknown) => {
  console.error("Unhandled promise rejection.", reason);
  shutdown("unhandled rejection", 1);
});

process.on("SIGTERM", () => {
  shutdown("SIGTERM");
});

process.on("SIGINT", () => {
  shutdown("SIGINT");
});

server.listen(configuration.port, () => {
  console.info(
    `Cafe POS server running in ${configuration.nodeEnv} mode on port ${configuration.port}`,
  );
  console.info(`API available at http://localhost:${configuration.port}/api`);
});
