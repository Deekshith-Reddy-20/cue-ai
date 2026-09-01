import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/server/api-auth";
import { publicUser, readStore } from "@/lib/server/db";
import { permissionsFor } from "@/lib/roles";

export async function GET() {
  const session = await getSessionFromRequest();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  const store = await readStore();
  const user = store.users.find((u) => u.id === session.userId);
  if (!user || user.status === "Deactivated") {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({
    authenticated: true,
    user: {
      ...publicUser(user),
      workspace: store.workspace.name,
    },
    permissions: permissionsFor(user.role),
  });
}
