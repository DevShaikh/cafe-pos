/**
 * @file src/server.ts
 * @description Server bootstrapping and graceful shutdown.
 */

import http from "http";
import app from "./app";
import env from "./config/env";
import { prismaClient } from "./lib/prismaClient";

// Create the HTTP server explicitly so it can be closed on shutdown
const server = http.createServer(app);

let shuttingDown = false;

/**
 * Stops accepting new connections, finishes in-flight requests, closes the
 * database connection, then lets the process exit.
 * @param reason What triggered the shutdown (for the log).
 * @param exitCode 0 for a normal stop, 1 when triggered by an error.
 */
function shutdown(reason: string, exitCode = 0): void {
  if (shuttingDown) return;
  shuttingDown = true;
  console.info(`Shutting down (${reason})...`);

  // Safety net: force exit if shutdown hangs. Created here, not at startup,
  // so it can never fire while the server is running normally.
  const forceExitTimer = setTimeout(() => {
    console.error("Graceful shutdown timed out; forcing exit.");
    process.exit(1);
  }, 10_000);
  forceExitTimer.unref();

  const disconnectDatabase = async (code: number) => {
    try {
      await prismaClient.$disconnect();
    } catch (error) {
      console.error("Failed to disconnect Prisma cleanly.", error);
      code = 1;
    }
    clearTimeout(forceExitTimer);
    console.info("Shutdown complete.");
    process.exitCode = code;
  };

  if (!server.listening) {
    void disconnectDatabase(exitCode);
    return;
  }

  server.close((error) => {
    if (error) console.error("Failed to close the HTTP server cleanly.", error);
    void disconnectDatabase(error ? 1 : exitCode);
  });

  // Drop idle keep-alive connections so server.close() is not kept waiting
  server.closeIdleConnections();
}

// --- Global process error handling ---
server.on("error", (error: Error) => {
  console.error("HTTP server error:", error);
  shutdown("server error", 1);
});

// Synchronous errors that nothing caught
process.on("uncaughtException", (error: Error) => {
  console.error("UNCAUGHT EXCEPTION!", error);
  shutdown("uncaught exception", 1);
});

// Async errors that nothing caught
process.on("unhandledRejection", (reason: unknown) => {
  console.error("UNHANDLED REJECTION!", reason);
  shutdown("unhandled rejection", 1);
});

// Normal stop signals (Ctrl+C, docker stop, hosting platforms)
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

server.listen(env.port, () => {
  console.log(`Server running in ${env.nodeEnv} mode on port ${env.port}`);
  console.log(`Access API at http://localhost:${env.port}/api`);
});
