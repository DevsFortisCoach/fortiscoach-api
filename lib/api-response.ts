import { getCorsHeaders } from "./cors";

type JsonBody = Record<string, unknown> | unknown[];

export function jsonResponse(
  data: JsonBody,
  status: number,
  origin?: string | null
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...getCorsHeaders(origin),
    },
  });
}

export function errorResponse(
  message: string,
  status: number,
  origin?: string | null
): Response {
  return jsonResponse({ error: message }, status, origin);
}
