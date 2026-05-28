import { verifyToken, type JwtPayload } from "./jwt";
import { canEditSocios } from "./roles";

export async function getAuthFromRequest(request: Request): Promise<{
  payload: JwtPayload;
} | null> {
  const auth = request.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  try {
    const payload = await verifyToken(token);
    return { payload };
  } catch {
    return null;
  }
}

export function requireAuth(
  request: Request,
  allowedRoles?: string[]
): Promise<{ payload: JwtPayload }> {
  return getAuthFromRequest(request).then((auth) => {
    if (!auth) {
      throw new Error("UNAUTHORIZED");
    }
    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(auth.payload.rol)) {
      throw new Error("FORBIDDEN");
    }
    return auth;
  });
}

export async function requireCanEditSocios(request: Request): Promise<JwtPayload> {
  const auth = await requireAuth(request, ["admin_ti", "gerencia", "recepcion"]);
  if (!canEditSocios(auth.payload.rol)) {
    throw new Error("FORBIDDEN");
  }
  return auth.payload;
}
