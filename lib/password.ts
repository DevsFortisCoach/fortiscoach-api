import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

/**
 * Compara la contraseña en texto plano con el hash almacenado.
 * El esquema en Supabase usa pgcrypto crypt(..., gen_salt('bf')) que es compatible con bcrypt.
 */
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}
