import { NextRequest } from "next/server";
import { query } from "@/lib/db";
import { getAuthFromRequest } from "@/lib/auth/request";
import { getCorsHeaders } from "@/lib/cors";
import { errorResponse, jsonResponse } from "@/lib/api-response";
import { hashPassword, verifyPassword } from "@/lib/password";

interface UsuarioPasswordRow {
  id: string;
  activo: boolean;
  password_hash: string;
}

const MIN_PASSWORD_LENGTH = 8;

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(null),
  });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("Origin");

  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) {
      return errorResponse("No autorizado", 401, origin);
    }

    const gimnasioId = auth.payload.gimnasio_id;
    if (gimnasioId == null) {
      return errorResponse("Token sin gimnasio", 403, origin);
    }

    const body = await request.json();
    const contraseñaActual =
      typeof body.contraseñaActual === "string" ? body.contraseñaActual : "";
    const nuevaContraseña =
      typeof body.nuevaContraseña === "string" ? body.nuevaContraseña : "";

    if (!contraseñaActual || !nuevaContraseña) {
      return errorResponse(
        "Faltan contraseñaActual o nuevaContraseña",
        400,
        origin
      );
    }

    if (nuevaContraseña.length < MIN_PASSWORD_LENGTH) {
      return errorResponse(
        `nuevaContraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`,
        400,
        origin
      );
    }

    if (contraseñaActual === nuevaContraseña) {
      return errorResponse(
        "La nueva contraseña debe ser distinta a la actual",
        400,
        origin
      );
    }

    const { rows } = await query<UsuarioPasswordRow>(
      `SELECT id, activo, password_hash
       FROM usuarios
       WHERE id = $1 AND gimnasio_id = $2
       LIMIT 1`,
      [auth.payload.sub, gimnasioId]
    );

    const usuario = rows[0];
    if (!usuario) {
      return errorResponse("Usuario no encontrado", 404, origin);
    }
    if (!usuario.activo) {
      return errorResponse("Usuario inactivo", 403, origin);
    }

    const validCurrentPassword = await verifyPassword(
      contraseñaActual,
      usuario.password_hash
    );
    if (!validCurrentPassword) {
      return errorResponse("Contraseña actual incorrecta", 401, origin);
    }

    const newHash = await hashPassword(nuevaContraseña);
    await query(
      `UPDATE usuarios
       SET password_hash = $1,
           requiere_cambio_password = false,
           actualizado_en = now()
       WHERE id = $2 AND gimnasio_id = $3`,
      [newHash, usuario.id, gimnasioId]
    );

    return jsonResponse(
      { ok: true, message: "Contraseña actualizada" },
      200,
      origin
    );
  } catch (e) {
    console.error("Change password error:", e);
    return errorResponse("Error interno", 500, origin);
  }
}
