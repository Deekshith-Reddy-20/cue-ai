export type WorkspaceRole = "Admin" | "Manager" | "User";

export type AdminPermission =
  | "admin.access"
  | "workspace.read"
  | "workspace.write"
  | "users.read"
  | "users.invite"
  | "users.remove"
  | "users.role"
  | "knowledge.read"
  | "knowledge.write"
  | "ai.read"
  | "ai.write"
  | "usage.read"
  | "privacy.read"
  | "privacy.write"
  | "retention.write"
  | "audit.read";

const MATRIX: Record<WorkspaceRole, AdminPermission[]> = {
  Admin: [
    "admin.access",
    "workspace.read",
    "workspace.write",
    "users.read",
    "users.invite",
    "users.remove",
    "users.role",
    "knowledge.read",
    "knowledge.write",
    "ai.read",
    "ai.write",
    "usage.read",
    "privacy.read",
    "privacy.write",
    "retention.write",
    "audit.read",
  ],
  Manager: [
    "admin.access",
    "workspace.read",
    "users.read",
    "knowledge.read",
    "ai.read",
    "usage.read",
    "privacy.read",
    "audit.read",
  ],
  User: [],
};

export function normalizeRole(value: unknown): WorkspaceRole {
  if (value === "Admin" || value === "Manager" || value === "User") return value;
  if (value === "Member" || value === "Viewer") return "User";
  return "User";
}

export function permissionsFor(role?: string | null): AdminPermission[] {
  return MATRIX[normalizeRole(role)] || [];
}

export function can(role: string | null | undefined, permission: AdminPermission): boolean {
  return permissionsFor(role).includes(permission);
}

export function canAccessAdmin(role?: string | null): boolean {
  return can(role, "admin.access");
}
