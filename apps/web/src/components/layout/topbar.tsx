"use client";

import {
  Bell,
  Command,
  Moon,
  Search,
  Sun,
  ChevronDown,
  Plus,
  LogOut,
} from "lucide-react";
import { Avatar } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/providers/theme-provider";
import { useAuth } from "@/components/providers/auth-provider";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { DesktopStatusChip } from "@/components/desktop/status-chip";
import { getDesktop, isDesktopApp } from "@/lib/desktop";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function Topbar() {
  const { theme, toggleTheme } = useTheme();
  const { session, logout } = useAuth();
  const router = useRouter();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const displayName = session?.name || "Guest";
  const workspace = session?.workspace || "CueAI";
  const initial = displayName.trim().charAt(0).toUpperCase() || "C";

  async function handleLogout() {
    await logout();
    setProfileOpen(false);
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-[var(--border)] bg-[var(--background)]/80 px-4 backdrop-blur-xl sm:px-6">
      <button className="hidden items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-solid)] px-3 py-1.5 text-sm transition hover:border-[var(--border-strong)] md:inline-flex">
        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br from-teal-600 to-teal-500 text-[10px] font-bold text-white">
          {initial}
        </span>
        <span className="max-w-[140px] truncate font-medium">{workspace}</span>
        <ChevronDown className="h-3.5 w-3.5 text-subtle" />
      </button>

      <button
        data-command-trigger
        className="group flex h-9 max-w-md flex-1 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-solid)] px-3 text-sm text-subtle transition hover:border-[var(--border-strong)]"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Search meetings, docs, answers…</span>
        <kbd className="hidden items-center gap-0.5 rounded-md border border-[var(--border)] bg-[var(--background)] px-1.5 py-0.5 text-[10px] font-medium text-subtle sm:inline-flex">
          <Command className="h-2.5 w-2.5" />K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <DesktopStatusChip />
        {isDesktopApp() && (
          <Button
            size="sm"
            variant="outline"
            className="hidden sm:inline-flex"
            onClick={() => void getDesktop()?.toggleCompanion()}
          >
            Companion
          </Button>
        )}
        <Button href="/meetings/live" size="sm" variant="gradient" className="hidden sm:inline-flex">
          <Plus className="h-3.5 w-3.5" />
          Start Meeting
        </Button>

        <button
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-muted transition hover:bg-[var(--surface-hover)] hover:text-foreground"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <div className="relative">
          <button
            onClick={() => {
              setNotifOpen((o) => !o);
              setProfileOpen(false);
            }}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl text-muted transition hover:bg-[var(--surface-hover)] hover:text-foreground"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-primary" />
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-11 w-80 rounded-2xl border border-[var(--border)] bg-[var(--surface-solid)] p-2 shadow-[var(--shadow-lg)]">
              <p className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-subtle">
                Notifications
              </p>
              {[
                "Welcome to CueAI — your workspace is ready",
                "Try starting a live meeting session",
                "Upload docs to your Knowledge Base",
              ].map((n) => (
                <button
                  key={n}
                  className="flex w-full rounded-xl px-3 py-2.5 text-left text-sm text-muted transition hover:bg-[var(--surface-hover)] hover:text-foreground"
                >
                  {n}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setProfileOpen((o) => !o);
              setNotifOpen(false);
            }}
            className={cn(
              "flex items-center gap-2 rounded-xl py-1 pl-1 pr-2 transition hover:bg-[var(--surface-hover)]"
            )}
          >
            <Avatar name={displayName} size="sm" />
            <span className="hidden max-w-[120px] truncate text-sm font-medium lg:inline">
              {displayName}
            </span>
          </button>
          {profileOpen && (
            <div className="absolute right-0 top-11 w-56 rounded-2xl border border-[var(--border)] bg-[var(--surface-solid)] p-2 shadow-[var(--shadow-lg)]">
              {session ? (
                <>
                  <div className="border-b border-[var(--border)] px-3 py-2">
                    <p className="truncate text-sm font-medium">{session.name}</p>
                    <p className="truncate text-xs text-subtle">{session.email}</p>
                  </div>
                  <Link
                    href="/settings"
                    className="mt-1 block rounded-xl px-3 py-2 text-sm text-muted transition hover:bg-[var(--surface-hover)] hover:text-foreground"
                    onClick={() => setProfileOpen(false)}
                  >
                    Settings
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-400 transition hover:bg-red-500/10"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/signup"
                    className="block rounded-xl px-3 py-2 text-sm font-medium text-primary transition hover:bg-[var(--surface-hover)]"
                    onClick={() => setProfileOpen(false)}
                  >
                    Create account
                  </Link>
                  <Link
                    href="/login"
                    className="block rounded-xl px-3 py-2 text-sm text-muted transition hover:bg-[var(--surface-hover)] hover:text-foreground"
                    onClick={() => setProfileOpen(false)}
                  >
                    Sign in
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
