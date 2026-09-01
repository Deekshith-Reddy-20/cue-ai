"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  Building2,
  Database,
  KeyRound,
  Library,
  ScrollText,
  Shield,
  UserPlus,
  Users,
  Cpu,
  BarChart3,
  Lock,
  Trash2,
  RefreshCw,
} from "lucide-react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { RequireAdmin } from "@/components/auth/require-admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs } from "@/components/ui/misc";
import { useAuth } from "@/components/providers/auth-provider";
import { can, type AdminPermission } from "@/lib/roles";
import { cn } from "@/lib/utils";

type NavId =
  | "overview"
  | "workspace"
  | "users"
  | "invitations"
  | "roles"
  | "knowledge"
  | "providers"
  | "models"
  | "tokens"
  | "meetings"
  | "resume"
  | "privacy"
  | "retention"
  | "audit"
  | "settings";

const NAV: { id: NavId; label: string; permission?: AdminPermission }[] = [
  { id: "overview", label: "Overview", permission: "admin.access" },
  { id: "workspace", label: "Workspace", permission: "workspace.read" },
  { id: "users", label: "All Users", permission: "users.read" },
  { id: "invitations", label: "Invitations", permission: "users.read" },
  { id: "roles", label: "Roles", permission: "users.read" },
  { id: "knowledge", label: "Knowledge Base", permission: "knowledge.read" },
  { id: "providers", label: "AI Providers", permission: "ai.read" },
  { id: "models", label: "AI Models", permission: "ai.read" },
  { id: "tokens", label: "Token Usage", permission: "usage.read" },
  { id: "meetings", label: "Meeting Minutes", permission: "usage.read" },
  { id: "resume", label: "Resume Rewrite", permission: "usage.read" },
  { id: "privacy", label: "Privacy", permission: "privacy.read" },
  { id: "retention", label: "Data Retention", permission: "privacy.read" },
  { id: "audit", label: "Activity Log", permission: "audit.read" },
  { id: "settings", label: "Settings", permission: "workspace.read" },
];

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || `Request failed (${res.status})`);
  return data as T;
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: string | number;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-xs text-subtle">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-2 font-display text-2xl font-semibold">{value}</p>
    </Card>
  );
}

function Empty({ message }: { message: string }) {
  return <p className="py-8 text-center text-sm text-muted">{message}</p>;
}

function ErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
      {message}
    </div>
  );
}

function SuccessBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
      {message}
    </div>
  );
}

