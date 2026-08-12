"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Video,
  FileText,
  Library,
  Languages,
  Monitor,
  Settings,
  Shield,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  AppWindow,
  Palette,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/utils";
import { useState } from "react";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/meetings", label: "Meetings", icon: Video },
  { href: "/meetings/live", label: "Live Session", icon: Sparkles },
  { href: "/resume", label: "Resume Tailor", icon: FileText },
  { href: "/knowledge", label: "Knowledge Base", icon: Library },
  { href: "/translation", label: "Translation", icon: Languages },
  { href: "/screen-context", label: "Screen Context", icon: Monitor },
  { href: "/companion", label: "Desktop Companion", icon: AppWindow },
  { href: "/admin", label: "Admin Portal", icon: Shield },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/design-system", label: "Design System", icon: Palette },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "sticky top-0 z-30 flex h-screen flex-col border-r border-[var(--border)] bg-[var(--background-elevated)] transition-all duration-300",
        collapsed ? "w-[72px]" : "w-[var(--sidebar-width)]"
      )}
    >
      <div className={cn("flex h-14 items-center px-4", collapsed && "justify-center px-2")}>
        {collapsed ? (
          <Link href="/dashboard" aria-label="CueAI" className="flex h-8 w-8 items-center justify-center rounded-xl btn-gradient">
            <Sparkles className="h-4 w-4 text-white" />
          </Link>
        ) : (
          <Logo size="sm" href="/dashboard" />
        )}
      </div>

      <nav className="cue-scroll flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
        {!collapsed && (
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-subtle">
            Workspace
          </p>
        )}
        {nav.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" &&
              item.href !== "/meetings/live" &&
              pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                active
                  ? "bg-[var(--primary-muted)] text-primary"
                  : "text-muted hover:bg-[var(--surface-hover)] hover:text-foreground",
                collapsed && "justify-center px-2"
              )}
            >
              <Icon
                className={cn(
                  "h-[18px] w-[18px] shrink-0 transition-transform group-hover:scale-105",
                  active && "text-primary"
                )}
              />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {!collapsed && active && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[var(--border)] p-2">
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm text-muted transition hover:bg-[var(--surface-hover)] hover:text-foreground"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
