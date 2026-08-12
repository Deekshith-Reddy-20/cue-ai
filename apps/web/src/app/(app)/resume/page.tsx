"use client";

import { useState } from "react";
import {
  Check,
  Download,
  FileUp,
  History,
  Upload,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Gauge, Progress, Tabs } from "@/components/ui/misc";
import { cn } from "@/lib/utils";

const original =
  "Built cross-functional products with AI features. Collaborated with engineering and design.";
const rewritten =
  "Led AI meeting-copilot initiatives end-to-end — partnering with engineering and design to ship real-time transcription, latency SLOs under 800ms, and enterprise privacy controls.";

export default function ResumePage() {
  const [tab, setTab] = useState("editor");
  const [accepted, setAccepted] = useState(false);
  const [jd, setJd] = useState(
    "Senior Product Designer for an AI SaaS platform. Experience with enterprise UX, design systems, and real-time collaboration tools preferred."
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-up">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Resume Tailor
          </h1>
          <p className="mt-1 text-sm text-muted">
            Match your resume to any role with ATS scoring and AI rewrites.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <History className="h-3.5 w-3.5" />
            Version history
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-3.5 w-3.5" />
            DOCX
          </Button>
          <Button variant="gradient" size="sm">
            <Download className="h-3.5 w-3.5" />
            Export PDF
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          {/* Upload */}
          <Card className="border-dashed p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--primary-muted)] text-primary">
              <Upload className="h-5 w-5" />
            </div>
            <p className="mt-3 text-sm font-medium">Drag & drop your resume</p>
            <p className="mt-1 text-xs text-subtle">PDF or DOCX · Max 5 MB</p>
            <Button variant="outline" size="sm" className="mt-4">
              <FileUp className="h-3.5 w-3.5" />
              Browse files
            </Button>
            <p className="mt-3 text-xs text-teal-400">
              alex-chen-resume.pdf uploaded · Preview ready
            </p>
          </Card>

          <Tabs
            tabs={[
              { id: "editor", label: "Side-by-side" },
              { id: "jd", label: "Job description" },
            ]}
            active={tab}
            onChange={setTab}
          />

          {tab === "jd" ? (
            <Card className="p-4">
              <label className="text-sm font-medium">Job description</label>
              <textarea
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                rows={10}
                className="mt-2 w-full resize-y rounded-xl border border-[var(--border-strong)] bg-[var(--background-elevated)] p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-[var(--primary-muted)]"
              />
              <Button className="mt-3" variant="primary" size="sm">
                Analyze match
              </Button>
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              <Card className="p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-subtle">
                  Original
                </p>
                <p className="text-sm leading-relaxed text-muted">{original}</p>
              </Card>
              <Card
                className={cn(
                  "p-4",
                  accepted ? "border-teal-500/30 bg-teal-500/5" : "glow-border"
                )}
              >
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">
                  AI rewrite
                </p>
                <p className="text-sm leading-relaxed">{accepted ? rewritten : rewritten}</p>
                <div className="mt-4 flex gap-2">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => setAccepted(true)}
                    disabled={accepted}
                  >
                    <Check className="h-3.5 w-3.5" />
                    {accepted ? "Accepted" : "Accept"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setAccepted(false)}
                  >
                    <X className="h-3.5 w-3.5" />
                    Reject
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Scores */}
        <div className="space-y-4">
          <Card className="flex flex-col items-center p-5">
            <CardTitle className="mb-4 self-start">Match scores</CardTitle>
            <Gauge value={86} label="AI Match" />
            <div className="mt-6 w-full space-y-3">
              <div>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-muted">ATS Score</span>
                  <span>78</span>
                </div>
                <Progress value={78} />
              </div>
              <div>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-muted">Keyword coverage</span>
                  <span>71</span>
                </div>
                <Progress value={71} />
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <CardHeader>
              <CardTitle>Missing keywords</CardTitle>
            </CardHeader>
            <div className="flex flex-wrap gap-1.5">
              {["Design systems", "Enterprise UX", "Real-time", "SaaS", "WCAG"].map(
                (k) => (
                  <Badge key={k} variant="warning">
                    {k}
                  </Badge>
                )
              )}
            </div>
          </Card>

          <Card className="p-5">
            <CardHeader>
              <CardTitle>Suggested skills</CardTitle>
            </CardHeader>
            <div className="flex flex-wrap gap-1.5">
              {["Figma", "Motion", "Product thinking", "Accessibility"].map((k) => (
                <Badge key={k} variant="info">
                  {k}
                </Badge>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
