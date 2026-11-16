import { createApp, type DatabaseReadinessCheck } from "./app.js";
import { createLogger } from "./common/logging/logger.js";
import { parseEnvironment } from "./config/env.js";
import { createDatabasePool } from "./database/pool.js";

const config = parseEnvironment();
const logger = createLogger(config.logLevel);
const pool = createDatabasePool(config, logger);

const databaseReadiness: DatabaseReadinessCheck | null = pool
  ? async () => {
      const result = await pool.query<{ postgis_version: string }>(
        "SELECT PostGIS_Full_Version() AS postgis_version",
      );
      if (!result.rows[0]?.postgis_version) {
        throw new Error("PostGIS readiness query returned no version");
      }
    }
  : null;

const app = createApp({ databasePool: pool, databaseReadiness, logger });
const server = app.listen(config.port, config.host, () => {
  logger.info({ host: config.host, port: config.port, nodeEnv: config.nodeEnv }, "Milk API listening");
});

let shuttingDown = false;
function shutdown(signal: NodeJS.Signals): void {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, "Graceful shutdown started");

  server.close((error) => {
    void (async () => {
      await pool?.end();
      if (error) {
        logger.error({ err: error }, "HTTP server shutdown failed");
        process.exitCode = 1;
        return;
      }
      logger.info("Milk API shutdown complete");
    })().catch((shutdownError: unknown) => {
      logger.error({ err: shutdownError }, "Database pool shutdown failed");
      process.exitCode = 1;
    });
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

server.on("error", (error) => {
  logger.fatal({ err: error }, "HTTP server failed to start or crashed");
  void pool?.end().finally(() => {
    process.exitCode = 1;
  });
});
