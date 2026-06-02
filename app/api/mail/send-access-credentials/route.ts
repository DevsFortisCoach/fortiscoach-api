import { NextRequest } from "next/server";
import { errorResponse, jsonResponse } from "@/lib/api-response";
import { requireCanSendMail } from "@/lib/auth/request";
import { getCorsHeaders } from "@/lib/cors";
import { signButtonLoginToken } from "@/lib/auth/jwt";
import { query } from "@/lib/db";
import { sendAccessCredentialsMail } from "@/lib/mail/send";

type UsuarioMailRow = {
  id: string;
  gimnasio_id: number;
  sucursal_id: number | null;
  activo: boolean;
  requiere_cambio_password: boolean;
};

function buildButtonLoginUrl(baseUrl: string, accessToken: string) {
  const url = new URL(baseUrl);

  if (url.pathname === "/" || url.pathname === "") {
    url.pathname = "/login";
  }

  url.searchParams.set("access_token", accessToken);
  return url.toString();
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
    await requireCanSendMail(request);

    const body = await request.json();
    const to = typeof body.to === "string" ? body.to.trim() : "";
    const recipientName =
      typeof body.recipientName === "string" ? body.recipientName.trim() : undefined;
    const gymName =
      typeof body.gymName === "string" ? body.gymName.trim() : undefined;
    const temporaryPassword =
      typeof body.temporaryPassword === "string" ? body.temporaryPassword : "";
    const loginUrl =
      typeof body.loginUrl === "string" ? body.loginUrl.trim() : undefined;
    const rolRaw =
      typeof body.rol === "string" ? body.rol.trim().toLowerCase() : "socio";

    if (!to || !temporaryPassword) {
      return errorResponse("Faltan destinatario o contraseña temporal", 400, origin);
    }

    if (rolRaw !== "socio" && rolRaw !== "recepcion" && rolRaw !== "entrenador") {
      return errorResponse("Rol no válido para acceso por botón", 400, origin);
    }

    const { rows: usuarios } = await query<UsuarioMailRow>(
      `SELECT u.id, u.gimnasio_id, u.sucursal_id, u.activo,
              COALESCE(u.requiere_cambio_password, false) AS requiere_cambio_password
       FROM usuarios u
       JOIN usuarios_roles ur ON ur.usuario_id = u.id
       JOIN roles r ON r.id = ur.rol_id
       WHERE lower(u.correo) = lower($1) AND r.nombre = $2
       LIMIT 1`,
      [to, rolRaw]
    );

    const usuario = usuarios[0];
    if (!usuario) {
      return errorResponse("No existe un usuario activo con ese correo y rol", 404, origin);
    }
    if (!usuario.activo) {
      return errorResponse("Usuario inactivo", 403, origin);
    }

    const buttonLoginToken = await signButtonLoginToken({
      sub: usuario.id,
      rol: rolRaw,
      gimnasio_id: usuario.gimnasio_id,
      sucursal_id: usuario.sucursal_id,
      requiere_cambio_password: usuario.requiere_cambio_password,
    });
    const safeBase = loginUrl?.trim() || "https://app.fortiscoach.cl/login";
    const buttonLoginUrl = buildButtonLoginUrl(safeBase, buttonLoginToken);

    const result = await sendAccessCredentialsMail({
      to,
      recipientName,
      gymName,
      temporaryPassword,
      loginUrl,
      buttonLoginUrl,
    });

    return jsonResponse(
      {
        ok: true,
        messageId: result.messageId,
        accepted: result.accepted,
        rejected: result.rejected,
        buttonLoginUrl,
      },
      200,
      origin
    );
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return errorResponse("No autorizado", 401, origin);
    }
    if (e instanceof Error && e.message === "FORBIDDEN") {
      return errorResponse("Sin permiso para enviar correos", 403, origin);
    }
    console.error("Send access credentials mail error:", e);
    return errorResponse("No se pudo enviar el correo de credenciales", 500, origin);
  }
}
