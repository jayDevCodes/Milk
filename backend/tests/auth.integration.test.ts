import assert from "node:assert/strict";
import { once } from "node:events";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import test from "node:test";
import { createApp } from "../src/app.js";
import { createLogger } from "../src/common/logging/logger.js";
import { runMigrations } from "../src/database/migrations/runner.js";
import { isRoleAllowed } from "../src/modules/auth/auth-middleware.js";

const databaseUrl = process.env.DATABASE_URL;

test("owner registration, login, role context, tenant isolation and logout", { skip: !databaseUrl }, async () => {
  const pool = new Pool({ connectionString: databaseUrl, max: 4, connectionTimeoutMillis: 5_000 });
  const app = createApp({ databasePool: pool, allowOwnerSelfRegistration: true, logger: createLogger("silent") });
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Test server did not bind to a TCP port");
  const baseUrl = "http://127.0.0.1:" + address.port;

  try {
    await runMigrations(pool);
    const email = "owner-" + randomUUID() + "@example.test";
    const password = "Milk-Test-Password-2026!";

    const registered = await fetch(baseUrl + "/api/v1/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ dairyName: "North Field Dairy", displayName: "Test Owner", email, password }),
    });
    assert.equal(registered.status, 201);
    const registration = await registered.json() as {
      accessToken: string;
      user: { id: string; email: string };
      dairy: { id: string; role: string };
    };
    assert.equal(registration.user.email, email);
    assert.equal(registration.dairy.role, "OWNER");
    assert.match(registration.accessToken, /^[A-Za-z0-9_-]{43}$/u);

    const me = await fetch(baseUrl + "/api/v1/auth/me", {
      headers: { authorization: "Bearer " + registration.accessToken },
    });
    assert.equal(me.status, 200);
    const profile = await me.json() as { user: { id: string }; dairy: { id: string; role: string } };
    assert.equal(profile.user.id, registration.user.id);
    assert.equal(profile.dairy.id, registration.dairy.id);
    assert.equal(profile.dairy.role, "OWNER");

    const wrongPassword = await fetch(baseUrl + "/api/v1/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password: "wrong-password-123" }),
    });
    assert.equal(wrongPassword.status, 401);

    const loggedIn = await fetch(baseUrl + "/api/v1/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: email.toUpperCase(), password }),
    });
    assert.equal(loggedIn.status, 200);
    const login = await loggedIn.json() as { accessToken: string };
    assert.notEqual(login.accessToken, registration.accessToken);

    const secondEmail = "owner-" + randomUUID() + "@example.test";
    const secondRegistration = await fetch(baseUrl + "/api/v1/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ dairyName: "South Field Dairy", displayName: "Second Owner", email: secondEmail, password }),
    });
    assert.equal(secondRegistration.status, 201);

    assert.equal(isRoleAllowed("OWNER", ["OWNER", "MANAGER"]), true);
    assert.equal(isRoleAllowed("SELLER", ["OWNER", "MANAGER"]), false);

    const loggedOut = await fetch(baseUrl + "/api/v1/auth/logout", {
      method: "POST",
      headers: { authorization: "Bearer " + login.accessToken },
    });
    assert.equal(loggedOut.status, 204);

    const afterLogout = await fetch(baseUrl + "/api/v1/auth/me", {
      headers: { authorization: "Bearer " + login.accessToken },
    });
    assert.equal(afterLogout.status, 401);

    const duplicate = await fetch(baseUrl + "/api/v1/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ dairyName: "Duplicate", displayName: "Duplicate", email, password }),
    });
    assert.equal(duplicate.status, 409);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
    await pool.end();
  }
});
