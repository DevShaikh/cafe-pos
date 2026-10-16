import { z } from "zod";

const environmentSchema = z.object({
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

export const configuration = {
  port: environment.PORT,
  databaseUrl: environment.DATABASE_URL,
  clientOrigin: environment.CLIENT_ORIGIN,
};
