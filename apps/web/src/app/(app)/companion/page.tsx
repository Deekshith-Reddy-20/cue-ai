"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Monitor,
  Sparkles,
  Terminal,
  Keyboard,
  Layers,
  ArrowUpRight,
} from "lucide-react";

const features = [
  {
    icon: Layers,
    title: "Always-on-top overlay",
    desc: "Frameless glass window that floats above Zoom, Meet, and Teams.",
  },
  {
    icon: Keyboard,
    title: "Global hotkey",
    desc: "Toggle with ⌘⇧C / Ctrl+Shift+C without leaving your meeting.",
  },
  {
    icon: Sparkles,
    title: "Live AI answers",
    desc: "Transcript, mic indicators, pin/copy/regenerate, presenter mode.",
  },
];

export default function CompanionPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-up">
      <div>
        <Badge variant="info" className="mb-3">
          Desktop app · React + TypeScript + Electron
        </Badge>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          CueAI Desktop Companion
        </h1>
        <p className="mt-2 text-sm text-muted">
          The meeting assistant overlay lives in a native desktop app — separate from this
          Next.js web dashboard.
        </p>
      </div>

      <Card glow className="space-y-4">
        <CardHeader>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl btn-gradient text-white">
            <Monitor className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>Run the desktop overlay</CardTitle>
            <CardDescription>
              From the repo root, start the Electron companion in a second terminal.
            </CardDescription>
          </div>
        </CardHeader>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--background)]/60 p-4 font-mono text-sm">
          <p className="mb-2 flex items-center gap-2 text-xs text-subtle">
            <Terminal className="h-3.5 w-3.5" />
            Terminal
          </p>
          <p className="text-foreground">npm run dev:desktop</p>
        </div>

        <p className="text-xs text-muted">
          Keep the web dashboard running with <code className="text-foreground">npm run dev:web</code>{" "}
          (or <code className="text-foreground">npm run dev</code>). The companion can open this
          dashboard via its footer link.
        </p>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="gradient"
            onClick={() => {
              navigator.clipboard?.writeText("npm run dev:desktop");
            }}
          >
            Copy launch command
          </Button>
          <Button href="/dashboard" variant="outline">
            Back to dashboard
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        {features.map((f) => (
          <Card key={f.title} className="p-4">
            <f.icon className="mb-3 h-5 w-5 text-primary" />
            <h3 className="text-sm font-semibold">{f.title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted">{f.desc}</p>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Architecture</CardTitle>
        </CardHeader>
        <ul className="space-y-2 text-sm text-muted">
          <li>
            <span className="font-medium text-foreground">Web</span> — Next.js + Tailwind ·
            dashboard, admin, resume tailor, settings
          </li>
          <li>
            <span className="font-medium text-foreground">Desktop</span> — React + TypeScript +
            Electron · always-on-top assistant overlay
          </li>
        </ul>
      </Card>
    </div>
  );
}
