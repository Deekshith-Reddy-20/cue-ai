"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Clock,
  FileText,
  Library,
  Monitor,
  Pin,
  Sparkles,
  Video,
} from "lucide-react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/misc";
import {
  activity,
  recentMeetings,
  stats,
  usageSeries,
} from "@/lib/mock-data";
import { useAuth } from "@/components/providers/auth-provider";
import { greetingFor } from "@/lib/auth";

export default function DashboardPage() {
  const { session, ready } = useAuth();
  const name = session?.name || "there";
  const workspace = session?.workspace || "Your Workspace";

  return (
    <div className="mx-auto max-w-7xl space-y-6 animate-fade-up">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            {ready ? greetingFor(name) : "Welcome"}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {session
              ? `${workspace} · signed in as ${session.email}`
              : "Your AI copilot is ready. Sign up to personalize this workspace."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/meetings/live">
            <Button variant="gradient">
              <Sparkles className="h-4 w-4" />
              Start live session
            </Button>
          </Link>
          <Link href="/companion">
            <Button variant="outline">
              <Monitor className="h-4 w-4" />
              Open Companion
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} hover className="p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-subtle">
              {s.label}
            </p>
            <div className="mt-2 flex items-end justify-between">
              <p className="font-display text-3xl font-semibold tracking-tight">
                {s.value}
              </p>
              <span className="inline-flex items-center gap-0.5 text-xs font-medium text-teal-400">
                <ArrowUpRight className="h-3 w-3" />
                {s.delta}
              </span>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        {/* Chart */}
        <Card className="p-5">
          <CardHeader>
            <div>
              <CardTitle>Weekly AI usage</CardTitle>
              <CardDescription>Meetings and token volume</CardDescription>
            </div>
            <Badge variant="info">This week</Badge>
          </CardHeader>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={usageSeries}>
                <defs>
                  <linearGradient id="usageFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#14b8a6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#71717a", fontSize: 12 }}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    background: "#18181b",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="tokens"
                  stroke="#2dd4bf"
                  fill="url(#usageFill)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Usage meters */}
        <Card className="space-y-5 p-5">
          <CardTitle>Resource usage</CardTitle>
          {[
            { label: "AI tokens", value: 68, hint: "340k / 500k" },
            { label: "Storage", value: 42, hint: "8.4 GB / 20 GB" },
            { label: "Desktop Companion", value: 91, hint: "Connected" },
          ].map((u) => (
            <div key={u.label}>
              <div className="mb-1.5 flex justify-between text-sm">
                <span className="text-muted">{u.label}</span>
                <span className="text-subtle">{u.hint}</span>
              </div>
              <Progress value={u.value} />
            </div>
          ))}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--primary-muted)] p-3 text-sm text-teal-300">
            Pro plan renews Aug 28 · Manage in Settings → Billing
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr_1fr]">
        {/* Recent meetings */}
        <Card className="p-5">
          <CardHeader>
            <div>
              <CardTitle>Recent meetings</CardTitle>
              <CardDescription>Jump back into context</CardDescription>
            </div>
            <Link href="/meetings" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <div className="space-y-2">
            {recentMeetings.map((m) => (
              <Link
                key={m.id}
                href={
                  m.status === "live"
                    ? "/meetings/live"
                    : `/meetings/${m.id}/summary`
                }
                className="flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 transition hover:border-[var(--border)] hover:bg-[var(--surface-hover)]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary-muted)] text-primary">
                  <Video className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">{m.title}</p>
                    {m.status === "live" && <Badge variant="success">Live</Badge>}
                  </div>
                  <p className="text-xs text-subtle">
                    {m.time} · {m.duration} · {m.attendees} people
                  </p>
                </div>
                <Clock className="h-4 w-4 text-subtle" />
              </Link>
            ))}
          </div>
        </Card>

        {/* Quick actions */}
        <Card className="p-5">
          <CardTitle className="mb-4">Quick actions</CardTitle>
          <div className="grid gap-2">
            {[
              { href: "/resume", icon: FileText, label: "Tailor a resume" },
              { href: "/knowledge", icon: Library, label: "Upload to Knowledge" },
              { href: "/screen-context", icon: Monitor, label: "Enable Screen AI" },
              { href: "/translation", icon: Sparkles, label: "Start translation" },
            ].map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="flex items-center gap-3 rounded-xl border border-[var(--border)] px-3 py-3 text-sm transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]"
              >
                <a.icon className="h-4 w-4 text-primary" />
                {a.label}
              </Link>
            ))}
          </div>
        </Card>

        {/* Activity + pins */}
        <Card className="p-5">
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <Pin className="h-4 w-4 text-subtle" />
          </CardHeader>
          <div className="space-y-3">
            {activity.map((a) => (
              <div key={a.id} className="flex gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <div>
                  <p className="text-sm text-foreground/90">{a.text}</p>
                  <p className="text-[11px] text-subtle">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-xl border border-[var(--border)] p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-subtle">
              Pinned answer
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              Target p95 &lt; 800ms for suggestion cards during live sessions.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
