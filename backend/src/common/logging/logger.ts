import pino, { type Logger, type LoggerOptions } from "pino";

export function createLogger(level: NonNullable<LoggerOptions["level"]> = "info"): Logger {
  return pino({
    level,
    base: { service: "milk-api" },
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: {
      paths: [
        "req.headers.authorization",
        "req.headers.cookie",
        "res.headers.set-cookie",
        "password",
        "pin",
        "token",
        "accessToken",
        "refreshToken",
      ],
      censor: "[REDACTED]",
    },
  });
}
