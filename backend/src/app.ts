import { randomUUID } from "node:crypto";
import express, { type Express } from "express";
import type { Logger } from "pino";
import type { Pool } from "pg";
import { createErrorHandler } from "./common/middleware/error-handler.js";
import { HttpError } from "./common/errors/http-error.js";
import { createLogger } from "./common/logging/logger.js";
import { createAuthRouter } from "./modules/auth/auth-router.js";

export type DatabaseReadinessCheck = () => Promise<void>;

export interface CreateAppOptions {
  databaseReadiness?: DatabaseReadinessCheck | null;
  databasePool?: Pool | null;
  allowOwnerSelfRegistration?: boolean;
  logger?: Logger;
}

const REQUEST_ID_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/;

export function createApp(options: CreateAppOptions = {}): Express {
  const app = express();
  const logger = options.logger ?? createLogger();

  app.disable("x-powered-by");

  app.use((request, response, next) => {
    const suppliedId = request.get("x-request-id");
    const requestId = suppliedId && REQUEST_ID_PATTERN.test(suppliedId) ? suppliedId : randomUUID();
    const startedAt = process.hrtime.bigint();

    response.setHeader("x-request-id", requestId);
    response.on("finish", () => {
      const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
      logger.info({
        requestId,
        method: request.method,
        path: request.path,
        statusCode: response.statusCode,
        durationMs: Number(durationMs.toFixed(2)),
      }, "HTTP request completed");
    });

    next();
  });

  app.use(express.json({ limit: "100kb", strict: true }));

  app.get("/health", (_request, response) => {
    response.status(200).json({
      status: "ok",
      service: "milk-api",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
    });
  });

  app.get("/health/ready", async (_request, response) => {
    if (!options.databaseReadiness) {
      response.status(503).json({
        status: "not_ready",
        dependencies: { database: "not_configured" },
      });
      return;
    }

    try {
      await options.databaseReadiness();
      response.status(200).json({
        status: "ready",
        dependencies: { database: "ready" },
      });
    } catch (error) {
      logger.warn({ err: error }, "Database readiness check failed");
      response.status(503).json({
        status: "not_ready",
        dependencies: { database: "unavailable" },
      });
    }
  });

  app.use("/api/v1/auth", createAuthRouter(options.databasePool ?? null, {
    allowOwnerSelfRegistration: options.allowOwnerSelfRegistration ?? false,
  }));

  app.use((_request, _response, next) => {
    next(new HttpError(404, "NOT_FOUND", "The requested resource was not found"));
  });

  app.use(createErrorHandler(logger));

  return app;
}
