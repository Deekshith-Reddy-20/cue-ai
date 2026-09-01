import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/server/api-auth";
import { readStore, type DbUsageEvent } from "@/lib/server/db";

function inCurrentPeriod(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  return d.getUTCFullYear() === now.getUTCFullYear() && d.getUTCMonth() === now.getUTCMonth();
}

function byUserAgg(events: DbUsageEvent[]) {
  const map = new Map<string, { userId: string; userName: string; quantity: number; events: number }>();
  for (const e of events) {
    const u = map.get(e.userId) || { userId: e.userId, userName: e.userName, quantity: 0, events: 0 };
    u.quantity += e.quantity;
    u.events += 1;
    map.set(e.userId, u);
  }
  return [...map.values()].sort((a, b) => b.quantity - a.quantity);
}

function overTimeAgg(events: DbUsageEvent[]) {
  const byDay = new Map<string, number>();
  for (const e of events) {
    const day = e.createdAt.slice(0, 10);
    byDay.set(day, (byDay.get(day) || 0) + e.quantity);
  }
  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, quantity]) => ({ date, quantity }));
}

function tokenAgg(events: DbUsageEvent[]) {
  let total = 0;
  let inputTokens = 0;
  let outputTokens = 0;
  const byProvider = new Map<string, number>();
  const byModel = new Map<string, number>();
  for (const e of events) {
    total += e.quantity;
    inputTokens += e.inputTokens || 0;
    outputTokens += e.outputTokens || 0;
    if (e.provider) byProvider.set(e.provider, (byProvider.get(e.provider) || 0) + e.quantity);
    if (e.model) byModel.set(e.model, (byModel.get(e.model) || 0) + e.quantity);
  }
  return {
    total,
    inputTokens,
    outputTokens,
    byUser: byUserAgg(events),
    byProvider: [...byProvider.entries()].map(([provider, quantity]) => ({ provider, quantity })),
    byModel: [...byModel.entries()].map(([model, quantity]) => ({ model, quantity })),
    overTime: overTimeAgg(events),
    eventCount: events.length,
  };
}

export async function GET(req: NextRequest) {
  const { error, session } = await requirePermission("usage.read", req);
  if (error || !session) return error;

  const type = (req.nextUrl.searchParams.get("type") || "tokens") as
    | DbUsageEvent["type"]
    | "all";
  const store = await readStore();
  const { scopeUsage } = await import("@/lib/server/workspace-scope");
  const all = scopeUsage(store, session.workspaceId);
  const periodLabel = new Date().toISOString().slice(0, 7);

  if (type === "meeting_minutes") {
    const events = all.filter((e) => e.type === "meeting_minutes");
    const period = events.filter((e) => inCurrentPeriod(e.createdAt));
    const totalMinutes = period.reduce((s, e) => s + e.quantity, 0);
    const sessions = period.length;
    return NextResponse.json({
      kind: "meeting_minutes",
      workspaceId: session.workspaceId,
      workspaceName: store.workspace.name,
      period: {
        label: periodLabel,
        meetingsProcessed: sessions,
        totalMinutes,
        averageMinutes: sessions ? Math.round((totalMinutes / sessions) * 10) / 10 : 0,
        transcriptionsGenerated: sessions,
        byUser: byUserAgg(period),
        overTime: overTimeAgg(period),
        eventCount: sessions,
      },
      allTime: {
        meetingsProcessed: events.length,
        totalMinutes: events.reduce((s, e) => s + e.quantity, 0),
        eventCount: events.length,
      },
      recent: events.slice(0, 50).map((e) => ({
        id: e.id,
        minutes: e.quantity,
        userName: e.userName,
        provider: e.provider || null,
        model: e.model || null,
        createdAt: e.createdAt,
        label: e.metadata?.label || null,
      })),
    });
  }

  if (type === "resume_rewrite") {
    const events = all.filter((e) => e.type === "resume_rewrite");
    const period = events.filter((e) => inCurrentPeriod(e.createdAt));
    const totalRewrites = period.reduce((s, e) => s + e.quantity, 0);
    return NextResponse.json({
      kind: "resume_rewrite",
      workspaceId: session.workspaceId,
      workspaceName: store.workspace.name,
      period: {
        label: periodLabel,
        totalRewrites,
        successfulRewrites: totalRewrites,
        failedRewrites: 0,
        operations: period.length,
        byUser: byUserAgg(period),
        overTime: overTimeAgg(period),
        eventCount: period.length,
      },
      allTime: {
        totalRewrites: events.reduce((s, e) => s + e.quantity, 0),
        operations: events.length,
      },
      recent: events.slice(0, 50).map((e) => ({
        id: e.id,
        rewrites: e.quantity,
        userName: e.userName,
        provider: e.provider || null,
        model: e.model || null,
        createdAt: e.createdAt,
        status: "success",
      })),
    });
  }

  // tokens (default)
  const events = type === "all" ? all : all.filter((e) => e.type === "tokens");
  const periodEvents = events.filter((e) => inCurrentPeriod(e.createdAt));
  return NextResponse.json({
    kind: "tokens",
    workspaceId: session.workspaceId,
    workspaceName: store.workspace.name,
    period: {
      label: periodLabel,
      ...tokenAgg(periodEvents),
    },
    allTime: tokenAgg(events),
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
      feature: e.metadata?.feature || null,
    })),
  });
}
