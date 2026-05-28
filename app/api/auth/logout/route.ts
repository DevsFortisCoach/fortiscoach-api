import { NextRequest } from "next/server";
import { getCorsHeaders } from "@/lib/cors";
import { jsonResponse } from "@/lib/api-response";

/**
 * Logout: el frontend debe descartar el token (memoria/localStorage).
 * No invalidamos el token en servidor por defecto; si se requiere invalidación
 * se puede usar una blacklist (Redis/DB). Por ahora respondemos OK para que
 * el cliente pueda cerrar sesión de forma consistente.
 */
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(null),
  });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("Origin");
  return jsonResponse({ ok: true, message: "Sesión cerrada" }, 200, origin);
}
