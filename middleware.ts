import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getCorsHeaders } from "./lib/cors";

export function middleware(request: NextRequest) {
  const origin = request.headers.get("Origin");
  const headers = getCorsHeaders(origin);

  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers });
  }

  const response = NextResponse.next();
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

export const config = {
  matcher: "/api/:path*",
};
