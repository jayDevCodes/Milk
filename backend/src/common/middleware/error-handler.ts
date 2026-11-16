import type { ErrorRequestHandler } from "express";
import type { Logger } from "pino";
import { ZodError } from "zod";
import { HttpError } from "../errors/http-error.js";

type ParserError = Error & { status?: number; type?: string };

export function createErrorHandler(logger: Logger): ErrorRequestHandler {
  return (error: unknown, request, response, _next) => {
    const requestId = String(response.getHeader("x-request-id") ?? "");
    let statusCode = 500;
    let code = "INTERNAL_SERVER_ERROR";
    let message = "An unexpected error occurred";
    let details: Array<{ path: string; message: string }> | undefined;

    if (error instanceof HttpError) {
      statusCode = error.statusCode;
      code = error.code;
      message = error.message;
    } else if (error instanceof ZodError) {
      statusCode = 400;
      code = "VALIDATION_ERROR";
      message = "Request validation failed";
      details = error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      }));
    } else {
      const parserError = error as ParserError;
      if (parserError?.status === 400 || parserError?.type === "entity.parse.failed") {
        statusCode = 400;
        code = "INVALID_JSON";
        message = "Request body must contain valid JSON";
      }
    }

    const log = statusCode >= 500 ? logger.error.bind(logger) : logger.warn.bind(logger);
    log({ err: error, requestId, method: request.method, path: request.path, statusCode }, "Request failed");

    response.status(statusCode).json({
      error: {
        code,
        message,
        requestId,
        ...(details ? { details } : {}),
      },
    });
  };
}
