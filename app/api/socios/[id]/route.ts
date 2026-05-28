import { NextRequest } from "next/server";
import { query } from "@/lib/db";
import { requireCanEditSocios } from "@/lib/auth/request";
import { getCorsHeaders } from "@/lib/cors";
import { jsonResponse, errorResponse } from "@/lib/api-response";

const ESTADOS_VALIDOS = ["activo", "suspendido", "moroso", "vencido", "baja"];

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(null),
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const origin = request.headers.get("Origin");
  try {
    const { id } = await params;
    const socioId = parseInt(id, 10);
    if (Number.isNaN(socioId) || socioId < 1) {
      return errorResponse("ID de socio inválido", 400, origin);
    }

    const payload = await requireCanEditSocios(request);

    const body = await request.json();

    const updatesSocio: string[] = [];
    const paramsSocio: unknown[] = [];
    let paramIndex = 1;

    if (body.sucursal_id !== undefined) {
      const sid = Number(body.sucursal_id);
      if (!Number.isInteger(sid) || sid < 1) {
        return errorResponse("sucursal_id inválido", 400, origin);
      }
      updatesSocio.push(`sucursal_id = $${paramIndex++}`);
      paramsSocio.push(sid);
    }
    if (body.fecha_nacimiento !== undefined) {
      const val = body.fecha_nacimiento === null ? null : String(body.fecha_nacimiento);
      updatesSocio.push(`fecha_nacimiento = $${paramIndex++}`);
      paramsSocio.push(val);
    }
    if (body.estado !== undefined) {
      const est = String(body.estado).toLowerCase();
      if (!ESTADOS_VALIDOS.includes(est)) {
        return errorResponse(
          `estado debe ser uno de: ${ESTADOS_VALIDOS.join(", ")}`,
          400,
          origin
        );
      }
      updatesSocio.push(`estado = $${paramIndex++}`);
      paramsSocio.push(est);
    }
    if (body.observaciones !== undefined) {
      updatesSocio.push(`observaciones = $${paramIndex++}`);
      paramsSocio.push(body.observaciones === null ? null : String(body.observaciones));
    }

    if (updatesSocio.length === 0 && body.nombre_completo === undefined && body.correo === undefined && body.telefono === undefined) {
      return errorResponse("No hay campos que actualizar", 400, origin);
    }

    const { rows: socios } = await query<{ id: number; gimnasio_id: number; usuario_id: string | null }>(
      "SELECT id, gimnasio_id, usuario_id FROM socios WHERE id = $1",
      [socioId]
    );
    const socio = socios[0];
    if (!socio) {
      return errorResponse("Socio no encontrado", 404, origin);
    }

    if (payload.gimnasio_id != null && socio.gimnasio_id !== payload.gimnasio_id) {
      return errorResponse("No puedes editar socios de otro gimnasio", 403, origin);
    }

    if (body.sucursal_id !== undefined) {
      const { rows: suc } = await query<{ id: number; gimnasio_id: number }>(
        "SELECT id, gimnasio_id FROM sucursales WHERE id = $1 AND activa = true",
        [body.sucursal_id]
      );
      if (suc.length === 0 || suc[0].gimnasio_id !== socio.gimnasio_id) {
        return errorResponse("Sucursal inválida o no pertenece al gimnasio del socio", 400, origin);
      }
    }

    if (updatesSocio.length > 0) {
      paramsSocio.push(socioId);
      await query(
        `UPDATE socios SET ${updatesSocio.join(", ")}, actualizado_en = now() WHERE id = $${paramIndex}`,
        paramsSocio
      );
    }

    const updatesUsuario: string[] = [];
    const paramsUsuario: unknown[] = [];
    let ui = 1;
    if (body.nombre_completo !== undefined || body.correo !== undefined || body.telefono !== undefined) {
      if (!socio.usuario_id) {
        return errorResponse(
          "Este socio no tiene cuenta de usuario; no se pueden editar nombre, correo o teléfono desde aquí",
          400,
          origin
        );
      }
      if (body.nombre_completo !== undefined) {
        const nombre = String(body.nombre_completo).trim();
        if (!nombre) return errorResponse("nombre_completo no puede estar vacío", 400, origin);
        updatesUsuario.push(`nombre_completo = $${ui++}`);
        paramsUsuario.push(nombre);
      }
      if (body.correo !== undefined) {
        const correo = body.correo === null ? null : String(body.correo).trim();
        if (correo !== null && !correo) return errorResponse("correo no puede estar vacío si se envía", 400, origin);
        updatesUsuario.push(`correo = $${ui++}`);
        paramsUsuario.push(correo);
      }
      if (body.telefono !== undefined) {
        updatesUsuario.push(`telefono = $${ui++}`);
        paramsUsuario.push(body.telefono === null ? null : String(body.telefono));
      }
      if (updatesUsuario.length > 0) {
        paramsUsuario.push(socio.usuario_id);
        await query(
          `UPDATE usuarios SET ${updatesUsuario.join(", ")}, actualizado_en = now() WHERE id = $${ui}`,
          paramsUsuario
        );
      }
    }

    const { rows: updated } = await query(
      `SELECT s.id, s.usuario_id, s.gimnasio_id, s.sucursal_id, s.rut, s.fecha_nacimiento, s.fecha_alta, s.estado, s.observaciones,
              u.nombre_completo, u.correo, u.telefono
       FROM socios s
       LEFT JOIN usuarios u ON u.id = s.usuario_id
       WHERE s.id = $1`,
      [socioId]
    );

    return jsonResponse(
      { socio: updated[0] ?? null, message: "Socio actualizado" },
      200,
      origin
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error";
    if (msg === "UNAUTHORIZED") {
      return errorResponse("No autorizado", 401, origin);
    }
    if (msg === "FORBIDDEN") {
      return errorResponse("Sin permiso para editar socios", 403, origin);
    }
    console.error("PATCH socios error:", err);
    return errorResponse("Error interno", 500, origin);
  }
}
