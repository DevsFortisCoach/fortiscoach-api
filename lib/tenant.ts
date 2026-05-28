import { query } from "@/lib/db";

/** Header que envía el frontend con el slug del gimnasio (desde subdominio). */
export const TENANT_SLUG_HEADER = "x-fortiscoach-tenant";

export type TenantGym = {
  gimnasioId: number;
  subdivinioSlug: string;
  nombre: string;
};

export class TenantResolutionError extends Error {
  constructor(
    message: string,
    public status: number = 400
  ) {
    super(message);
    this.name = "TenantResolutionError";
  }
}

function normalizeSlug(raw: string): string {
  return raw.trim().toLowerCase();
}

/**
 * Extrae el slug de tenant desde un hostname.
 * Ej.: primefitness.fortiscoach.cl → primefitness
 *      primefitness.localhost → primefitness (dev)
 */
export function extractTenantSlugFromHost(host: string): string | null {
  const hostname = host.toLowerCase().split(":")[0] ?? "";
  if (!hostname) return null;

  const baseDomain = (process.env.TENANT_BASE_DOMAIN ?? "fortiscoach.cl").toLowerCase();

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    const dev = process.env.DEV_TENANT_SLUG?.trim();
    return dev ? normalizeSlug(dev) : null;
  }

  if (hostname === baseDomain || hostname === `www.${baseDomain}`) {
    return null;
  }

  if (hostname.endsWith(`.${baseDomain}`)) {
    const sub = hostname.slice(0, -(baseDomain.length + 1));
    if (sub && !sub.includes(".")) {
      return normalizeSlug(sub);
    }
    return null;
  }

  const parts = hostname.split(".");
  if (parts.length >= 2 && parts[parts.length - 1] === "localhost") {
    const sub = parts[0];
    if (sub && sub !== "www") {
      return normalizeSlug(sub);
    }
  }

  return null;
}

function slugFromRequestHeaders(request: Request): string | null {
  const header = request.headers.get(TENANT_SLUG_HEADER);
  if (header?.trim()) {
    return normalizeSlug(header);
  }

  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (host) {
    const fromHost = extractTenantSlugFromHost(host);
    if (fromHost) return fromHost;
  }

  const origin = request.headers.get("origin");
  if (origin) {
    try {
      const fromOrigin = extractTenantSlugFromHost(new URL(origin).hostname);
      if (fromOrigin) return fromOrigin;
    } catch {
      /* ignore */
    }
  }

  const referer = request.headers.get("referer");
  if (referer) {
    try {
      const fromReferer = extractTenantSlugFromHost(new URL(referer).hostname);
      if (fromReferer) return fromReferer;
    } catch {
      /* ignore */
    }
  }

  if (process.env.NODE_ENV !== "production") {
    const dev = process.env.DEV_TENANT_SLUG?.trim();
    if (dev) return normalizeSlug(dev);
  }

  return null;
}

export async function resolveTenantGymFromSlug(slug: string): Promise<TenantGym> {
  const normalized = normalizeSlug(slug);
  if (!normalized) {
    throw new TenantResolutionError("Slug de gimnasio inválido.", 400);
  }

  const { rows } = await query<{
    id: number;
    nombre: string;
    subdivinio_slug: string;
  }>(
    `SELECT id, nombre, subdivinio_slug
     FROM gimnasios
     WHERE subdivinio_slug = $1 AND activo = true
     LIMIT 1`,
    [normalized]
  );

  const gym = rows[0];
  if (!gym) {
    throw new TenantResolutionError("Gimnasio no encontrado o inactivo.", 404);
  }

  return {
    gimnasioId: Number(gym.id),
    subdivinioSlug: gym.subdivinio_slug,
    nombre: gym.nombre,
  };
}

/**
 * Resuelve el gimnasio (tenant) a partir de headers / host / Origin.
 * Para login también se puede enviar `subdivinio_slug` en el body.
 */
export async function resolveTenantFromRequest(
  request: Request,
  bodySlug?: string | null
): Promise<TenantGym> {
  const slug = bodySlug?.trim()
    ? normalizeSlug(bodySlug)
    : slugFromRequestHeaders(request);

  if (!slug) {
    throw new TenantResolutionError(
      "No se pudo identificar el gimnasio. Usa un subdominio válido (ej. primefitness.fortiscoach.cl).",
      400
    );
  }

  return resolveTenantGymFromSlug(slug);
}
