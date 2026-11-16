import assert from "node:assert/strict";
import { once } from "node:events";
import test from "node:test";
import { createApp, type DatabaseReadinessCheck } from "../src/app.js";
import { createLogger } from "../src/common/logging/logger.js";

async function withServer(
  readiness: DatabaseReadinessCheck | null,
  run: (baseUrl: string) => Promise<void>,
): Promise<void> {
  const app = createApp({ databaseReadiness: readiness, logger: createLogger("silent") });
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Test server did not bind to a TCP port");
  }

  try {
    await run("http://127.0.0.1:" + address.port);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
}

test("GET /health reports process health without depending on PostgreSQL", async () => {
  await withServer(null, async (baseUrl) => {
    const response = await fetch(baseUrl + "/health");
    const body = await response.json() as { status: string; service: string; timestamp: string };
    assert.equal(response.status, 200);
    assert.equal(body.status, "ok");
    assert.equal(body.service, "milk-api");
    assert.ok(Number.isFinite(Date.parse(body.timestamp)));
  });
});

test("GET /health/ready returns 503 when the database is not configured", async () => {
  await withServer(null, async (baseUrl) => {
    const response = await fetch(baseUrl + "/health/ready");
    const body = await response.json() as { status: string; dependencies: { database: string } };
    assert.equal(response.status, 503);
    assert.equal(body.status, "not_ready");
    assert.equal(body.dependencies.database, "not_configured");
  });
});

test("GET /health/ready returns 200 when the database probe succeeds", async () => {
  await withServer(async () => undefined, async (baseUrl) => {
    const response = await fetch(baseUrl + "/health/ready");
    const body = await response.json() as { status: string; dependencies: { database: string } };
    assert.equal(response.status, 200);
    assert.equal(body.status, "ready");
    assert.equal(body.dependencies.database, "ready");
  });
});

test("GET /health/ready returns 503 when the database probe fails", async () => {
  await withServer(async () => {
    throw new Error("database unavailable");
  }, async (baseUrl) => {
    const response = await fetch(baseUrl + "/health/ready");
    const body = await response.json() as { status: string; dependencies: { database: string } };
    assert.equal(response.status, 503);
    assert.equal(body.status, "not_ready");
    assert.equal(body.dependencies.database, "unavailable");
  });
});

test("request IDs are returned and unsafe supplied IDs are replaced", async () => {
  await withServer(null, async (baseUrl) => {
    const response = await fetch(baseUrl + "/health", {
      headers: { "x-request-id": "field-test:42" },
    });
    assert.equal(response.headers.get("x-request-id"), "field-test:42");

    const unsafe = await fetch(baseUrl + "/health", {
      headers: { "x-request-id": "not an allowed id" },
    });
    const generated = unsafe.headers.get("x-request-id");
    assert.ok(generated && /^[0-9a-f-]{36}$/i.test(generated));
  });
});

test("unknown routes return a stable 404 error envelope with request ID", async () => {
  await withServer(null, async (baseUrl) => {
    const response = await fetch(baseUrl + "/not-a-route");
    const body = await response.json() as { error: { code: string; requestId: string } };
    assert.equal(response.status, 404);
    assert.equal(body.error.code, "NOT_FOUND");
    assert.equal(body.error.requestId, response.headers.get("x-request-id"));
  });
});

test("malformed JSON is rejected by centralized error handling", async () => {
  await withServer(null, async (baseUrl) => {
    const response = await fetch(baseUrl + "/not-a-route", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{",
    });
    const body = await response.json() as { error: { code: string } };
    assert.equal(response.status, 400);
    assert.equal(body.error.code, "INVALID_JSON");
  });
});
