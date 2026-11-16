import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import test from "node:test";
import { withTenantTransaction } from "../src/common/authorization/tenant-transaction.js";
import { runMigrations } from "../src/database/migrations/runner.js";

const databaseUrl = process.env.DATABASE_URL;

test("fresh PostGIS database migrates and remains idempotent", { skip: !databaseUrl }, async () => {
  const pool = new Pool({ connectionString: databaseUrl, max: 2, connectionTimeoutMillis: 5_000 });

  try {
    await runMigrations(pool);
    const postgis = await pool.query<{ version: string }>("SELECT PostGIS_Full_Version() AS version");
    assert.ok(postgis.rows[0]?.version.includes("POSTGIS="));

    const migrations = await pool.query<{ version: string }>(
      "SELECT version FROM public.schema_migrations ORDER BY version",
    );
    assert.deepEqual(migrations.rows.map((row) => row.version), [
      "001_enable_postgis.sql",
      "002_create_dairies.sql",
      "003_create_identity_and_sessions.sql",
    ]);
    assert.deepEqual(await runMigrations(pool), []);

    const firstDairyId = randomUUID();
    const secondDairyId = randomUUID();
    const userId = randomUUID();

    await withTenantTransaction(pool, { dairyId: firstDairyId, userId }, (client) =>
      client.query("INSERT INTO public.dairies (id, name) VALUES ($1, $2)", [firstDairyId, "First tenant"]),
    );
    await withTenantTransaction(pool, { dairyId: secondDairyId, userId }, (client) =>
      client.query("INSERT INTO public.dairies (id, name) VALUES ($1, $2)", [secondDairyId, "Second tenant"]),
    );

    await pool.query(
      "DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'milk_rls_test') " +
      "THEN CREATE ROLE milk_rls_test NOLOGIN NOSUPERUSER NOBYPASSRLS; END IF; END $$",
    );
    await pool.query("GRANT USAGE ON SCHEMA public TO milk_rls_test");
    await pool.query("GRANT SELECT ON public.dairies TO milk_rls_test");

    const visible = await withTenantTransaction(
      pool,
      { dairyId: firstDairyId, userId },
      async (client) => {
        await client.query("SET LOCAL ROLE milk_rls_test");
        return client.query<{ id: string }>("SELECT id FROM public.dairies ORDER BY id");
      },
    );
    assert.deepEqual(visible.rows.map((row) => row.id), [firstDairyId]);

    const unscopedClient = await pool.connect();
    try {
      await unscopedClient.query("BEGIN");
      await unscopedClient.query("SET LOCAL ROLE milk_rls_test");
      const unscoped = await unscopedClient.query("SELECT id FROM public.dairies");
      assert.equal(unscoped.rowCount, 0);
      await unscopedClient.query("COMMIT");
    } catch (error) {
      await unscopedClient.query("ROLLBACK").catch(() => undefined);
      throw error;
    } finally {
      unscopedClient.release();
    }
  } finally {
    await pool.end();
  }
});
