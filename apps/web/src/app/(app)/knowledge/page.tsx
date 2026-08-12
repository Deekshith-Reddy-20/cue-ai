"use client";

import { useState } from "react";
import {
  Folder,
  MoreHorizontal,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  FileText,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { knowledgeDocs } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const folders = ["All", "Security", "GTM", "Engineering", "Sales"];

export default function KnowledgePage() {
  const [folder, setFolder] = useState("All");
  const [selected, setSelected] = useState(knowledgeDocs[0].id);
  const [query, setQuery] = useState("");

  const filtered = knowledgeDocs.filter((d) => {
    const inFolder = folder === "All" || d.folder === folder;
    const inQuery =
      !query ||
      d.name.toLowerCase().includes(query.toLowerCase()) ||
      d.tags.some((t) => t.toLowerCase().includes(query.toLowerCase()));
    return inFolder && inQuery;
  });

  const active = knowledgeDocs.find((d) => d.id === selected) ?? knowledgeDocs[0];

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-up">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Knowledge Base
          </h1>
          <p className="mt-1 text-sm text-muted">
            Semantic search across your docs — cited in every AI answer.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-3.5 w-3.5" />
            Re-index
          </Button>
          <Button variant="gradient" size="sm">
            <Upload className="h-3.5 w-3.5" />
            Upload
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="min-w-[240px] flex-1">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Semantic search: “SSO retention policy”…"
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {folders.map((f) => (
          <button
            key={f}
            onClick={() => setFolder(f)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm transition",
              folder === f
                ? "border-teal-500/30 bg-[var(--primary-muted)] text-primary"
                : "border-[var(--border)] text-muted hover:text-foreground"
            )}
          >
            <Folder className="h-3.5 w-3.5" />
            {f}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="divide-y divide-[var(--border)] overflow-hidden p-0">
          {filtered.map((doc) => (
            <button
              key={doc.id}
              onClick={() => setSelected(doc.id)}
              className={cn(
                "flex w-full items-start gap-3 px-4 py-3.5 text-left transition hover:bg-[var(--surface-hover)]",
                selected === doc.id && "bg-[var(--primary-muted)]/40"
              )}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-active)] text-primary">
                <FileText className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{doc.name}</p>
                <p className="mt-0.5 text-xs text-subtle">
                  {doc.folder} · {doc.size} · Updated {doc.updated}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {doc.tags.map((t) => (
                    <Badge key={t} variant="default">
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>
              <MoreHorizontal className="h-4 w-4 text-subtle" />
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="p-8 text-center text-sm text-muted">No documents found.</p>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold tracking-tight">{active.name}</h3>
              <p className="mt-1 text-xs text-subtle">
                Source · {active.folder} · Indexed
              </p>
            </div>
            <Button variant="ghost" size="icon" aria-label="Delete">
              <Trash2 className="h-4 w-4 text-red-400" />
            </Button>
          </div>
          <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--background)]/50 p-4 text-sm leading-relaxed text-muted">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-subtle">
              Preview
            </p>
            CueAI encrypts meeting data in transit and at rest. Enterprise workspaces can
            enforce region locks, retention policies, and private model endpoints. Screen
            Context remains opt-in with per-app exclusions…
          </div>
          <div className="mt-4 rounded-xl border border-violet-500/25 bg-violet-500/10 p-3 text-sm">
            <p className="text-xs font-medium text-violet-300">Semantic hit</p>
            <p className="mt-1 text-foreground/90">
              “Retention policies default to 90 days; admins can configure 30–365.”
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
