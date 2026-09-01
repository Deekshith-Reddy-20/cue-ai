"use client";

import { type FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/ui/logo";
import { useAuth } from "@/components/providers/auth-provider";

export default function AcceptInvitePage() {
  const params = useParams<{ token: string }>();
  const token = params?.token || "";
  const router = useRouter();
  const { refresh } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<{
    email: string;
    role: string;
    workspace: string;
    expiresAt: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/invites/accept?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (!res.ok || !data.valid) {
          if (!cancelled) setError(data.error || "Invalid invitation.");
          return;
        }
        if (!cancelled) {
          setMeta({
            email: data.email,
            role: data.role,
            workspace: data.workspace,
            expiresAt: data.expiresAt,
          });
        }
      } catch {
        if (!cancelled) setError("Unable to verify invitation.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (token) void load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/invites/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          name: String(form.get("name") || ""),
          password: String(form.get("password") || ""),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not accept invitation.");
        setSubmitting(false);
        return;
      }
      if (typeof window !== "undefined" && data.user) {
        localStorage.setItem(
          "cueai-session",
          JSON.stringify({
            userId: data.user.id,
            name: data.user.name,
            email: data.user.email,
            workspace: data.user.workspace,
            role: data.user.role,
          }),
        );
      }
      refresh();
      router.replace("/dashboard");
    } catch {
      setError("Could not accept invitation.");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md space-y-6">
        <Logo />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Accept invitation</h1>
          <p className="mt-1.5 text-sm text-muted">
            Join your workspace with the secure invite link you received.
          </p>
        </div>

        {loading && <p className="text-sm text-muted">Verifying invitation…</p>}
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
            {error}{" "}
            <Link href="/login" className="underline">
              Sign in
            </Link>
          </div>
        )}

        {meta && !error && (
          <form onSubmit={onSubmit} className="space-y-4">
            <p className="text-sm text-muted">
              Joining <strong className="text-foreground">{meta.workspace}</strong> as{" "}
              <strong className="text-foreground">{meta.role}</strong>
              <br />
              Account: {meta.email}
            </p>
            <Input name="name" label="Full name" required autoComplete="name" />
            <Input
              name="password"
              label="Create password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
            />
            <Button type="submit" variant="gradient" className="w-full" disabled={submitting}>
              {submitting ? "Creating account…" : "Accept & continue"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
