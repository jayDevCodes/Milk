import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Pool } from "pg";

const MIGRATION_LOCK_ID = 8044619;
const MIGRATIONS_DIRECTORY = join(import.meta.dirname, ".");

type AppliedMigration = { version: string; checksum: string };

export async function runMigrations(
  pool: Pick<Pool, "connect">,
  migrationsDirectory = MIGRATIONS_DIRECTORY,
): Promise<string[]> {
  const client = await pool.connect();
  let lockAcquired = false;

  try {
    await client.query("SELECT pg_advisory_lock($1)", [MIGRATION_LOCK_ID]);
    lockAcquired = true;

    await client.query(
      "CREATE TABLE IF NOT EXISTS public.schema_migrations (" +
        "version text PRIMARY KEY, " +
        "checksum text NOT NULL CHECK (checksum ~ '^[a-f0-9]{64}$'), " +
        "applied_at timestamptz NOT NULL DEFAULT now()" +
      ")",
    );

    const files = (await readdir(migrationsDirectory))
      .filter((file) => /^\d{3,}_[a-z0-9_]+\.sql$/.test(file))
      .sort((left, right) => left.localeCompare(right));

    if (files.length === 0) {
      throw new Error("No SQL migrations found in " + migrationsDirectory);
    }

    const appliedResult = await client.query<AppliedMigration>(
      "SELECT version, checksum FROM public.schema_migrations ORDER BY version",
    );
    const applied = new Map(appliedResult.rows.map((row) => [row.version, row.checksum]));
    const newlyApplied: string[] = [];

    for (const file of files) {
      const sql = await readFile(join(migrationsDirectory, file), "utf8");
      const checksum = createHash("sha256").update(sql).digest("hex");
      const existingChecksum = applied.get(file);

      if (existingChecksum) {
        if (existingChecksum !== checksum) {
          throw new Error("Applied migration " + file + " has changed; create a new forward migration instead");
        }
        continue;
      }

      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query(
          "INSERT INTO public.schema_migrations (version, checksum) VALUES ($1, $2)",
          [file, checksum],
        );
        await client.query("COMMIT");
        newlyApplied.push(file);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }

    return newlyApplied;
  } finally {
    if (lockAcquired) {
      await client.query("SELECT pg_advisory_unlock($1)", [MIGRATION_LOCK_ID]).catch(() => undefined);
    }
    client.release();
  }
}
