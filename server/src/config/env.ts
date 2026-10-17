import dotenv from "dotenv";
import path from "node:path";
import { z } from "zod";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const environmentSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  DATABASE_URL: z
    .url()
    .refine(
      (value) =>
        value.startsWith("postgresql://") || value.startsWith("postgres://"),
      "DATABASE_URL must be a PostgreSQL connection URL.",
    ),
  CLIENT_ORIGIN: z.url().default("http://localhost:3000"),
});

const environment = environmentSchema.parse(process.env);

const configuration = {
  nodeEnv: environment.NODE_ENV,
  port: environment.PORT,
  databaseUrl: environment.DATABASE_URL,
  clientOrigin: environment.CLIENT_ORIGIN,
};

export { configuration };
export default configuration;
