import dns from "node:dns";
import { lookup } from "node:dns/promises";
import { Pool, type PoolConfig } from "pg";

dns.setDefaultResultOrder("ipv4first");

let pool: Pool | null = null;
let poolInit: Promise<Pool> | null = null;

function getConnectionString(): string {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error("DATABASE_URL debe estar definida (Supabase Postgres).");
  }
  return connectionString;
}

/** Normaliza URI postgres (quita corchetes erróneos en la contraseña). */
function parsePostgresUrl(connectionString: string): URL {
  const normalized = connectionString.replace(/^postgresql:/i, "postgres:");
  const url = new URL(normalized);
  if (url.password.startsWith("[") && url.password.endsWith("]")) {
    url.password = url.password.slice(1, -1);
  }
  return url;
}

async function buildPoolConfig(): Promise<PoolConfig> {
  const connectionString = getConnectionString();
  const url = parsePostgresUrl(connectionString);
  const hostname = url.hostname;

  const config: PoolConfig = {
    host: hostname,
    port: url.port ? Number(url.port) : 5432,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, "") || "postgres",
  };

  if (connectionString.includes("supabase")) {
    const { address } = await lookup(hostname, { family: 4 });
    config.host = address;
    config.ssl = { rejectUnauthorized: false, servername: hostname };
  }

  return config;
}

async function getPool(): Promise<Pool> {
  if (pool) return pool;
  if (!poolInit) {
    poolInit = buildPoolConfig().then((config) => {
      pool = new Pool(config);
      return pool;
    });
  }
  return poolInit;
}

/** Consulta a la única base de datos multi-tenant (filtrar siempre por gimnasio_id en la app). */
export async function query<T = unknown>(
  text: string,
  params?: unknown[]
): Promise<{ rows: T[]; rowCount: number }> {
  const client = await (await getPool()).connect();
  try {
    const result = await client.query(text, params);
    return { rows: result.rows as T[], rowCount: result.rowCount ?? 0 };
  } finally {
    client.release();
  }
}
