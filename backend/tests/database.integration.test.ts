import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import test from "node:test";
import { withTenantTransaction } from "../src/common/authorization/tenant-transaction.js";
import { runMigrations } from "../src/database/migrations/runner.js";

const databaseUrl = process.env.DATABASE_URL;

test("fresh PostGIS database migrates and remains idempotent", { skip: !databaseUrl }, async () => {
  const pool = new Pool({
    connectionString: databaseUrl,
    max: 2,
    connectionTimeoutMillis: 5_000,
  });

  try {
    await runMigrations(pool);
    const postgis = await pool.query<{ version: string }>(
      "SELECT PostGIS_Full_Version() AS version",
    );
    assert.ok(postgis.rows[0]?.version.includes("POSTGIS="));

    const migrations = await pool.query<{ version: string }>(
      "SELECT version FROM public.schema_migrations ORDER BY version",
    );
    assert.deepEqual(migrations.rows.map((row) => row.version), [
      "001_enable_postgis.sql",
      "002_create_dairies.sql",
      "003_create_identity_and_sessions.sql",
    ]);

    const rerun = await runMigrations(pool);
    assert.deepEqual(rerun, []);

    const dairyId = randomUUID();
    const userId = randomUUID();
    const dairy = await withTenantTransaction(pool, { dairyId, userId }, (client) =>
      client.query<{ id: string; timezone: string }>(
        "INSERT INTO public.dairies (id, name) VALUES ($1, $2) RETURNING id, timezone",
        [dairyId, "Test dairy"],
      ),
    );
    assert.match(dairy.rows[0]?.id ?? "", /^[0-9a-f-]{36}$/i);
    assert.equal(dairy.rows[0]?.timezone, "Asia/Kolkata");

    const hidden = await pool.query("SELECT id FROM public.dairies WHERE id = $1", [dairyId]);
    assert.equal(hidden.rowCount, 0);
    const visible = await withTenantTransaction(pool, { dairyId, userId }, (client) =>
      client.query("SELECT id FROM public.dairies WHERE id = $1", [dairyId]),
    );
    assert.equal(visible.rowCount, 1);
  } finally {
    await pool.end();
  }
});
