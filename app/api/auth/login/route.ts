import { NextRequest } from "next/server";
import { query } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { signToken } from "@/lib/auth/jwt";
import { getCorsHeaders } from "@/lib/cors";
import { jsonResponse, errorResponse } from "@/lib/api-response";

interface UsuarioRow {
  id: string;
  gimnasio_id: number;
  sucursal_id: number | null;
  correo: string;
  nombre_completo: string;
  telefono: string | null;
  activo: boolean;
  password_hash: string;
  requiere_cambio_password: boolean;
  gimnasio_nombre: string;
}

const VALID_ROLES = ["recepcion", "socio", "entrenador"] as const;

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(null),
  });
}

async function resolveRol(
  usuarioId: string,
  rolFromBody: string
): Promise<
  { ok: true; rol: string } | { ok: false; status: number; message: string }
> {
  if (rolFromBody) {
    if (!VALID_ROLES.includes(rolFromBody as (typeof VALID_ROLES)[number])) {
      return { ok: false, status: 400, message: "Rol no válido" };
    }
    const { rows: rolesRows } = await query<{ rol_id: number }>(
      `SELECT ur.rol_id FROM usuarios_roles ur
       JOIN roles r ON r.id = ur.rol_id
       WHERE ur.usuario_id = $1 AND r.nombre = $2`,
      [usuarioId, rolFromBody]
    );
    if (rolesRows.length === 0) {
      return {
        ok: false,
        status: 403,
        message: "El usuario no tiene asignado el rol indicado",
      };
    }
    return { ok: true, rol: rolFromBody };
  }

  const { rows: roleNames } = await query<{ nombre: string }>(
    `SELECT r.nombre FROM usuarios_roles ur
     JOIN roles r ON r.id = ur.rol_id
     WHERE ur.usuario_id = $1`,
    [usuarioId]
  );

  if (roleNames.length === 0) {
    return { ok: false, status: 403, message: "Usuario sin rol asignado" };
  }
  if (roleNames.length > 1) {
    return {
      ok: false,
      status: 403,
      message:
        "La cuenta tiene más de un rol asignado; contacta al administrador.",
    };
  }

  const inferred = roleNames[0].nombre.trim().toLowerCase();
  if (!VALID_ROLES.includes(inferred as (typeof VALID_ROLES)[number])) {
    return {
      ok: false,
      status: 403,
      message: "Rol no permitido para esta aplicación",
    };
  }
  return { ok: true, rol: inferred };
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("Origin");
  try {
    const body = await request.json();
    const correo = typeof body.correo === "string" ? body.correo.trim() : "";
    const contraseña =
      typeof body.contraseña === "string" ? body.contraseña : "";
    const rolFromBodyRaw = typeof body.rol === "string" ? body.rol.trim() : "";
    const rolFromBody = rolFromBodyRaw.toLowerCase();

    if (!correo || !contraseña) {
      return errorResponse("Faltan correo o contraseña", 400, origin);
    }

    if (
      rolFromBody &&
      !VALID_ROLES.includes(rolFromBody as (typeof VALID_ROLES)[number])
    ) {
      return errorResponse("Rol no válido", 400, origin);
    }

    const { rows: usuarios } = await query<UsuarioRow>(
      `SELECT u.id, u.gimnasio_id, u.sucursal_id, u.correo, u.nombre_completo, u.telefono,
              u.activo, u.password_hash,
              COALESCE(u.requiere_cambio_password, false) AS requiere_cambio_password,
              g.nombre AS gimnasio_nombre
       FROM usuarios u
       JOIN gimnasios g ON g.id = u.gimnasio_id
       WHERE lower(u.correo) = lower($1)
       LIMIT 1`,
      [correo]
    );

    const usuario = usuarios[0];
    if (!usuario) {
      return errorResponse("Credenciales inválidas", 401, origin);
    }
    if (!usuario.activo) {
      return errorResponse("Usuario inactivo", 403, origin);
    }

    const ok = await verifyPassword(contraseña, usuario.password_hash);
    if (!ok) {
      return errorResponse("Credenciales inválidas", 401, origin);
    }

    const resolved = await resolveRol(usuario.id, rolFromBody);
    if (!resolved.ok) {
      return errorResponse(resolved.message, resolved.status, origin);
    }

    const token = await signToken({
      sub: usuario.id,
      rol: resolved.rol,
      gimnasio_id: usuario.gimnasio_id,
      sucursal_id: usuario.sucursal_id,
      requiere_cambio_password: usuario.requiere_cambio_password,
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
          rol: resolved.rol,
          requiere_cambio_password: usuario.requiere_cambio_password,
        },
      },
      200,
      origin
    );
  } catch (e) {
    console.error("Login error:", e);
    const detail =
      process.env.NODE_ENV !== "production" && e instanceof Error
        ? e.message
        : "Error interno";
    return errorResponse(detail, 500, origin);
  }
}
