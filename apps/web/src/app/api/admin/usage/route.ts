import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/server/api-auth";
import { readStore, type DbUsageEvent } from "@/lib/server/db";

function inCurrentPeriod(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  return d.getUTCFullYear() === now.getUTCFullYear() && d.getUTCMonth() === now.getUTCMonth();
}

function aggregate(events: DbUsageEvent[]) {
  const byUser = new Map<string, { userId: string; userName: string; quantity: number }>();
  const byProvider = new Map<string, number>();
  const byModel = new Map<string, number>();
  const byDay = new Map<string, number>();
  let total = 0;
  let inputTokens = 0;
  let outputTokens = 0;

  for (const e of events) {
    total += e.quantity;
    inputTokens += e.inputTokens || 0;
    outputTokens += e.outputTokens || 0;
    const u = byUser.get(e.userId) || { userId: e.userId, userName: e.userName, quantity: 0 };
    u.quantity += e.quantity;
    byUser.set(e.userId, u);
    if (e.provider) byProvider.set(e.provider, (byProvider.get(e.provider) || 0) + e.quantity);
    if (e.model) byModel.set(e.model, (byModel.get(e.model) || 0) + e.quantity);
    const day = e.createdAt.slice(0, 10);
    byDay.set(day, (byDay.get(day) || 0) + e.quantity);
  }

  return {
    total,
    inputTokens,
    outputTokens,
    byUser: [...byUser.values()].sort((a, b) => b.quantity - a.quantity),
    byProvider: [...byProvider.entries()].map(([provider, quantity]) => ({ provider, quantity })),
    byModel: [...byModel.entries()].map(([model, quantity]) => ({ model, quantity })),
    overTime: [...byDay.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, quantity]) => ({ date, quantity })),
  };
}

export async function GET(req: NextRequest) {
  const { error, session } = await requirePermission("usage.read", req);
  if (error || !session) return error;

  const type = req.nextUrl.searchParams.get("type") as DbUsageEvent["type"] | "all" | null;
  const store = await readStore();
  const { scopeUsage } = await import("@/lib/server/workspace-scope");
  let events = scopeUsage(store, session.workspaceId);
  if (type && type !== "all") {
    events = events.filter((e) => e.type === type);
  }
  const periodEvents = events.filter((e) => inCurrentPeriod(e.createdAt));

  return NextResponse.json({
    workspaceId: session.workspaceId,
    workspaceName: store.workspace.name,
    period: {
      label: new Date().toISOString().slice(0, 7),
      ...aggregate(periodEvents),
      eventCount: periodEvents.length,
    },
    allTime: {
      ...aggregate(events),
      eventCount: events.length,
    },
    recent: events.slice(0, 50).map((e) => ({
      id: e.id,
      type: e.type,
      quantity: e.quantity,
      inputTokens: e.inputTokens || 0,
      outputTokens: e.outputTokens || 0,
      userName: e.userName,
      provider: e.provider || null,
      model: e.model || null,
      createdAt: e.createdAt,
    })),
  });
}
