import type { Pool, PoolClient } from "pg";

export interface TenantScope {
  dairyId: string;
  userId: string;
}

export async function withTenantTransaction<T>(
  pool: Pick<Pool, "connect">,
  scope: TenantScope,
  work: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "SELECT set_config('app.dairy_id', $1, true), set_config('app.user_id', $2, true)",
      [scope.dairyId, scope.userId],
    );
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}
