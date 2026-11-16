import { Pool } from "pg";
import type { AppConfig } from "../config/env.js";
import type { Logger } from "pino";

export function createDatabasePool(config: AppConfig, logger?: Logger): Pool | null {
  if (!config.databaseUrl) return null;

  const pool = new Pool({
    connectionString: config.databaseUrl,
    max: config.databasePoolMax,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    statement_timeout: 10_000,
    ...(config.databaseSsl ? { ssl: { rejectUnauthorized: true } } : {}),
    application_name: "milk-api",
  });

  pool.on("error", (error) => {
    logger?.error({ err: error }, "Unexpected idle PostgreSQL client error");
  });

  return pool;
}
