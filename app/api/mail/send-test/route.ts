import { NextRequest } from "next/server";
import { errorResponse, jsonResponse } from "@/lib/api-response";
import { getCorsHeaders } from "@/lib/cors";
import { sendTestMail } from "@/lib/mail/send";

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
    const serviceName =
      typeof body.serviceName === "string" ? body.serviceName.trim() : undefined;

    if (!to) {
      return errorResponse("Falta el destinatario", 400, origin);
    }

    const result = await sendTestMail({ to, recipientName, serviceName });

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
    console.error("Send test mail error:", e);
    return errorResponse("No se pudo enviar el correo de prueba", 500, origin);
  }
}
