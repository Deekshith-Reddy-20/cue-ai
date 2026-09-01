import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/server/api-auth";
import { readStore } from "@/lib/server/db";
import { permissionsFor } from "@/lib/roles";

export async function GET(req: NextRequest) {
  const { error, session } = await requirePermission("admin.access", req);
  if (error || !session) return error;
  const store = await readStore();
  const { scopeUsage, scopeUsers, scopeInvites, scopeKnowledge, scopeAudit } = await import(
    "@/lib/server/workspace-scope"
  );
  const period = new Date().toISOString().slice(0, 7);
  const periodUsage = scopeUsage(store, session.workspaceId).filter((u) =>
    u.createdAt.startsWith(period),
  );
  const tokens = periodUsage.filter((u) => u.type === "tokens");
  const meetings = periodUsage.filter((u) => u.type === "meeting_minutes");
  const resumes = periodUsage.filter((u) => u.type === "resume_rewrite");

  return NextResponse.json({
    role: session.role,
    permissions: permissionsFor(session.role),
    workspace: {
      id: store.workspace.id,
      name: store.workspace.name,
      seats: store.workspace.seats,
    },
    metrics: {
      activeUsers: scopeUsers(store, session.workspaceId).filter((u) => u.status === "Active").length,
      pendingInvites: scopeInvites(store, session.workspaceId).filter((i) => i.status === "pending")
        .length,
      knowledgeItems: scopeKnowledge(store, session.workspaceId).length,
      periodTokenUsage: tokens.reduce((s, e) => s + e.quantity, 0),
      periodMeetingMinutes: meetings.reduce((s, e) => s + e.quantity, 0),
      periodResumeRewrites: resumes.reduce((s, e) => s + e.quantity, 0),
      auditEvents: scopeAudit(store, session.workspaceId).length,
    },
  });
}
