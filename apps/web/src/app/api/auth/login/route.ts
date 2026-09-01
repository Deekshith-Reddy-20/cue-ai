import { NextResponse } from "next/server";
import { appendAudit, publicUser, readStore, updateStore } from "@/lib/server/db";
import {
  SESSION_COOKIE,
  sessionCookieOptions,
  signSession,
  verifyPassword,
} from "@/lib/server/session";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { email?: string; password?: string }
    | null;
  const email = body?.email?.trim().toLowerCase() || "";
  const password = body?.password || "";
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const store = await readStore();
  const user = store.users.find((u) => u.email === email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }
  if (user.status === "Deactivated") {
    return NextResponse.json({ error: "This account has been deactivated." }, { status: 403 });
  }

  await updateStore(async (s) => {
    const u = s.users.find((x) => x.id === user.id);
    if (u) u.lastActiveAt = new Date().toISOString();
    await appendAudit(s, {
      actorId: user.id,
      actorName: user.name,
      action: "user.login",
      resourceType: "user",
      resourceId: user.id,
    });
  });

  const token = signSession({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    workspaceId: store.workspace.id,
    workspace: store.workspace.name,
  });

  const res = NextResponse.json({
    user: {
      ...publicUser(user),
      workspace: store.workspace.name,
    },
  });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return res;
}
