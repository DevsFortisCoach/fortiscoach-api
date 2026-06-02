import { NextRequest } from "next/server";
import { errorResponse, jsonResponse } from "@/lib/api-response";
import { getCorsHeaders } from "@/lib/cors";
import { query } from "@/lib/db";
import { signToken, verifyButtonLoginToken } from "@/lib/auth/jwt";

interface UsuarioRow {
  id: string;
  gimnasio_id: number;
  sucursal_id: number | null;
  correo: string;
  nombre_completo: string;
  telefono: string | null;
  activo: boolean;
  requiere_cambio_password: boolean;
  gimnasio_nombre: string;
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(null),
  });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("Origin");

  try {
    const body = await request.json();
    const accessToken =
      typeof body.accessToken === "string" ? body.accessToken.trim() : "";

    if (!accessToken) {
      return errorResponse("Falta accessToken", 400, origin);
    }

    const payload = await verifyButtonLoginToken(accessToken);

    const { rows: usuarios } = await query<UsuarioRow>(
      `SELECT u.id, u.gimnasio_id, u.sucursal_id, u.correo, u.nombre_completo, u.telefono,
              u.activo, COALESCE(u.requiere_cambio_password, false) AS requiere_cambio_password,
              g.nombre AS gimnasio_nombre
       FROM usuarios u
       JOIN gimnasios g ON g.id = u.gimnasio_id
       WHERE u.id = $1
       LIMIT 1`,
      [payload.sub]
    );

    const usuario = usuarios[0];
    if (!usuario) {
      return errorResponse("Usuario no encontrado", 404, origin);
    }
    if (!usuario.activo) {
      return errorResponse("Usuario inactivo", 403, origin);
    }

    const token = await signToken({
      sub: usuario.id,
      rol: payload.rol,
      gimnasio_id: usuario.gimnasio_id,
      sucursal_id: usuario.sucursal_id,
      requiere_cambio_password:
        typeof payload.requiere_cambio_password === "boolean"
          ? payload.requiere_cambio_password
          : usuario.requiere_cambio_password,
    });

    return jsonResponse(
      {
        token,
        gimnasio: {
          id: usuario.gimnasio_id,
          nombre: usuario.gimnasio_nombre,
        },
        usuario: {
          id: usuario.id,
          correo: usuario.correo,
          nombre_completo: usuario.nombre_completo,
          telefono: usuario.telefono,
          gimnasio_id: usuario.gimnasio_id,
          gimnasio_nombre: usuario.gimnasio_nombre,
          sucursal_id: usuario.sucursal_id,
          rol: payload.rol,
          requiere_cambio_password:
            typeof payload.requiere_cambio_password === "boolean"
              ? payload.requiere_cambio_password
              : usuario.requiere_cambio_password,
        },
      },
      200,
      origin
    );
  } catch (e) {
    console.error("Button login error:", e);
    return errorResponse("No se pudo validar el acceso del botón", 401, origin);
  }
}
