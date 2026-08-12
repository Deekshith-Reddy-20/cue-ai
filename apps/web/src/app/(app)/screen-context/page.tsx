"use client";

import { useState } from "react";
import {
  Eye,
  EyeOff,
  Monitor,
  RefreshCw,
  ScanText,
  Shield,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const apps = ["Slack", "Notion", "1Password", "Banking"];

export default function ScreenContextPage() {
  const [enabled, setEnabled] = useState(false);
  const [privacy, setPrivacy] = useState(true);
  const [excluded, setExcluded] = useState<string[]>(["1Password", "Banking"]);
  const [showPermission, setShowPermission] = useState(false);

  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-fade-up">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Screen Context AI
          </h1>
          <p className="mt-1 text-sm text-muted">
            Opt-in visual context with OCR — never without your permission.
          </p>
        </div>
        <Button
          variant={enabled ? "danger" : "gradient"}
          onClick={() => {
            if (!enabled) setShowPermission(true);
            else setEnabled(false);
          }}
        >
          {enabled ? "Disable" : "Enable Screen AI"}
        </Button>
      </div>

      {showPermission && !enabled && (
        <Card glow className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--primary-muted)] text-primary">
              <Shield className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Allow screen capture?</h3>
              <p className="mt-1 text-sm text-muted">
                CueAI will analyze visible content to answer questions about what&apos;s
                on your screen. You can exclude apps and disable anytime. Data is not
                stored unless you pin an answer.
              </p>
              <div className="mt-4 flex gap-2">
                <Button
                  variant="gradient"
                  size="sm"
                  onClick={() => {
                    setEnabled(true);
                    setShowPermission(false);
                  }}
                >
                  Allow
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPermission(false)}
                >
                  Not now
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
            <div className="flex items-center gap-2">
              <Monitor className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Screen preview</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={enabled ? "success" : "default"}>
                {enabled ? "Capturing" : "Idle"}
              </Badge>
              <Badge variant="info">
                <ScanText className="h-3 w-3" />
                OCR {enabled ? "active" : "off"}
              </Badge>
            </div>
          </div>
          <div
            className={cn(
              "relative flex aspect-video items-center justify-center bg-[var(--background)]",
              !enabled && "opacity-60"
            )}
          >
            <div className="absolute inset-4 rounded-xl border border-dashed border-[var(--border-strong)] bg-gradient-to-br from-teal-500/10 via-transparent to-violet-500/10">
              <div className="absolute left-4 top-4 h-3 w-32 rounded bg-white/10" />
              <div className="absolute left-4 top-10 h-2 w-48 rounded bg-white/5" />
              <div className="absolute bottom-4 left-4 right-4 h-20 rounded-lg border border-white/10 bg-white/5" />
              {enabled && (
                <div className="absolute right-4 top-4 rounded-lg border border-teal-500/30 bg-teal-500/10 px-2 py-1 text-[10px] text-teal-300">
                  Context detected · Figma · Design Specs
                </div>
              )}
            </div>
            {!enabled && (
              <p className="relative z-10 text-sm text-muted">
                Enable Screen AI to preview context
              </p>
            )}
          </div>
          <div className="flex gap-2 border-t border-[var(--border)] p-3">
            <Button variant="outline" size="sm" disabled={!enabled}>
              Analyze Screen
            </Button>
            <Button variant="ghost" size="sm" disabled={!enabled}>
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto"
              onClick={() => setPrivacy((p) => !p)}
            >
              {privacy ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              Privacy {privacy ? "on" : "off"}
            </Button>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <CardTitle className="mb-3">Monitor selection</CardTitle>
            <div className="space-y-2">
              {["Built-in Display", "DELL U2720Q"].map((m, i) => (
                <label
                  key={m}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--border)] px-3 py-2.5 text-sm hover:bg-[var(--surface-hover)]"
                >
                  <input type="radio" name="monitor" defaultChecked={i === 0} />
                  {m}
                </label>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <CardTitle className="mb-3">Excluded apps</CardTitle>
            <p className="mb-3 text-xs text-subtle">
              These apps will never be captured.
            </p>
            <div className="space-y-2">
              {apps.map((app) => {
                const on = excluded.includes(app);
                return (
                  <button
                    key={app}
                    onClick={() =>
                      setExcluded((prev) =>
                        on ? prev.filter((a) => a !== app) : [...prev, app]
                      )
                    }
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-sm transition",
                      on
                        ? "border-red-500/30 bg-red-500/10 text-red-300"
                        : "border-[var(--border)] text-muted hover:text-foreground"
                    )}
                  >
                    {app}
                    <span className="text-xs">{on ? "Excluded" : "Allowed"}</span>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
