import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { normalizeRole, type WorkspaceRole } from "@/lib/roles";
import { requirePermission } from "@/lib/server/api-auth";
import { appendAudit, readStore, updateStore } from "@/lib/server/db";
import { buildInviteEmail, isEmailDeliveryConfigured, sendEmail } from "@/lib/server/email";
import { generateInviteToken, hashInviteToken } from "@/lib/server/invite-token";
import { scopeInvites } from "@/lib/server/workspace-scope";

export async function GET(req: NextRequest) {
  const { error, session } = await requirePermission("users.read", req);
  if (error || !session) return error;
  const store = await readStore();
  const invites = scopeInvites(store, session.workspaceId).map((i) => ({
    id: i.id,
    email: i.email,
    role: i.role,
    status: i.status,
    invitedBy: i.invitedBy,
    createdAt: i.createdAt,
    expiresAt: i.expiresAt,
    // Never expose token hash or raw token in list responses
  }));
  return NextResponse.json({ invites });
}

export async function POST(req: NextRequest) {
  const { error, session } = await requirePermission("users.invite", req);
  if (error || !session) return error;

  const body = (await req.json().catch(() => null)) as
    | { email?: string; role?: WorkspaceRole; name?: string }
    | null;
  const email = body?.email?.trim().toLowerCase() || "";
  const role = normalizeRole(body?.role || "User");
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }

  const store = await readStore();
  if (store.users.some((u) => u.email === email && u.status !== "Deactivated" && u.workspaceId === session.workspaceId)) {
    return NextResponse.json({ error: "A user with this email already exists." }, { status: 409 });
  }
  if (scopeInvites(store, session.workspaceId).some((i) => i.email === email && i.status === "pending")) {
    return NextResponse.json({ error: "A pending invitation already exists for this email." }, { status: 409 });
  }
  const active = store.users.filter((u) => u.status === "Active" && u.workspaceId === session.workspaceId).length;
  if (active + scopeInvites(store, session.workspaceId).filter((i) => i.status === "pending").length >= store.workspace.seats) {
    return NextResponse.json({ error: "Seat limit reached. Increase seats or remove users." }, { status: 400 });
  }

  const inviteId = `inv_${randomUUID().slice(0, 8)}`;
  const rawToken = generateInviteToken();
  const tokenHash = hashInviteToken(rawToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  await updateStore(async (s) => {
    s.invites.unshift({
      id: inviteId,
      email,
      role,
      invitedBy: session.userId,
      token: tokenHash,
      status: "pending",
      createdAt: new Date().toISOString(),
      expiresAt,
    });
    if (!s.users.some((u) => u.email === email && u.workspaceId === session.workspaceId)) {
      s.users.push({
        id: `usr_${randomUUID().slice(0, 10)}`,
        name: body?.name?.trim() || email.split("@")[0] || "Invited User",
        email,
        passwordHash: "",
        role,
        status: "Invited",
        workspaceId: session.workspaceId,
        createdAt: new Date().toISOString(),
      });
    }
    await appendAudit(s, {
      actorId: session.userId,
      actorName: session.name,
      action: "user.invited",
      resourceType: "invite",
      resourceId: inviteId,
      metadata: { email, role, emailConfigured: isEmailDeliveryConfigured() },
    });
  });

  const mail = buildInviteEmail({
    to: email,
    workspaceName: store.workspace.name,
    role,
    inviteToken: rawToken,
    expiresAt,
  });
  const sendResult = await sendEmail(mail);

  return NextResponse.json({
    ok: true,
    invite: {
      id: inviteId,
      email,
      role,
      status: "pending",
      expiresAt,
      // Raw token returned once for manual share when email is not configured.
      // Never persisted; never returned on subsequent GETs.
      acceptPath: `/invite/${rawToken}`,
      emailDelivery: {
        configured: isEmailDeliveryConfigured(),
        attempted: true,
        ok: sendResult.ok,
        provider: sendResult.provider,
        deferred: "deferred" in sendResult ? sendResult.deferred : false,
      },
      note: isEmailDeliveryConfigured()
        ? "Invitation email dispatched via configured provider."
        : "Email delivery is not configured (SMTP_ENABLED). Share the accept path manually, or set SMTP_* env vars.",
    },
  });
}

export async function DELETE(req: NextRequest) {
  const { error, session } = await requirePermission("users.invite", req);
  if (error || !session) return error;
  const inviteId = req.nextUrl.searchParams.get("id");
  if (!inviteId) return NextResponse.json({ error: "id required" }, { status: 400 });

  await updateStore(async (s) => {
    const invite = s.invites.find((i) => i.id === inviteId);
    if (!invite) throw new Error("NOT_FOUND");
    invite.status = "revoked";
    const user = s.users.find(
      (u) => u.email === invite.email && u.status === "Invited" && u.workspaceId === session.workspaceId,
    );
    if (user) user.status = "Deactivated";
    await appendAudit(s, {
      actorId: session.userId,
      actorName: session.name,
      action: "invite.revoked",
      resourceType: "invite",
      resourceId: inviteId,
      metadata: { email: invite.email },
    });
  }).catch((e: Error) => {
    if (e.message === "NOT_FOUND") return null;
    throw e;
  });

  return NextResponse.json({ ok: true });
}
