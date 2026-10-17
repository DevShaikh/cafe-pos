import cors from "cors";
import express from "express";
import helmet from "helmet";
import { errorHandler } from "./middleware/error-handler.js";
import { notFound } from "./middleware/not-found.js";
import { requestLogger } from "./middleware/request-logger.js";
import { createRoutes, type RouteDependencies } from "./routes/index.js";

interface AppDependencies extends RouteDependencies {
  clientOrigin: string;
}

export function createApp({
  clientOrigin,
  ...routeDependencies
}: AppDependencies) {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: clientOrigin }));
  app.use(express.json());
  app.use(requestLogger);

  app.use("/api", createRoutes(routeDependencies));

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
