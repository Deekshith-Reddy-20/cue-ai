"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { RequireAuth } from "@/components/auth/require-auth";
import { useAuth } from "@/components/providers/auth-provider";
import { Logo } from "@/components/ui/logo";

/**
 * Resume Tailor product shell — isolated from CueAI sidebar / Admin chrome.
 * Shared session/auth is fine; UI must stay Resume Tailor only.
 */
export default function ResumeProductLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <ResumeShell>{children}</ResumeShell>
    </RequireAuth>
  );
}

function ResumeShell({ children }: { children: ReactNode }) {
  const { session, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="flex h-14 items-center justify-between border-b border-[var(--border)] px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Logo size="sm" href="/" />
          <span className="hidden h-4 w-px bg-[var(--border)] sm:block" aria-hidden />
          <span className="text-sm font-semibold tracking-tight">Resume Tailor</span>
        </div>
        <nav className="flex items-center gap-3 text-sm">
          {session?.email ? (
            <span className="hidden max-w-[12rem] truncate text-xs text-muted sm:inline">
              {session.email}
            </span>
          ) : null}
          <Link href="/" className="text-muted transition hover:text-foreground">
            Home
          </Link>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="text-muted transition hover:text-foreground"
          >
            Log out
          </button>
        </nav>
      </header>
      <main className="cue-scroll mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
