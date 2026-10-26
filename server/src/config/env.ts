import dotenv from "dotenv";
import path from "node:path";
import { z } from "zod";

import { resolveDatabaseUrl } from "../lib/databaseUrl";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const environmentSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000), // Optional: defaults to a SQLite file at server/data/cafe-pos.db
  DATABASE_URL: z.string().optional(),
  CLIENT_ORIGIN: z.url().default("http://localhost:3001"),
  JWT_SECRET: z.string().min(32).optional(),
}).superRefine((environment, context) => {
  if (environment.NODE_ENV === "production" && !environment.JWT_SECRET) {
    context.addIssue({
      code: "custom",
      path: ["JWT_SECRET"],
      message: "JWT_SECRET must be configured in production.",
    });
  }
});

const environment = environmentSchema.parse(process.env);

const configuration = {
  port: environment.PORT,
  nodeEnv: environment.NODE_ENV,
  databaseUrl: resolveDatabaseUrl(environment.DATABASE_URL),
  clientOrigin: environment.CLIENT_ORIGIN,
  jwtSecret: environment.JWT_SECRET,
  version: process.env.npm_package_version || "0.0.0",
  environment: process.env.npm_package_environment || "development",
};

export { configuration };
export default configuration;
