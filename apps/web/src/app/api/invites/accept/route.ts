import { NextResponse } from "next/server";
import { appendAudit, readStore, updateStore } from "@/lib/server/db";
import { hashPassword, SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/server/session";
import { inviteTokenMatches, isInviteExpired } from "@/lib/server/invite-token";

/**
 * Public invite acceptance — no admin session required.
 * Token must be valid, pending, unexpired, and unused.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { token?: string; name?: string; password?: string }
    | null;
  const token = body?.token?.trim() || "";
  const name = body?.name?.trim() || "";
  const password = body?.password || "";

  if (!token) {
    return NextResponse.json({ error: "Invite token is required." }, { status: 400 });
  }
  if (!name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const store = await readStore();
  const invite = store.invites.find((i) => inviteTokenMatches(token, i.token));
  if (!invite) {
    return NextResponse.json({ error: "Invalid or unknown invitation." }, { status: 404 });
  }
  if (invite.status === "accepted") {
    return NextResponse.json({ error: "This invitation has already been used." }, { status: 410 });
  }
  if (invite.status === "revoked") {
    return NextResponse.json({ error: "This invitation was revoked." }, { status: 410 });
  }
  if (invite.status === "expired" || isInviteExpired(invite.expiresAt)) {
    await updateStore(async (s) => {
      const inv = s.invites.find((i) => i.id === invite.id);
      if (inv && inv.status === "pending") inv.status = "expired";
    });
    return NextResponse.json({ error: "This invitation has expired." }, { status: 410 });
  }
  if (invite.status !== "pending") {
    return NextResponse.json({ error: "This invitation is no longer valid." }, { status: 410 });
  }

  let acceptedUserId = "";
  const updated = await updateStore(async (s) => {
    const inv = s.invites.find((i) => i.id === invite.id);
    if (!inv || inv.status !== "pending") throw new Error("RACE");
    // Re-check expiry inside lock
    if (isInviteExpired(inv.expiresAt)) {
      inv.status = "expired";
      throw new Error("EXPIRED");
    }

    let user = s.users.find((u) => u.email === inv.email && u.status === "Invited");
    if (!user) {
      user = s.users.find((u) => u.email === inv.email && u.status !== "Deactivated");
    }
    if (user && user.status === "Active" && user.passwordHash) {
      throw new Error("EXISTS");
    }

    if (user) {
      user.name = name;
      user.passwordHash = hashPassword(password);
      user.role = inv.role;
      user.status = "Active";
      user.lastActiveAt = new Date().toISOString();
      acceptedUserId = user.id;
    } else {
      const { randomUUID } = await import("node:crypto");
      acceptedUserId = `usr_${randomUUID().slice(0, 10)}`;
      s.users.push({
        id: acceptedUserId,
        name,
        email: inv.email,
        passwordHash: hashPassword(password),
        role: inv.role,
        status: "Active",
        workspaceId: s.workspace.id,
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
      });
    }

    inv.status = "accepted";
    // Ensure stored value is hash (migrate legacy plaintext)
    const { hashInviteToken } = await import("@/lib/server/invite-token");
    inv.token = hashInviteToken(token);

    await appendAudit(s, {
      actorId: acceptedUserId,
      actorName: name,
      action: "invite.accepted",
      resourceType: "invite",
      resourceId: inv.id,
      metadata: { email: inv.email, role: inv.role },
    });
  }).catch((e: Error) => e);

  if (updated instanceof Error) {
    if (updated.message === "EXPIRED") {
      return NextResponse.json({ error: "This invitation has expired." }, { status: 410 });
    }
    if (updated.message === "EXISTS") {
      return NextResponse.json({ error: "An active account already exists for this email." }, { status: 409 });
    }
    if (updated.message === "RACE") {
      return NextResponse.json({ error: "This invitation has already been used." }, { status: 410 });
    }
    return NextResponse.json({ error: updated.message }, { status: 400 });
  }

  const user = updated.users.find((u) => u.id === acceptedUserId)!;
  const sessionToken = signSession({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    workspaceId: updated.workspace.id,
    workspace: updated.workspace.name,
  });

  const res = NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      workspace: updated.workspace.name,
    },
  });
  res.cookies.set(SESSION_COOKIE, sessionToken, sessionCookieOptions());
  return res;
}

/** Preview invite metadata without consuming the token. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token")?.trim() || "";
  if (!token) {
    return NextResponse.json({ error: "token required" }, { status: 400 });
  }
  const store = await readStore();
  const invite = store.invites.find((i) => inviteTokenMatches(token, i.token));
  if (!invite) {
    return NextResponse.json({ valid: false, error: "Invalid invitation." }, { status: 404 });
  }
  if (invite.status !== "pending" || isInviteExpired(invite.expiresAt)) {
    return NextResponse.json({
      valid: false,
      status: isInviteExpired(invite.expiresAt) ? "expired" : invite.status,
      error: "Invitation is not available.",
    });
  }
  return NextResponse.json({
    valid: true,
    email: invite.email,
    role: invite.role,
    workspace: store.workspace.name,
    expiresAt: invite.expiresAt,
  });
}
