/**
 * @file src/server.ts
 * @description Server bootstrapping and global process-level error handling.
 */

import http from "http";
import app from "./app";
import env from "./config/env";

// 1. Create the HTTP Server explicitly
const httpServer = http.createServer(app);

// --- Global Process Error Handling ---
// Handle uncaught exceptions (synchronous errors not caught by try/catch)
process.on("uncaughtException", (err: Error) => {
  console.error("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  console.error(err.name, err.message, err.stack);
  // Exit the process after logging the error
  process.exit(1); // 1 indicates an error
});

// Start the Express server
const server = httpServer.listen(env.port, () => {
  console.log(`Server running in ${env.nodeEnv} mode on port ${env.port}`);
  console.log(`Access API at http://localhost:${env.port}/api`);
});

// Handle unhandled promise rejections (asynchronous errors not caught by .catch())
process.on("unhandledRejection", (reason: Error | never) => {
  console.error("UNHANDLED REJECTION! 💥 Shutting down...");
  console.error(reason.name, reason.message, reason.stack || reason);
  // Close server and exit process
  server.close(() => {
    process.exit(1); // 1 indicates an error
  });
});

// Optional: Handle SIGTERM (e.g., from Heroku or Docker stop)
process.on("SIGTERM", () => {
  console.log("👋 SIGTERM RECEIVED. Shutting down gracefully...");
  // stopMarketAnalysisJobs();
  server.close(() => {
    console.log("Process terminated!");
  });
});
