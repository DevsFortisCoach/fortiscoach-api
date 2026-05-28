import { Pool } from "pg";

let pool: Pool | null = null;

function getConnectionString(): string {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL debe estar definida (Supabase Postgres).");
  }
  return connectionString;
}

function getPool(): Pool {
  if (!pool) {
    const connectionString = getConnectionString();
    pool = new Pool({
      connectionString,
      ssl: connectionString.includes("supabase")
        ? { rejectUnauthorized: false }
        : undefined,
    });
  }
  return pool;
}

/** Consulta a la única base de datos multi-tenant (filtrar siempre por gimnasio_id en la app). */
export async function query<T = unknown>(
  text: string,
  params?: unknown[]
): Promise<{ rows: T[]; rowCount: number }> {
  const client = await getPool().connect();
  try {
    const result = await client.query(text, params);
    return { rows: result.rows as T[], rowCount: result.rowCount ?? 0 };
  } finally {
    client.release();
  }
}
