import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { requirePermission } from "@/lib/server/api-auth";
import { appendAudit, readStore, updateStore, type DbKnowledge } from "@/lib/server/db";

export async function GET(req: NextRequest) {
  const { error, session } = await requirePermission("knowledge.read", req);
  if (error || !session) return error;
  const q = (req.nextUrl.searchParams.get("q") || "").trim().toLowerCase();
  const store = await readStore();
  const { scopeKnowledge } = await import("@/lib/server/workspace-scope");
  let items = scopeKnowledge(store, session.workspaceId);
  if (q) {
    items = items.filter(
      (k) =>
        k.title.toLowerCase().includes(q) ||
        k.type.toLowerCase().includes(q) ||
        k.status.toLowerCase().includes(q) ||
        k.content.toLowerCase().includes(q),
    );
  }
  return NextResponse.json({
    items: items.map(({ content, ...rest }) => ({
      ...rest,
      preview: content.slice(0, 160),
    })),
  });
}

export async function POST(req: NextRequest) {
  const { error, session } = await requirePermission("knowledge.write", req);
  if (error || !session) return error;
  const body = (await req.json().catch(() => null)) as
    | { title?: string; type?: DbKnowledge["type"]; content?: string }
    | null;
  const title = body?.title?.trim() || "";
  const content = body?.content?.trim() || "";
  const type = body?.type || "note";
  if (!title || !content) {
    return NextResponse.json({ error: "Title and content are required." }, { status: 400 });
  }

  const item: DbKnowledge = {
    id: `kb_${randomUUID().slice(0, 8)}`,
    workspaceId: session.workspaceId,
    title,
    type,
    status: "indexed",
    sizeLabel: `${Math.max(1, Math.round(content.length / 1024))} KB`,
    content,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: session.userId,
  };

  await updateStore(async (s) => {
    s.knowledge.unshift(item);
    await appendAudit(s, {
      actorId: session.userId,
      actorName: session.name,
      action: "knowledge.created",
      resourceType: "knowledge",
      resourceId: item.id,
      metadata: { title, type },
    });
  });

  const { content: _c, ...rest } = item;
  return NextResponse.json({ item: { ...rest, preview: content.slice(0, 160) } });
}

export async function PATCH(req: NextRequest) {
  const { error, session } = await requirePermission("knowledge.write", req);
  if (error || !session) return error;
  const body = (await req.json().catch(() => null)) as
    | { id?: string; title?: string; content?: string; status?: DbKnowledge["status"] }
    | null;
  if (!body?.id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const store = await updateStore(async (s) => {
    const item = s.knowledge.find(
      (k) => k.id === body.id && (!k.workspaceId || k.workspaceId === session.workspaceId),
    );
    if (!item) throw new Error("NOT_FOUND");
    if (body.title?.trim()) item.title = body.title.trim();
    if (typeof body.content === "string") {
      item.content = body.content;
      item.sizeLabel = `${Math.max(1, Math.round(body.content.length / 1024))} KB`;
    }
    if (body.status) item.status = body.status;
    item.updatedAt = new Date().toISOString();
    await appendAudit(s, {
      actorId: session.userId,
      actorName: session.name,
      action: "knowledge.updated",
      resourceType: "knowledge",
      resourceId: item.id,
      metadata: { title: item.title },
    });
  }).catch((e: Error) => e);

  if (store instanceof Error) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const item = store.knowledge.find((k) => k.id === body.id)!;
  const { content, ...rest } = item;
  return NextResponse.json({ item: { ...rest, preview: content.slice(0, 160) } });
}

export async function DELETE(req: NextRequest) {
  const { error, session } = await requirePermission("knowledge.write", req);
  if (error || !session) return error;
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await updateStore(async (s) => {
    const idx = s.knowledge.findIndex(
      (k) => k.id === id && (!k.workspaceId || k.workspaceId === session.workspaceId),
    );
    if (idx < 0) throw new Error("NOT_FOUND");
    const [removed] = s.knowledge.splice(idx, 1);
    await appendAudit(s, {
      actorId: session.userId,
      actorName: session.name,
      action: "knowledge.deleted",
      resourceType: "knowledge",
      resourceId: id,
      metadata: { title: removed?.title || null },
    });
  }).catch((e: Error) => {
    if (e.message === "NOT_FOUND") return null;
    throw e;
  });

  return NextResponse.json({ ok: true });
}
