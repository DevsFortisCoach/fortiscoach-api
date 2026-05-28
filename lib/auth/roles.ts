export const ROLES = [
  "admin_ti",
  "gerencia",
  "recepcion",
  "entrenador",
  "socio",
] as const;

export type RolNombre = (typeof ROLES)[number];

/** Roles que pueden editar socios */
export const ROLES_EDIT_SOCIOS: RolNombre[] = ["admin_ti", "gerencia", "recepcion"];

export function canEditSocios(rol: string): boolean {
  return ROLES_EDIT_SOCIOS.includes(rol as RolNombre);
}
