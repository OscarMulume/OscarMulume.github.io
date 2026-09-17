export const ROLES = ['OWNER', 'ADMIN', 'STAFF', 'CLIENT', 'VISITOR'] as const;

export type Role = (typeof ROLES)[number];

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

/** Hiérarchie décroissante : un rôle couvre tous ceux qui le suivent. */
const ROLE_RANK: Readonly<Record<Role, number>> = {
  OWNER: 4,
  ADMIN: 3,
  STAFF: 2,
  CLIENT: 1,
  VISITOR: 0,
};

/** `true` si `role` est au moins aussi privilégié que `required`. */
export function isAtLeast(role: Role, required: Role): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[required];
}

/** Résout un rôle d'API/db (string) vers un rôle typé, ou retombe sur VISITOR. */
export function toRole(value: string | null | undefined): Role {
  return value !== null && value !== undefined && isRole(value) ? value : 'VISITOR';
}