import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/server/api-auth";
import { appendAudit, readStore, updateStore } from "@/lib/server/db";

export async function GET(req: NextRequest) {
  const { error } = await requirePermission("workspace.read", req);
  if (error) return error;
  const store = await readStore();
  const activeUsers = store.users.filter((u) => u.status === "Active").length;
  return NextResponse.json({
    workspace: {
      id: store.workspace.id,
      name: store.workspace.name,
      seats: store.workspace.seats,
      activeUsers,
      pendingInvites: store.invites.filter((i) => i.status === "pending").length,
    },
  });
}

export async function PATCH(req: NextRequest) {
  const { error, session } = await requirePermission("workspace.write", req);
  if (error || !session) return error;
  const body = (await req.json().catch(() => null)) as
    | { name?: string; seats?: number }
    | null;

  const store = await updateStore(async (s) => {
    if (typeof body?.name === "string" && body.name.trim()) {
      s.workspace.name = body.name.trim();
    }
    if (typeof body?.seats === "number" && body.seats >= 1 && body.seats <= 1000) {
      s.workspace.seats = Math.floor(body.seats);
    }
    await appendAudit(s, {
      actorId: session.userId,
      actorName: session.name,
      action: "workspace.updated",
      resourceType: "workspace",
      resourceId: s.workspace.id,
      metadata: { name: s.workspace.name, seats: s.workspace.seats },
    });
  });

  return NextResponse.json({ workspace: store.workspace });
}
