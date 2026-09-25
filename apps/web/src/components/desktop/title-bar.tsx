"use client";

import { useEffect, useState } from "react";
import { Minus, Square, Copy, X } from "lucide-react";
import { BrandMark } from "@/components/ui/logo";
import { getDesktop, isDesktopApp } from "@/lib/desktop";
import { cn } from "@/lib/utils";

/** Frameless window chrome — only rendered inside Electron. Top-right: min / max / close. */
export function DesktopTitleBar() {
  const visible = isDesktopApp();
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const desktop = getDesktop();
    if (!desktop) return;
    let active = true;
    void desktop.isMaximized().then((value) => {
      if (active) setMaximized(value);
    });
    return desktop.onMaximizedChange(setMaximized);
  }, [visible]);

  if (!visible) return null;

  const desktop = getDesktop();

  return (
    <header
      className="flex h-10 shrink-0 items-center border-b border-[var(--border)] bg-[var(--background-elevated)]/90 px-2 backdrop-blur-xl"
      style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
    >
      <div className="flex items-center gap-2 pl-1">
        <BrandMark size="sm" className="h-5 w-5" />
        <span className="text-xs font-semibold tracking-tight">CueAI</span>
      </div>

      <div
        className="ml-auto flex h-full items-stretch"
        style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
      >
        <WinBtn label="Minimize" onClick={() => void desktop?.minimize()}>
          <Minus className="h-3.5 w-3.5" />
        </WinBtn>
        <WinBtn
          label={maximized ? "Restore" : "Maximize"}
          onClick={() => void desktop?.maximize()}
        >
          {maximized ? <Copy className="h-3 w-3" /> : <Square className="h-3 w-3" />}
        </WinBtn>
        <WinBtn label="Close" danger onClick={() => void desktop?.close()}>
          <X className="h-3.5 w-3.5" />
        </WinBtn>
      </div>
    </header>
  );
}

function WinBtn({
  children,
  onClick,
  label,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "flex h-full w-11 items-center justify-center text-muted transition",
        danger
          ? "hover:bg-[#e81123] hover:text-white"
          : "hover:bg-[var(--surface-hover)] hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
