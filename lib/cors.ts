const LOCALHOST_HOSTS = new Set(["localhost", "127.0.0.1"]);

function configuredOrigins(): string[] {
  const raw = process.env.FRONTEND_URL ?? "http://localhost:3000";
  return raw
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
}

function isAllowedHostname(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (LOCALHOST_HOSTS.has(host)) return true;
  if (host.endsWith(".localhost")) return true;

  if (process.env.ALLOW_VERCEL_PREVIEW === "true" && host.endsWith(".vercel.app")) {
    return true;
  }

  return false;
}

export function isAllowedOrigin(origin: string | null | undefined): boolean {
  if (!origin) return true;

  const normalized = origin.replace(/\/$/, "");
  for (const allowed of configuredOrigins()) {
    if (normalized === allowed.replace(/\/$/, "")) {
      return true;
    }
  }

  try {
    const { hostname } = new URL(origin);
    return isAllowedHostname(hostname);
  } catch {
    return false;
  }
}

function defaultAllowOrigin(): string {
  return configuredOrigins()[0] ?? "http://localhost:3000";
}

export function getCorsHeaders(origin?: string | null): Record<string, string> {
  const allowOrigin =
    origin && isAllowedOrigin(origin) ? origin : defaultAllowOrigin();

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
}