function AdminPortalInner() {
  const { session } = useAuth();
  const role = session?.role || "User";
  const [tab, setTab] = useState<NavId>("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [overview, setOverview] = useState<{
    workspace: { name: string; seats: number };
    metrics: Record<string, number>;
    permissions: string[];
  } | null>(null);
  const [users, setUsers] = useState<
    Array<{
      id: string;
      name: string;
      email: string;
      role: string;
      status: string;
      createdAt: string;
    }>
  >([]);
  const [userQuery, setUserQuery] = useState("");
  const [invites, setInvites] = useState<
    Array<{ id: string; email: string; role: string; status: string; createdAt: string; expiresAt: string }>
  >([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"Admin" | "Manager" | "User">("User");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [knowledge, setKnowledge] = useState<
    Array<{ id: string; title: string; type: string; status: string; sizeLabel: string; preview: string }>
  >([]);
  const [kbTitle, setKbTitle] = useState("");
  const [kbContent, setKbContent] = useState("");
  const [kbQuery, setKbQuery] = useState("");
  const [ai, setAi] = useState<{
    provider: string;
    model: string;
    defaultModel: string;
    endpoint: string;
    hasApiKey: boolean;
    apiKeyMasked: string;
    enabledProviders: string[];
    enabledModels: string[];
  } | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [usage, setUsage] = useState<{
    period: {
      label: string;
      total: number;
      inputTokens: number;
      outputTokens: number;
      byUser: Array<{ userName: string; quantity: number }>;
      byProvider: Array<{ provider: string; quantity: number }>;
      byModel: Array<{ model: string; quantity: number }>;
      overTime: Array<{ date: string; quantity: number }>;
      eventCount: number;
    };
    recent: Array<Record<string, unknown>>;
  } | null>(null);
  const [usageType, setUsageType] = useState<"tokens" | "meeting_minutes" | "resume_rewrite">("tokens");
  const [privacy, setPrivacy] = useState<Record<string, boolean> | null>(null);
  const [retention, setRetention] = useState<Record<string, number | boolean> | null>(null);
  const [audit, setAudit] = useState<
    Array<{
      id: string;
      createdAt: string;
      actorName: string;
      action: string;
      resourceType: string;
      resourceId: string | null;
    }>
  >([]);
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceSeats, setWorkspaceSeats] = useState(25);
  const [confirmRemove, setConfirmRemove] = useState<{ id: string; email: string } | null>(null);

  const visibleNav = useMemo(
    () => NAV.filter((n) => !n.permission || can(role, n.permission)),
    [role],
  );

  const flash = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3500);
  };

  const loadCore = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ov, us, inv, kb, aiRes, settings, aud] = await Promise.all([
        api<{
          workspace: { name: string; seats: number };
          metrics: Record<string, number>;
          permissions: string[];
        }>("/api/admin/overview"),
        api<{ users: typeof users }>("/api/admin/users"),
        api<{ invites: typeof invites }>("/api/admin/invites"),
        api<{ items: typeof knowledge }>("/api/admin/knowledge"),
        api<{ ai: NonNullable<typeof ai> }>("/api/admin/ai"),
        api<{ privacy: Record<string, boolean>; retention: Record<string, number | boolean> }>(
          "/api/admin/settings",
        ),
        api<{ events: typeof audit }>("/api/admin/audit?limit=100"),
      ]);
      setOverview(ov);
      setUsers(us.users);
      setInvites(inv.invites);
      setKnowledge(kb.items);
      setAi(aiRes.ai);
      setPrivacy(settings.privacy);
      setRetention(settings.retention);
      setAudit(aud.events);
      setWorkspaceName(ov.workspace.name);
      setWorkspaceSeats(ov.workspace.seats);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUsage = useCallback(async (type: typeof usageType) => {
    try {
      const data = await api<NonNullable<typeof usage>>(`/api/admin/usage?type=${type}`);
      setUsage(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load usage");
    }
  }, []);

  useEffect(() => {
    void loadCore();
  }, [loadCore]);

  useEffect(() => {
    if (tab === "tokens" || tab === "meetings" || tab === "resume") {
      const t =
        tab === "tokens" ? "tokens" : tab === "meetings" ? "meeting_minutes" : "resume_rewrite";
      setUsageType(t);
      void loadUsage(t);
    }
  }, [tab, loadUsage]);

  async function searchUsers(q: string) {
    setUserQuery(q);
    try {
      const data = await api<{ users: typeof users }>(
        `/api/admin/users?q=${encodeURIComponent(q)}`,
      );
      setUsers(data.users);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
    }
  }

  async function inviteUser() {
    setError(null);
    try {
      const data = await api<{ invite: { acceptPath: string; note: string } }>("/api/admin/invites", {
        method: "POST",
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      setInviteLink(data.invite.acceptPath);
      setInviteEmail("");
      flash("Invitation created. Share the accept link (email not configured).");
      await loadCore();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invite failed");
    }
  }

  async function removeUser(userId: string) {
    setError(null);
    try {
      await api("/api/admin/users?userId=" + encodeURIComponent(userId), { method: "DELETE" });
      setConfirmRemove(null);
      flash("User deactivated.");
      await loadCore();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Remove failed");
    }
  }

  async function changeRole(userId: string, nextRole: string) {
    setError(null);
    try {
      await api("/api/admin/users", {
        method: "PATCH",
        body: JSON.stringify({ userId, role: nextRole }),
      });
      flash("Role updated.");
      await loadCore();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Role update failed");
    }
  }

  async function saveWorkspace() {
    try {
      await api("/api/admin/workspace", {
        method: "PATCH",
        body: JSON.stringify({ name: workspaceName, seats: workspaceSeats }),
      });
      flash("Workspace updated.");
      await loadCore();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Workspace update failed");
    }
  }

  async function addKnowledge() {
    try {
      await api("/api/admin/knowledge", {
        method: "POST",
        body: JSON.stringify({ title: kbTitle, content: kbContent, type: "note" }),
      });
      setKbTitle("");
      setKbContent("");
      flash("Knowledge item added.");
      const data = await api<{ items: typeof knowledge }>(
        `/api/admin/knowledge?q=${encodeURIComponent(kbQuery)}`,
      );
      setKnowledge(data.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add knowledge");
    }
  }

  async function deleteKnowledge(id: string) {
    if (!window.confirm("Delete this knowledge item?")) return;
    try {
      await api(`/api/admin/knowledge?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      flash("Knowledge item deleted.");
      const data = await api<{ items: typeof knowledge }>(
        `/api/admin/knowledge?q=${encodeURIComponent(kbQuery)}`,
      );
      setKnowledge(data.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  }

  async function saveAi(partial: Record<string, unknown>) {
    try {
      const data = await api<{ ai: NonNullable<typeof ai> }>("/api/admin/ai", {
        method: "PATCH",
        body: JSON.stringify(partial),
      });
      setAi(data.ai);
      setApiKeyInput("");
      flash("AI configuration saved. API keys are never returned to the browser.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "AI save failed");
    }
  }

  async function testAi() {
    try {
      const data = await api<{ ok: boolean; message?: string; error?: string }>("/api/admin/ai", {
        method: "POST",
      });
      if (data.ok) flash(data.message || "Connection OK");
      else setError(data.error || "Connection failed");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connection test failed");
    }
  }

  async function savePrivacyRetention(body: { privacy?: object; retention?: object }) {
    try {
      const data = await api<{
        privacy: Record<string, boolean>;
        retention: Record<string, number | boolean>;
      }>("/api/admin/settings", {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      setPrivacy(data.privacy);
      setRetention(data.retention);
      flash("Settings saved.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Settings save failed");
    }
  }

  const tabItems = visibleNav.map((n) => ({ id: n.id, label: n.label }));

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 animate-fade-up lg:flex-row">
      <aside className="w-full shrink-0 lg:w-56">
        <div className="sticky top-20 space-y-1 rounded-2xl border border-[var(--border)] bg-[var(--background-elevated)] p-2">
          <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-subtle">
            Admin Portal
          </p>
          {visibleNav.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => setTab(n.id)}
              className={cn(
                "flex w-full items-center rounded-xl px-3 py-2 text-left text-sm transition",
                tab === n.id
                  ? "bg-[var(--surface-active)] text-foreground"
                  : "text-muted hover:bg-[var(--surface-hover)] hover:text-foreground",
              )}
            >
              {n.label}
            </button>
          ))}
        </div>
      </aside>

      <div className="min-w-0 flex-1 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant="purple">Admin</Badge>
              <Badge variant="info">{overview?.workspace.name || session?.workspace || "Workspace"}</Badge>
              <Badge>{role}</Badge>
            </div>
            <h1 className="font-display text-2xl font-semibold tracking-tight">Admin Portal</h1>
            <p className="mt-1 text-sm text-muted">
              Workspace, users, AI, usage, privacy, and audit controls.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => void loadCore()} disabled={loading}>
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              Refresh
            </Button>
            {can(role, "users.invite") && (
              <Button variant="gradient" onClick={() => setTab("invitations")}>
                <UserPlus className="h-4 w-4" />
                Invite
              </Button>
            )}
          </div>
        </div>

        <div className="lg:hidden">
          <Tabs tabs={tabItems} active={tab} onChange={(id) => setTab(id as NavId)} />
        </div>

        <ErrorBanner message={error} />
        <SuccessBanner message={success} />

        {loading && !overview ? (
          <Empty message="Loading admin portal…" />
        ) : (
          <>
            {tab === "overview" && overview && (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <Metric icon={Users} label="Active users" value={overview.metrics.activeUsers} />
                  <Metric icon={UserPlus} label="Pending invites" value={overview.metrics.pendingInvites} />
                  <Metric icon={Library} label="Knowledge items" value={overview.metrics.knowledgeItems} />
                  <Metric icon={BarChart3} label="Period tokens" value={overview.metrics.periodTokenUsage} />
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Metric icon={Activity} label="Meeting minutes (period)" value={overview.metrics.periodMeetingMinutes} />
                  <Metric icon={Cpu} label="Resume rewrites (period)" value={overview.metrics.periodResumeRewrites} />
                  <Metric icon={ScrollText} label="Audit events" value={overview.metrics.auditEvents} />
                </div>
                <Card className="p-5">
                  <CardHeader className="p-0">
                    <CardTitle className="text-base">Billing-ready usage</CardTitle>
                    <CardDescription>
                      Token, meeting-minute, and resume-rewrite events are stored with workspace, user,
                      quantity, provider/model, and period metadata for future billing.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>
            )}

            {tab === "workspace" && (
              <Card className="space-y-4 p-5">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <h2 className="font-semibold">Workspace</h2>
                </div>
                <Input
                  label="Workspace name"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  disabled={!can(role, "workspace.write")}
                />
                <Input
                  label="Seats"
                  type="number"
                  value={workspaceSeats}
                  onChange={(e) => setWorkspaceSeats(Number(e.target.value))}
                  disabled={!can(role, "workspace.write")}
                />
                {can(role, "workspace.write") && (
                  <Button onClick={() => void saveWorkspace()}>Save workspace</Button>
                )}
              </Card>
            )}

            {(tab === "users" || tab === "roles") && (
              <Card className="space-y-4 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-semibold">{tab === "roles" ? "Roles" : "All users"}</h2>
                  <Input
                    placeholder="Search users…"
                    value={userQuery}
                    onChange={(e) => void searchUsers(e.target.value)}
                    className="max-w-xs"
                  />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead className="text-xs text-subtle">
                      <tr className="border-b border-[var(--border)]">
                        <th className="py-2 pr-3 font-medium">User</th>
                        <th className="py-2 pr-3 font-medium">Role</th>
                        <th className="py-2 pr-3 font-medium">Status</th>
                        <th className="py-2 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id} className="border-b border-[var(--border)]/60">
                          <td className="py-3 pr-3">
                            <div className="font-medium">{u.name}</div>
                            <div className="text-xs text-muted">{u.email}</div>
                          </td>
                          <td className="py-3 pr-3">
                            {can(role, "users.role") ? (
                              <select
                                className="rounded-lg border border-[var(--border)] bg-transparent px-2 py-1"
                                value={u.role}
                                onChange={(e) => void changeRole(u.id, e.target.value)}
                              >
                                <option value="Admin">Admin</option>
                                <option value="Manager">Manager</option>
                                <option value="User">User</option>
                              </select>
                            ) : (
                              <Badge>{u.role}</Badge>
                            )}
                          </td>
                          <td className="py-3 pr-3">
                            <Badge variant={u.status === "Active" ? "info" : "purple"}>{u.status}</Badge>
                          </td>
                          <td className="py-3">
                            {can(role, "users.remove") && u.status !== "Deactivated" && (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => setConfirmRemove({ id: u.id, email: u.email })}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Remove
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!users.length && <Empty message="No users found." />}
                </div>
              </Card>
            )}

            {tab === "invitations" && (
              <div className="space-y-4">
                {can(role, "users.invite") && (
                  <Card className="space-y-3 p-5">
                    <h2 className="font-semibold">Invite user</h2>
                    <div className="grid gap-3 sm:grid-cols-[1fr_140px_auto]">
                      <Input
                        placeholder="email@company.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                      />
                      <select
                        className="rounded-xl border border-[var(--border)] bg-transparent px-3"
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value as typeof inviteRole)}
                      >
                        <option value="User">User</option>
                        <option value="Manager">Manager</option>
                        <option value="Admin">Admin</option>
                      </select>
                      <Button variant="gradient" onClick={() => void inviteUser()}>
                        Send invite
                      </Button>
                    </div>
                    {inviteLink && (
                      <p className="text-xs text-muted">
                        Accept path: <code className="text-foreground">{inviteLink}</code>
                      </p>
                    )}
                  </Card>
                )}
                <Card className="p-5">
                  <h2 className="mb-3 font-semibold">Pending & recent invitations</h2>
                  {!invites.length ? (
                    <Empty message="No invitations yet." />
                  ) : (
                    <ul className="space-y-2 text-sm">
                      {invites.map((i) => (
                        <li
                          key={i.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--border)] px-3 py-2"
                        >
                          <span>
                            {i.email} · {i.role} · {i.status}
                          </span>
                          {can(role, "users.invite") && i.status === "pending" && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={async () => {
                                await api(`/api/admin/invites?id=${i.id}`, { method: "DELETE" });
                                flash("Invite revoked.");
                                await loadCore();
                              }}
                            >
                              Revoke
                            </Button>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              </div>
            )}

            {tab === "knowledge" && (
              <div className="space-y-4">
                {can(role, "knowledge.write") && (
                  <Card className="space-y-3 p-5">
                    <h2 className="font-semibold">Add knowledge</h2>
                    <Input
                      placeholder="Title"
                      value={kbTitle}
                      onChange={(e) => setKbTitle(e.target.value)}
                    />
                    <textarea
                      className="min-h-[120px] w-full rounded-xl border border-[var(--border)] bg-transparent p-3 text-sm"
                      placeholder="Content…"
                      value={kbContent}
                      onChange={(e) => setKbContent(e.target.value)}
                    />
                    <Button onClick={() => void addKnowledge()}>Add item</Button>
                  </Card>
                )}
                <Card className="space-y-3 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="font-semibold">Knowledge base</h2>
                    <Input
                      placeholder="Search…"
                      value={kbQuery}
                      className="max-w-xs"
                      onChange={async (e) => {
                        setKbQuery(e.target.value);
                        const data = await api<{ items: typeof knowledge }>(
                          `/api/admin/knowledge?q=${encodeURIComponent(e.target.value)}`,
                        );
                        setKnowledge(data.items);
                      }}
                    />
                  </div>
                  {!knowledge.length ? (
                    <Empty message="No knowledge items." />
                  ) : (
                    <ul className="space-y-2">
                      {knowledge.map((k) => (
                        <li
                          key={k.id}
                          className="rounded-xl border border-[var(--border)] p-3 text-sm"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <p className="font-medium">{k.title}</p>
                              <p className="mt-1 text-xs text-muted">
                                {k.type} · {k.status} · {k.sizeLabel}
                              </p>
                              <p className="mt-2 text-muted">{k.preview}</p>
                            </div>
                            {can(role, "knowledge.write") && (
                              <Button size="sm" variant="secondary" onClick={() => void deleteKnowledge(k.id)}>
                                Delete
                              </Button>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              </div>
            )}

            {(tab === "providers" || tab === "models") && ai && (
              <Card className="space-y-4 p-5">
                <div className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4" />
                  <h2 className="font-semibold">
                    {tab === "providers" ? "AI providers" : "AI models"}
                  </h2>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-sm">
                    <span className="mb-1 block text-muted">Provider</span>
                    <select
                      className="w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2"
                      value={ai.provider}
                      disabled={!can(role, "ai.write")}
                      onChange={(e) => void saveAi({ provider: e.target.value })}
                    >
                      <option value="groq">Groq</option>
                      <option value="openai">OpenAI</option>
                      <option value="anthropic">Anthropic</option>
                      <option value="custom">Custom</option>
                    </select>
                  </label>
                  <Input
                    label="Endpoint"
                    value={ai.endpoint}
                    disabled={!can(role, "ai.write")}
                    onBlur={(e) => void saveAi({ endpoint: e.target.value })}
                    onChange={(e) => setAi({ ...ai, endpoint: e.target.value })}
                  />
                </div>
                <Input
                  label="Default model"
                  value={ai.defaultModel}
                  disabled={!can(role, "ai.write")}
                  onChange={(e) => setAi({ ...ai, defaultModel: e.target.value })}
                  onBlur={(e) => void saveAi({ defaultModel: e.target.value, model: e.target.value })}
                />
                <Input
                  label="Enabled models (comma-separated)"
                  value={ai.enabledModels.join(", ")}
                  disabled={!can(role, "ai.write")}
                  onChange={(e) =>
                    setAi({
                      ...ai,
                      enabledModels: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  onBlur={() =>
                    void saveAi({
                      enabledModels: ai.enabledModels,
                    })
                  }
                />
                {can(role, "ai.write") && (
                  <>
                    <Input
                      label="API key (write-only — never shown again in full)"
                      type="password"
                      placeholder={ai.hasApiKey ? ai.apiKeyMasked : "Paste API key"}
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={() => void saveAi({ apiKey: apiKeyInput })}
                        disabled={!apiKeyInput.trim()}
                      >
                        Save key
                      </Button>
                      <Button variant="secondary" onClick={() => void saveAi({ clearApiKey: true })}>
                        Clear key
                      </Button>
                      <Button variant="secondary" onClick={() => void testAi()}>
                        Test connection
                      </Button>
                    </div>
                  </>
                )}
                {!can(role, "ai.write") && (
                  <p className="text-sm text-muted">
                    Key configured: {ai.hasApiKey ? ai.apiKeyMasked : "No"} (read-only for your role)
                  </p>
                )}
              </Card>
            )}

            {(tab === "tokens" || tab === "meetings" || tab === "resume") && (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <Metric
                    icon={BarChart3}
                    label={`${usage?.period.label || "Period"} total`}
                    value={usage?.period.total ?? "—"}
                  />
                  <Metric icon={Activity} label="Input tokens" value={usage?.period.inputTokens ?? "—"} />
                  <Metric icon={Cpu} label="Output tokens" value={usage?.period.outputTokens ?? "—"} />
                  <Metric icon={Database} label="Events" value={usage?.period.eventCount ?? "—"} />
                </div>
                <Card className="p-5">
                  <h2 className="mb-3 font-semibold">Usage over time</h2>
                  {usage?.period.overTime?.length ? (
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={usage.period.overTime}>
                          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Bar dataKey="quantity" fill="var(--foreground)" radius={4} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <Empty message="No usage in the current period yet. Run Resume Tailor or transcription to generate events." />
                  )}
                </Card>
                <div className="grid gap-4 lg:grid-cols-2">
                  <Card className="p-5">
                    <h3 className="mb-2 font-semibold">By user</h3>
                    <ul className="space-y-1 text-sm">
                      {(usage?.period.byUser || []).map((u) => (
                        <li key={u.userName} className="flex justify-between">
                          <span>{u.userName}</span>
                          <span className="text-muted">{u.quantity}</span>
                        </li>
                      ))}
                      {!usage?.period.byUser?.length && <Empty message="No per-user data." />}
                    </ul>
                  </Card>
                  <Card className="p-5">
                    <h3 className="mb-2 font-semibold">
                      {tab === "tokens" ? "By provider / model" : "Breakdown"}
                    </h3>
                    <ul className="space-y-1 text-sm">
                      {(usage?.period.byProvider || []).map((p) => (
                        <li key={p.provider} className="flex justify-between">
                          <span>{p.provider}</span>
                          <span className="text-muted">{p.quantity}</span>
                        </li>
                      ))}
                      {(usage?.period.byModel || []).map((m) => (
                        <li key={m.model} className="flex justify-between">
                          <span className="truncate pr-2">{m.model}</span>
                          <span className="text-muted">{m.quantity}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                </div>
              </div>
            )}

            {tab === "privacy" && privacy && (
              <Card className="space-y-3 p-5">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  <h2 className="font-semibold">Privacy</h2>
                </div>
                {(
                  [
                    ["shareTranscriptsWithTeam", "Share transcripts with team"],
                    ["allowAiTrainingOptIn", "Allow AI training opt-in"],
                    ["redactPiiInExports", "Redact PII in exports"],
                    ["requireInviteForJoin", "Require invite to join"],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="flex items-center justify-between gap-3 text-sm">
                    <span>{label}</span>
                    <input
                      type="checkbox"
                      checked={Boolean(privacy[key])}
                      disabled={!can(role, "privacy.write")}
                      onChange={(e) => {
                        const next = { ...privacy, [key]: e.target.checked };
                        setPrivacy(next);
                        if (can(role, "privacy.write")) {
                          void savePrivacyRetention({ privacy: { [key]: e.target.checked } });
                        }
                      }}
                    />
                  </label>
                ))}
              </Card>
            )}

            {tab === "retention" && retention && (
              <Card className="space-y-3 p-5">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  <h2 className="font-semibold">Data retention</h2>
                </div>
                <p className="text-xs text-muted">
                  Configuration only — automated deletion is not executed until a scheduled cleanup job is
                  enabled.
                </p>
                {(
                  [
                    ["meetingDays", "Meeting data (days)"],
                    ["transcriptDays", "Transcripts (days)"],
                    ["notesDays", "Generated notes (days)"],
                    ["resumeDays", "Resume data (days)"],
                    ["knowledgeDays", "Knowledge base (days)"],
                  ] as const
                ).map(([key, label]) => (
                  <Input
                    key={key}
                    label={label}
                    type="number"
                    value={Number(retention[key] || 0)}
                    disabled={!can(role, "retention.write")}
                    onChange={(e) =>
                      setRetention({ ...retention, [key]: Number(e.target.value) })
                    }
                    onBlur={() => {
                      if (can(role, "retention.write")) {
                        void savePrivacyRetention({
                          retention: { [key]: Number(retention[key]) },
                        });
                      }
                    }}
                  />
                ))}
                <label className="flex items-center justify-between gap-3 text-sm">
                  <span>Enable auto-delete flag (no purge runs yet)</span>
                  <input
                    type="checkbox"
                    checked={Boolean(retention.autoDeleteEnabled)}
                    disabled={!can(role, "retention.write")}
                    onChange={(e) => {
                      setRetention({ ...retention, autoDeleteEnabled: e.target.checked });
                      if (can(role, "retention.write")) {
                        void savePrivacyRetention({
                          retention: { autoDeleteEnabled: e.target.checked },
                        });
                      }
                    }}
                  />
                </label>
              </Card>
            )}

            {tab === "audit" && (
              <Card className="p-5">
                <div className="mb-3 flex items-center gap-2">
                  <ScrollText className="h-4 w-4" />
                  <h2 className="font-semibold">Activity log</h2>
                </div>
                {!audit.length ? (
                  <Empty message="No activity yet." />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] text-left text-sm">
                      <thead className="text-xs text-subtle">
                        <tr className="border-b border-[var(--border)]">
                          <th className="py-2 pr-3">Time</th>
                          <th className="py-2 pr-3">Actor</th>
                          <th className="py-2 pr-3">Action</th>
                          <th className="py-2">Resource</th>
                        </tr>
                      </thead>
                      <tbody>
                        {audit.map((e) => (
                          <tr key={e.id} className="border-b border-[var(--border)]/60">
                            <td className="py-2 pr-3 text-xs text-muted">
                              {new Date(e.createdAt).toLocaleString()}
                            </td>
                            <td className="py-2 pr-3">{e.actorName}</td>
                            <td className="py-2 pr-3">{e.action}</td>
                            <td className="py-2 text-muted">
                              {e.resourceType}
                              {e.resourceId ? ` · ${e.resourceId}` : ""}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            )}

            {tab === "settings" && (
              <Card className="space-y-3 p-5">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <h2 className="font-semibold">Admin settings</h2>
                </div>
                <p className="text-sm text-muted">
                  Role: <strong>{role}</strong>. Managers can view most admin data but cannot invite/remove
                  users, change AI secrets, or write privacy/retention unless promoted to Admin.
                </p>
                <p className="text-sm text-muted">
                  Bootstrap admin for local testing: <code>admin@cueai.local</code> / <code>admin123</code>{" "}
                  (first real signup becomes Admin and deactivates the bootstrap account).
                </p>
              </Card>
            )}
          </>
        )}

        {confirmRemove && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <Card className="w-full max-w-md space-y-4 p-5">
              <h3 className="font-semibold">Deactivate user?</h3>
              <p className="text-sm text-muted">
                This soft-deactivates <strong>{confirmRemove.email}</strong>. Historical usage and audit
                data are preserved. They will not be able to sign in.
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setConfirmRemove(null)}>
                  Cancel
                </Button>
                <Button onClick={() => void removeUser(confirmRemove.id)}>Confirm remove</Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <RequireAdmin>
      <AdminPortalInner />
    </RequireAdmin>
  );
}
