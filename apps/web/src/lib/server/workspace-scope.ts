import type { SessionPayload } from "@/lib/server/session";
import type { WorkspaceStore } from "@/lib/server/db";

/** Defensive workspace scoping — all admin reads should go through this. */
export function assertWorkspaceAccess(session: SessionPayload, workspaceId: string) {
  return session.workspaceId === workspaceId;
}

export function scopeUsers(store: WorkspaceStore, workspaceId: string) {
  return store.users.filter((u) => u.workspaceId === workspaceId);
}

export function scopeInvites(store: WorkspaceStore, workspaceId: string) {
  // Invites inherit workspace via inviting admin; filter users' workspace for invited rows.
  return store.invites.filter((inv) => {
    const user = store.users.find((u) => u.email === inv.email);
    return !user || user.workspaceId === workspaceId;
  });
}

export function scopeKnowledge(store: WorkspaceStore, workspaceId: string) {
  return store.knowledge.filter((k) => {
    const wid = (k as { workspaceId?: string }).workspaceId;
    return !wid || wid === workspaceId;
  });
}

export function scopeUsage(store: WorkspaceStore, workspaceId: string) {
  return store.usage.filter((u) => u.workspaceId === workspaceId);
}

export function scopeAudit(store: WorkspaceStore, workspaceId: string) {
  return store.audit.filter((a) => a.workspaceId === workspaceId);
}
