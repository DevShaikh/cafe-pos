const fs = require("node:fs");
const Database = require("better-sqlite3");

async function main() {
  const [operation, sourcePath, targetPath] = process.argv.slice(2);
  if (!operation || !sourcePath) {
    throw new Error("Usage: desktop-data.cjs inspect|backup|verify <source> [target]");
  }

  if (operation === "backup") {
    if (!targetPath) throw new Error("A backup target path is required.");
    const database = new Database(sourcePath, {
      readonly: true,
      fileMustExist: true,
    });
    try {
      await database.backup(targetPath);
    } finally {
      database.close();
    }
    return;
  }

  if (operation !== "inspect" && operation !== "verify") {
    throw new Error(`Unknown database operation: ${operation}`);
  }
  if (!fs.existsSync(sourcePath)) {
    process.stdout.write(JSON.stringify({ exists: false }));
    return;
  }

  const database = new Database(sourcePath, {
    readonly: true,
    fileMustExist: true,
  });
  try {
    const integrity = database.pragma("integrity_check", { simple: true });
    const tables = database
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
      .all()
      .map(({ name }) => name);
    const coreMigration = tables.includes("_prisma_migrations")
      ? database
          .prepare(
            "SELECT finished_at FROM _prisma_migrations WHERE migration_name = ?",
          )
          .get("20261026175721_add_pos_core_models")
      : undefined;
    const appliedMigrations = tables.includes("_prisma_migrations")
      ? database
          .prepare(
            "SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL",
          )
          .all()
          .map(({ migration_name }) => migration_name)
      : [];
    const result = {
      exists: true,
      integrity,
      tables,
      coreMigrationApplied: Boolean(coreMigration?.finished_at),
      appliedMigrations,
    };
    process.stdout.write(JSON.stringify(result));
    if (operation === "verify" && integrity !== "ok") process.exitCode = 2;
  } finally {
    database.close();
  }
}

main().catch((error) => {
  console.error(error.stack ?? error.message);
  process.exitCode = 1;
});
