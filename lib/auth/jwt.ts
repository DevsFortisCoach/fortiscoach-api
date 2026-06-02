import { SignJWT, jwtVerify } from "jose";

function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET debe estar definida y tener al menos 32 caracteres");
  }
  return new TextEncoder().encode(secret);
}

export interface JwtPayload {
  sub: string;       // usuario id (uuid)
  rol: string;       // nombre del rol con el que hizo login
  gimnasio_id: number | null;
  sucursal_id: number | null;
  /** Si true, el cliente debe forzar cambio de contraseña antes de usar la app (PrimeFitness, etc.). */
  requiere_cambio_password?: boolean;
  iat?: number;
  exp?: number;
}

export interface ButtonLoginPayload {
  sub: string;
  rol: string;
  gimnasio_id: number | null;
  sucursal_id: number | null;
  requiere_cambio_password?: boolean;
  purpose: "button_login";
}

const DEFAULT_EXP = "7d";
const BUTTON_LOGIN_EXP = "20m";

export async function signToken(payload: Omit<JwtPayload, "iat" | "exp">): Promise<string> {
  const body: Record<string, unknown> = {
    sub: payload.sub,
    rol: payload.rol,
    gimnasio_id: payload.gimnasio_id ?? null,
    sucursal_id: payload.sucursal_id ?? null,
  };
  if (typeof payload.requiere_cambio_password === "boolean") {
    body.requiere_cambio_password = payload.requiere_cambio_password;
  }
  return new SignJWT(body)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(DEFAULT_EXP)
    .sign(getSecretKey());
}

export async function verifyToken(token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, getSecretKey());
  const sub = payload.sub;
  const rol = payload.rol;
  if (!sub || typeof sub !== "string" || !rol || typeof rol !== "string") {
    throw new Error("Token inválido");
  }
  const reqFlag = payload.requiere_cambio_password;
  return {
    sub,
    rol,
    gimnasio_id: (payload.gimnasio_id as number) ?? null,
    sucursal_id: (payload.sucursal_id as number) ?? null,
    requiere_cambio_password:
      typeof reqFlag === "boolean" ? reqFlag : undefined,
    iat: payload.iat as number,
    exp: payload.exp as number,
  };
}

export async function signButtonLoginToken(
  payload: Omit<ButtonLoginPayload, "purpose">
): Promise<string> {
  const body: Record<string, unknown> = {
    sub: payload.sub,
    rol: payload.rol,
    gimnasio_id: payload.gimnasio_id ?? null,
    sucursal_id: payload.sucursal_id ?? null,
    purpose: "button_login",
  };
  if (typeof payload.requiere_cambio_password === "boolean") {
    body.requiere_cambio_password = payload.requiere_cambio_password;
  }
  return new SignJWT(body)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(BUTTON_LOGIN_EXP)
    .sign(getSecretKey());
}

export async function verifyButtonLoginToken(
  token: string
): Promise<ButtonLoginPayload> {
  const { payload } = await jwtVerify(token, getSecretKey());
  const sub = payload.sub;
  const rol = payload.rol;
  const purpose = payload.purpose;
  if (
    !sub ||
    typeof sub !== "string" ||
    !rol ||
    typeof rol !== "string" ||
    purpose !== "button_login"
  ) {
    throw new Error("Token de acceso por botón inválido");
  }
  const reqFlag = payload.requiere_cambio_password;
  return {
    sub,
    rol,
    gimnasio_id: (payload.gimnasio_id as number) ?? null,
    sucursal_id: (payload.sucursal_id as number) ?? null,
    requiere_cambio_password:
      typeof reqFlag === "boolean" ? reqFlag : undefined,
    purpose: "button_login",
  };
}
