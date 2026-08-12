"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, Gauge, Progress, Tabs } from "@/components/ui/misc";
import { Logo } from "@/components/ui/logo";

export default function DesignSystemPage() {
  const [tab, setTab] = useState("buttons");

  return (
    <div className="mx-auto max-w-5xl space-y-8 animate-fade-up">
      <div>
        <Logo size="lg" href="/dashboard" />
        <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight">
          Design System
        </h1>
        <p className="mt-2 text-muted">
          Tokens, typography, and reusable components for CueAI.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">Color palette</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["#0B0F10", "Obsidian Black"],
            ["#14B8A6", "Primary Teal"],
            ["#0D9488", "Deep Teal"],
            ["#2DD4BF", "Bright Teal"],
            ["#8B5CF6", "Soft Purple AI"],
            ["#F59E0B", "Warning Amber"],
            ["#DC143C", "Crimson Error"],
            ["rgba(14,20,22,0.48)", "Glass Card"],
          ].map(([hex, name]) => (
            <div key={name} className="overflow-hidden rounded-2xl border border-[var(--border)]">
              <div className="h-16" style={{ background: hex }} />
              <div className="p-3">
                <p className="text-sm font-medium">{name}</p>
                <p className="font-mono text-xs text-subtle">{hex}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">Typography</h2>
        <Card className="space-y-4 p-6">
          <p className="font-display text-4xl font-semibold tracking-tight">
            Display / Outfit
          </p>
          <p className="text-lg">Body Large / Plus Jakarta Sans — 18px</p>
          <p className="text-base">Body / Plus Jakarta Sans — 16px</p>
          <p className="text-sm text-muted">Muted / 14px — supporting copy</p>
          <p className="font-mono text-sm text-subtle">Mono / JetBrains Mono — code & timers</p>
        </Card>
      </section>

      <Tabs
        tabs={[
          { id: "buttons", label: "Buttons" },
          { id: "inputs", label: "Inputs" },
          { id: "feedback", label: "Feedback" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "buttons" && (
        <Card className="flex flex-wrap gap-3 p-6">
          <Button variant="primary">Primary</Button>
          <Button variant="gradient">Gradient</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button loading>Loading</Button>
        </Card>
      )}

      {tab === "inputs" && (
        <Card className="max-w-md space-y-4 p-6">
          <Input label="Email" placeholder="alex@acme.com" />
          <Input label="With error" error="This field is required" />
        </Card>
      )}

      {tab === "feedback" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="space-y-3 p-6">
            <div className="flex flex-wrap gap-2">
              <Badge>Default</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="danger">Danger</Badge>
              <Badge variant="info">Info</Badge>
              <Badge variant="purple">AI Accent</Badge>
            </div>
            <Progress value={64} />
            <Avatar name="Alex Chen" size="lg" />
          </Card>
          <Card className="flex items-center justify-center p-6">
            <Gauge value={86} label="ATS" />
          </Card>
          <Card glow className="p-6 sm:col-span-2">
            <CardHeader>
              <div>
                <CardTitle>Glass + glow card</CardTitle>
                <CardDescription>Used for AI answer surfaces</CardDescription>
              </div>
            </CardHeader>
            <div className="skeleton h-4 w-2/3" />
            <div className="skeleton mt-2 h-4 w-1/2" />
          </Card>
        </div>
      )}

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">User flows</h2>
        <Card className="p-6 text-sm leading-relaxed text-muted">
          <ol className="list-decimal space-y-2 pl-4">
            <li>Landing → Start Free / Book Demo → Signup or Login</li>
            <li>Dashboard → Start live session → Live Meeting → End → Summary</li>
            <li>Companion modes: Full / Mini / Presenter / Collapse</li>
            <li>Resume Tailor → Upload → JD → Match scores → Accept rewrite → Export</li>
            <li>Knowledge → Upload / Search → Preview → Cite in answers</li>
            <li>Screen Context → Permission → Capture → Exclude apps</li>
            <li>Admin → Users / Security / Retention / Audit / Billing</li>
          </ol>
        </Card>
      </section>
    </div>
  );
}
