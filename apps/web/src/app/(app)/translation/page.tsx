"use client";

import { useState } from "react";
import { Languages } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Tabs } from "@/components/ui/misc";
import { cn } from "@/lib/utils";

const languages = [
  { id: "en", label: "English" },
  { id: "hi", label: "Hindi" },
  { id: "te", label: "Telugu" },
];

const pairs: Record<string, { original: string; translated: string }> = {
  en: {
    original: "What's our latency budget for real-time answers?",
    translated: "What's our latency budget for real-time answers?",
  },
  hi: {
    original: "What's our latency budget for real-time answers?",
    translated: "रीयल-टाइम उत्तरों के लिए हमारा लेटेंसी बजट क्या है?",
  },
  te: {
    original: "What's our latency budget for real-time answers?",
    translated: "రియల్-టైమ్ సమాధానాల కోసం మా లేటెన్సీ బడ్జెట్ ఎంత?",
  },
};

export default function TranslationPage() {
  const [lang, setLang] = useState("hi");
  const [bilingual, setBilingual] = useState(true);
  const [mode, setMode] = useState("live");

  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-fade-up">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Translation
        </h1>
        <p className="mt-1 text-sm text-muted">
          Live bilingual transcripts and AI responses in English, Hindi, and Telugu.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Tabs
          tabs={[
            { id: "live", label: "Live transcript" },
            { id: "ai", label: "AI responses" },
            { id: "summary", label: "Summary" },
          ]}
          active={mode}
          onChange={setMode}
        />
        <label className="ml-auto flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={bilingual}
            onChange={(e) => setBilingual(e.target.checked)}
            className="rounded"
          />
          Bilingual mode
        </label>
      </div>

      <Card className="p-4">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Languages className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Target language</span>
          <div className="flex gap-1.5">
            {languages.map((l) => (
              <button
                key={l.id}
                onClick={() => setLang(l.id)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-sm transition",
                  lang === l.id
                    ? "border-teal-500/30 bg-[var(--primary-muted)] text-primary"
                    : "border-[var(--border)] text-muted hover:text-foreground"
                )}
              >
                {l.label}
              </button>
            ))}
          </div>
          <Badge variant="purple" className="ml-auto">
            Streaming
          </Badge>
        </div>

        <div className="space-y-3">
          {[0, 1, 2].map((i) => {
            const pair = pairs[lang];
            return (
              <div
                key={i}
                className="rounded-2xl border border-[var(--border)] bg-[var(--background)]/40 p-4"
              >
                {bilingual && (
                  <p className="text-sm text-muted">{pair.original}</p>
                )}
                <p
                  className={cn(
                    "text-sm font-medium text-foreground",
                    bilingual && "mt-2"
                  )}
                >
                  {pair.translated}
                </p>
                <p className="mt-2 text-[11px] text-subtle">
                  Speaker {i + 1} · {mode === "ai" ? "AI answer" : "Transcript"}
                </p>
              </div>
            );
          })}
        </div>
      </Card>

      {mode === "summary" && (
        <Card className="p-5">
          <CardTitle className="mb-3">Translated summary</CardTitle>
          <p className="text-sm leading-relaxed text-muted">
            {lang === "hi"
              ? "टीम ने CueAI Companion के लिए तीन-चरणीय एंटरप्राइज़ रोलआउट पर सहमति बनाई। लाइव सुझावों के लिए लेटेंसी लक्ष्य 800ms से कम रखा गया।"
              : lang === "te"
                ? "టీమ్ CueAI Companion కోసం మూడు-దశల ఎంటర్‌ప్రైజ్ రోలౌట్‌పై ఏకీభవించింది. లైవ్ సూచనలకు లేటెన్సీ లక్ష్యం 800ms కంటే తక్కువగా ఉంచబడింది."
                : "The team aligned on a three-phase enterprise rollout for CueAI Companion. Latency targets remain under 800ms for live suggestions."}
          </p>
          <Button className="mt-4" size="sm" variant="outline">
            Copy translation
          </Button>
        </Card>
      )}
    </div>
  );
}
