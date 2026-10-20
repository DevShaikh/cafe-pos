/**
 * @file src/app.ts
 * @description Main Express application setup.
 */

import express, { Application, Request, Response, NextFunction } from "express";

import cors from "cors"; // For handling Cross-Origin Resource Sharing
import helmet from "helmet"; // For setting various HTTP headers for security

import configuration from "./config/env";
import requestLogger from "./middleware/request-logger";

import AppError from "./utils/app-error";

import { errorHandler } from "./middleware/error-handler";

import apiRoutes from "./routes";

const app: Application = express();

// Essential Security Middleware
app.use(helmet());
app.use(cors({ origin: configuration.clientOrigin }));
// Body parsers
app.use(express.json()); // Parses incoming requests with JSON payloads
app.use(express.urlencoded({ extended: true })); // Parses incoming requests with URL-encoded payloads

// Custom Logging Middleware
app.use(requestLogger);

// Welcome route for the API
app.get("/", (_req, res) => {
  res.json({
    message: "Welcome to the API",
    version: configuration.version,
    environment: configuration.environment,
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api", apiRoutes);

// Handle 404 Not Found errors for any unhandled routes
app.use((req: Request, res: Response, next: NextFunction) => {
  next(new AppError(404, "NOT_FOUND", `Route ${req.originalUrl} not found.`));
});

// Global Error Handling Middleware (MUST be the last middleware)
app.use(errorHandler);

export default app;
