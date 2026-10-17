import fs from "node:fs";
import path from "node:path";

/** Used when DATABASE_URL is not set. The file is created on first use. */
const DEFAULT_DATABASE_URL = "file:./data/cafe-pos.db";

/** The `server/` folder. Works from both `src/lib` and `dist/lib`. */
const SERVER_ROOT = path.resolve(__dirname, "../..");

/**
 * Turns DATABASE_URL into one absolute `file:` URL and makes sure its folder
 * exists. Relative paths are resolved from the `server/` folder, so the app and
 * the Prisma CLI always open the same file no matter where they are started.
 *
 * @example
 * resolveDatabaseUrl("file:./data/cafe-pos.db"); // file:C:/.../server/data/cafe-pos.db
 */
export function resolveDatabaseUrl(
  rawUrl: string | undefined = process.env.DATABASE_URL,
): string {
  const value = rawUrl?.trim() || DEFAULT_DATABASE_URL;

  if (!value.startsWith("file:") || value === "file:") {
    throw new Error(
      `DATABASE_URL must be a SQLite file URL such as "${DEFAULT_DATABASE_URL}".`,
    );
  }

  const absolutePath = path.resolve(SERVER_ROOT, value.slice("file:".length));
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });

  return `file:${absolutePath.replace(/\\/g, "/")}`;
}
