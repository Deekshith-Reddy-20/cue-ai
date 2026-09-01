import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { normalizeRole } from "@/lib/roles";
import { appendAudit, readStore, updateStore } from "@/lib/server/db";
import {
  hashPassword,
  SESSION_COOKIE,
  sessionCookieOptions,
  signSession,
} from "@/lib/server/session";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { email?: string; password?: string; name?: string; workspace?: string }
    | null;
  const email = body?.email?.trim().toLowerCase() || "";
  const password = body?.password || "";
  const name = body?.name?.trim() || "";
  const workspaceName = body?.workspace?.trim() || `${name.split(" ")[0] || "My"}'s Workspace`;

  if (!email || !password || !name) {
    return NextResponse.json({ error: "Name, email, and password are required." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  }

  const store = await readStore();
  if (store.users.some((u) => u.email === email && u.status !== "Deactivated")) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const activeUsers = store.users.filter(
    (u) => u.status === "Active" && u.email !== "admin@cueai.local",
  );
  const onlyBootstrap =
    store.users.filter((u) => u.status === "Active").length === 1 &&
    store.users.some((u) => u.email === "admin@cueai.local" && u.status === "Active");
  const role = activeUsers.length === 0 || onlyBootstrap ? "Admin" : "User";
  const userId = `usr_${randomUUID().slice(0, 10)}`;

  await updateStore(async (s) => {
    if (role === "Admin") {
      s.workspace.name = workspaceName;
      const bootstrap = s.users.find((u) => u.email === "admin@cueai.local");
      if (bootstrap && bootstrap.name === "Workspace Admin") {
        bootstrap.status = "Deactivated";
      }
    }
    s.users.push({
      id: userId,
      name,
      email,
      passwordHash: hashPassword(password),
      role: normalizeRole(role),
      status: "Active",
      workspaceId: s.workspace.id,
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
    });
    await appendAudit(s, {
      actorId: userId,
      actorName: name,
      action: "user.signed_up",
      resourceType: "user",
      resourceId: userId,
      metadata: { role },
    });
  });

  const token = signSession({
    userId,
    email,
    name,
    role: normalizeRole(role),
    workspaceId: store.workspace.id,
    workspace: role === "Admin" ? workspaceName : store.workspace.name,
  });

  const res = NextResponse.json({
    user: {
      id: userId,
      name,
      email,
      role: normalizeRole(role),
      workspace: role === "Admin" ? workspaceName : store.workspace.name,
      workspaceId: store.workspace.id,
    },
  });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return res;
}
