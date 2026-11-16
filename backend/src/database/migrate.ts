import { createLogger } from "../common/logging/logger.js";
import { parseEnvironment } from "../config/env.js";
import { createDatabasePool } from "./pool.js";
import { runMigrations } from "./migrations/runner.js";

async function main(): Promise<void> {
  const config = parseEnvironment();
  if (!config.databaseUrl) {
    throw new Error("DATABASE_URL is required to run database migrations");
  }

  const logger = createLogger(config.logLevel);
  const pool = createDatabasePool(config, logger);
  if (!pool) throw new Error("Database pool could not be created");

  try {
    const applied = await runMigrations(pool);
    logger.info({ appliedCount: applied.length, applied }, "Database migrations completed");
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error("Database migration failed:", error);
  process.exitCode = 1;
});
