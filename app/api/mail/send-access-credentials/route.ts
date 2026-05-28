import { NextRequest } from "next/server";
import { errorResponse, jsonResponse } from "@/lib/api-response";
import { getCorsHeaders } from "@/lib/cors";
import { sendAccessCredentialsMail } from "@/lib/mail/send";

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
    const to = typeof body.to === "string" ? body.to.trim() : "";
    const recipientName =
      typeof body.recipientName === "string" ? body.recipientName.trim() : undefined;
    const gymName =
      typeof body.gymName === "string" ? body.gymName.trim() : undefined;
    const temporaryPassword =
      typeof body.temporaryPassword === "string" ? body.temporaryPassword : "";
    const loginUrl =
      typeof body.loginUrl === "string" ? body.loginUrl.trim() : undefined;

    if (!to || !temporaryPassword) {
      return errorResponse("Faltan destinatario o contraseña temporal", 400, origin);
    }

    const result = await sendAccessCredentialsMail({
      to,
      recipientName,
      gymName,
      temporaryPassword,
      loginUrl,
    });

    return jsonResponse(
      {
        ok: true,
        messageId: result.messageId,
        accepted: result.accepted,
        rejected: result.rejected,
      },
      200,
      origin
    );
  } catch (e) {
    console.error("Send access credentials mail error:", e);
    return errorResponse("No se pudo enviar el correo de credenciales", 500, origin);
  }
}
