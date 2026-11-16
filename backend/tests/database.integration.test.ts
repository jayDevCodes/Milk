import assert from "node:assert/strict";
import { Pool } from "pg";
import test from "node:test";
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
    ]);

    const rerun = await runMigrations(pool);
    assert.deepEqual(rerun, []);

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const dairy = await client.query<{ id: string; timezone: string }>(
        "INSERT INTO public.dairies (name) VALUES ($1) RETURNING id, timezone",
        ["Test dairy"],
      );
      assert.match(dairy.rows[0]?.id ?? "", /^[0-9a-f-]{36}$/i);
      assert.equal(dairy.rows[0]?.timezone, "Asia/Kolkata");
      await client.query("ROLLBACK");
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }
});
