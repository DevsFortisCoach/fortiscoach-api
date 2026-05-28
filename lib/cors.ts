import { TENANT_SLUG_HEADER } from "@/lib/tenant";

const LOCALHOST_HOSTS = new Set(["localhost", "127.0.0.1"]);

function tenantBaseDomain(): string {
  return (process.env.TENANT_BASE_DOMAIN ?? "fortiscoach.cl").toLowerCase();
}

function isAllowedHostname(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (LOCALHOST_HOSTS.has(host)) return true;
  if (host.endsWith(".localhost")) return true;

  const base = tenantBaseDomain();
  if (host === base || host === `www.${base}`) return true;
  if (host.endsWith(`.${base}`)) return true;

  if (process.env.ALLOW_VERCEL_PREVIEW === "true" && host.endsWith(".vercel.app")) {
    return true;
  }

  const extra = process.env.CORS_EXTRA_HOSTS?.split(",").map((h) => h.trim().toLowerCase()) ?? [];
  return extra.includes(host);
}

export function isAllowedOrigin(origin: string | null | undefined): boolean {
  if (!origin) return true;
  try {
    const { hostname } = new URL(origin);
    return isAllowedHostname(hostname);
  } catch {
    return false;
  }
}

function defaultAllowOrigin(): string {
  return (
    process.env.CORS_DEFAULT_ORIGIN ??
    `https://${tenantBaseDomain()}`
  );
}

export function getCorsHeaders(origin?: string | null): Record<string, string> {
  const allowOrigin =
    origin && isAllowedOrigin(origin) ? origin : defaultAllowOrigin();

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": `Content-Type, Authorization, ${TENANT_SLUG_HEADER}`,
    "Access-Control-Max-Age": "86400",
  };
}
