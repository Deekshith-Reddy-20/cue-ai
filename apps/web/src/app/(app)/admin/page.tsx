"use client";

import { useState } from "react";
import {
  Building2,
  FileSearch,
  KeyRound,
  Library,
  Shield,
  UserPlus,
  Users,
  Activity,
  CreditCard,
  ScrollText,
} from "lucide-react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress, Tabs } from "@/components/ui/misc";
import { adminUsers, usageSeries } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "users", label: "Users" },
  { id: "security", label: "Security" },
  { id: "usage", label: "Usage" },
  { id: "audit", label: "Audit logs" },
];

export default function AdminPage() {
  const [tab, setTab] = useState("overview");

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-up">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="purple">Enterprise</Badge>
            <Badge variant="info">Acme Corp</Badge>
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Admin Portal
          </h1>
          <p className="mt-1 text-sm text-muted">
            Workspace management, security, and usage analytics.
          </p>
        </div>
        <Button variant="gradient">
          <UserPlus className="h-4 w-4" />
          Invite members
        </Button>
      </div>

      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {tab === "overview" && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { icon: Users, label: "Seats", value: "48 / 60" },
              { icon: Activity, label: "Active today", value: "31" },
              { icon: Library, label: "KB documents", value: "214" },
              { icon: CreditCard, label: "Monthly spend", value: "$3,792" },
            ].map((s) => (
              <Card key={s.label} className="p-4">
                <div className="flex items-center gap-2 text-xs text-subtle">
                  <s.icon className="h-3.5 w-3.5" />
                  {s.label}
                </div>
                <p className="mt-2 font-display text-2xl font-semibold">{s.value}</p>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="p-5">
              <CardHeader>
                <CardTitle>Workspace health</CardTitle>
                <CardDescription>Retention · SSO · Models</CardDescription>
              </CardHeader>
              <div className="space-y-4">
                {[
                  { label: "SSO / SCIM", value: "Configured", ok: true },
                  { label: "Retention policy", value: "90 days", ok: true },
                  { label: "Private models", value: "Pending", ok: false },
                  { label: "Audit logging", value: "Enabled", ok: true },
                ].map((r) => (
                  <div
                    key={r.label}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-muted">{r.label}</span>
                    <Badge variant={r.ok ? "success" : "warning"}>{r.value}</Badge>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5">
              <CardHeader>
                <CardTitle>Roles & permissions</CardTitle>
              </CardHeader>
              <div className="space-y-2">
                {[
                  ["Admin", "Full access · billing · audit"],
                  ["Member", "Meetings · knowledge · companion"],
                  ["Viewer", "Read summaries & exports"],
                ].map(([role, desc]) => (
                  <div
                    key={role}
                    className="rounded-xl border border-[var(--border)] px-4 py-3"
                  >
                    <p className="text-sm font-medium">{role}</p>
                    <p className="text-xs text-subtle">{desc}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}

      {tab === "users" && (
        <Card className="overflow-hidden p-0">
          <div className="flex flex-wrap items-center gap-3 border-b border-[var(--border)] p-4">
            <div className="min-w-[200px] flex-1">
              <Input placeholder="Search members…" />
            </div>
            <Button variant="outline" size="sm">
              Export CSV
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-xs uppercase tracking-wider text-subtle">
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {adminUsers.map((u) => (
                  <tr key={u.email} className="border-b border-[var(--border)]/60">
                    <td className="px-4 py-3">
                      <p className="font-medium">{u.name}</p>
                      <p className="text-xs text-subtle">{u.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="info">{u.role}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={u.status === "Active" ? "success" : "warning"}>
                        {u.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Button size="sm" variant="ghost">
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === "security" && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="space-y-4 p-5">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <CardTitle>Security</CardTitle>
            </div>
            {[
              "Require SSO for all members",
              "Enforce 2FA",
              "Block personal email invites",
              "IP allowlisting",
            ].map((l, i) => (
              <label
                key={l}
                className="flex items-center justify-between rounded-xl border border-[var(--border)] px-4 py-3 text-sm"
              >
                {l}
                <input type="checkbox" defaultChecked={i < 3} className="rounded" />
              </label>
            ))}
          </Card>
          <Card className="space-y-4 p-5">
            <div className="flex items-center gap-2">
              <ScrollText className="h-4 w-4 text-primary" />
              <CardTitle>Retention policy</CardTitle>
            </div>
            <p className="text-sm text-muted">
              Automatically delete meeting data after the retention window.
            </p>
            <div className="flex flex-wrap gap-2">
              {["30 days", "90 days", "180 days", "365 days"].map((d, i) => (
                <button
                  key={d}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-sm",
                    i === 1
                      ? "border-teal-500/30 bg-[var(--primary-muted)] text-primary"
                      : "border-[var(--border)] text-muted"
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
            <Button size="sm" variant="primary">
              Save policy
            </Button>
          </Card>
          <Card className="space-y-3 p-5 md:col-span-2">
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-primary" />
              <CardTitle>Model configuration</CardTitle>
            </div>
            <Input label="Private endpoint URL" placeholder="https://models.acme.internal/v1" />
            <Input label="Workspace API key" type="password" defaultValue="••••••••••••" />
          </Card>
        </div>
      )}

      {tab === "usage" && (
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <Card className="p-5">
            <CardTitle className="mb-4">Usage analytics</CardTitle>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={usageSeries}>
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
                  <Bar dataKey="meetings" fill="#14b8a6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card className="space-y-5 p-5">
            <CardTitle>Token & storage</CardTitle>
            {[
              { label: "Workspace tokens", value: 72, hint: "3.6M / 5M" },
              { label: "Knowledge storage", value: 38, hint: "19 GB / 50 GB" },
              { label: "Companion seats", value: 80, hint: "48 / 60" },
            ].map((u) => (
              <div key={u.label}>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span className="text-muted">{u.label}</span>
                  <span className="text-subtle">{u.hint}</span>
                </div>
                <Progress value={u.value} />
              </div>
            ))}
          </Card>
        </div>
      )}

      {tab === "audit" && (
        <Card className="overflow-hidden p-0">
          <div className="border-b border-[var(--border)] px-4 py-3">
            <div className="flex items-center gap-2">
              <FileSearch className="h-4 w-4 text-primary" />
              <CardTitle>Audit logs</CardTitle>
            </div>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {[
              ["Alex Chen", "Updated retention policy to 90 days", "10:14 AM"],
              ["Priya Nair", "Invited jordan@acme.com as Viewer", "9:02 AM"],
              ["System", "Knowledge base re-index completed", "Yesterday"],
              ["Marcus Lee", "Created API key cue_live_…3f9a", "Mon"],
              ["Alex Chen", "Enabled SSO enforcement", "Sun"],
            ].map(([who, action, when]) => (
              <div
                key={action + when}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium">{who}</p>
                  <p className="text-muted">{action}</p>
                </div>
                <span className="text-xs text-subtle">{when}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="flex flex-wrap items-center gap-3 p-4">
        <Building2 className="h-4 w-4 text-primary" />
        <p className="text-sm text-muted">
          Need a custom DPA or region lock? Contact enterprise support.
        </p>
        <Button size="sm" variant="outline" className="ml-auto">
          Contact sales
        </Button>
      </Card>
    </div>
  );
}
