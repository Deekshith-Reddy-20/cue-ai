"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Bookmark,
  Hash,
  Mic,
  MonitorPlay,
  Pause,
  Pin,
  Play,
  RefreshCw,
  Square,
  Users,
  Video,
  Volume2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { aiAnswers, transcript } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { getDesktop, isDesktopApp } from "@/lib/desktop";
import Link from "next/link";

type MeetingPlatform = "meet" | "teams" | "zoom" | "slack" | "webex";

type PlatformOption = {
  id: MeetingPlatform;
  name: string;
  description: string;
  icon: ReactNode;
  accent: string;
};

const PLATFORMS: PlatformOption[] = [
  {
    id: "meet",
    name: "Google Meet",
    description: "Join or create a Google Meet session",
    icon: <Video className="h-5 w-5" />,
    accent: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/25",
  },
  {
    id: "teams",
    name: "Microsoft Teams",
    description: "Join or create a Microsoft Teams session",
    icon: <Users className="h-5 w-5" />,
    accent: "bg-sky-500/15 text-sky-400 ring-sky-500/25",
  },
  {
    id: "zoom",
    name: "Zoom",
    description: "Join or create a Zoom session",
    icon: <Video className="h-5 w-5" />,
    accent: "bg-blue-500/15 text-blue-400 ring-blue-500/25",
  },
  {
    id: "slack",
    name: "Slack Huddles",
    description: "Join or create a Slack Huddle",
    icon: <Hash className="h-5 w-5" />,
    accent: "bg-violet-500/15 text-violet-300 ring-violet-500/25",
  },
  {
    id: "webex",
    name: "Webex",
    description: "Join or create a Webex session",
    icon: <MonitorPlay className="h-5 w-5" />,
    accent: "bg-teal-500/15 text-teal-400 ring-teal-500/25",
  },
];

const PLATFORM_LABEL: Record<MeetingPlatform, string> = {
  meet: "Google Meet",
  teams: "Microsoft Teams",
  zoom: "Zoom",
  slack: "Slack Huddles",
  webex: "Webex",
};

export default function LiveMeetingPage() {
  const [session, setSession] = useState<{
    platform: MeetingPlatform;
    title: string;
  } | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Refresh / direct navigation lands on setup and never auto-starts.
  // In-memory `session` keeps an active view if the user re-clicks Live Session
  // without leaving the page.
  useEffect(() => {
    let cancelled = false;
    async function hydrate() {
      if (isDesktopApp()) {
        const desktop = getDesktop();
        const current = await desktop?.getMeetingSession();
        if (current?.active) {
          await desktop?.setMeetingSession({
            active: false,
            screenSharing: false,
            cueAiMode: "inactive",
          });
          await desktop?.hideCompanion();
        }
      }
      if (!cancelled) setHydrated(true);
    }
    void hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  function startPlatformSession(platform: MeetingPlatform) {
    const title = `${PLATFORM_LABEL[platform]} live session`;
    setSession({ platform, title });
  }

  function endSession() {
    setSession(null);
    if (isDesktopApp()) {
      void getDesktop()?.setMeetingSession({
        active: false,
        screenSharing: false,
        cueAiMode: "inactive",
      });
      void getDesktop()?.hideCompanion();
    }
  }

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-5xl animate-fade-up py-8">
        <div className="h-8 w-64 animate-pulse rounded-lg bg-[var(--surface-active)]" />
        <div className="mt-3 h-4 w-96 max-w-full animate-pulse rounded-lg bg-[var(--surface-active)]" />
      </div>
    );
  }

  if (!session) {
    return <LiveSessionSetup onStart={startPlatformSession} />;
  }

  return (
    <ActiveLiveSession
      platform={session.platform}
      title={session.title}
      onEnd={endSession}
    />
  );
}

function LiveSessionSetup({
  onStart,
}: {
  onStart: (platform: MeetingPlatform) => void;
}) {
  return (
    <div className="mx-auto max-w-5xl space-y-8 animate-fade-up">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Start a Live Session
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Choose your meeting platform to begin an AI-assisted live session.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {PLATFORMS.map((platform) => (
          <Card key={platform.id} hover className="flex flex-col p-5">
            <div
              className={cn(
                "mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl ring-1",
                platform.accent
              )}
            >
              {platform.icon}
            </div>
            <CardTitle className="text-base">{platform.name}</CardTitle>
            <CardDescription className="mt-1.5 flex-1">
              {platform.description}
            </CardDescription>
            <Button
              className="mt-5 w-full"
              variant="gradient"
              onClick={() => onStart(platform.id)}
            >
              Start Session
            </Button>
          </Card>
        ))}
      </div>

      <p className="text-center text-xs text-subtle">
        Starting a meeting does not enable CueAI. After you join, choose CueAI Private or Live
        when you want assistance.
      </p>
    </div>
  );
}

type CueAiMode = "inactive" | "private" | "live";
type CueAiProcessing = "idle" | "initializing" | "listening" | "stopped" | "error";

function ActiveLiveSession({
  platform,
  title,
  onEnd,
}: {
  platform: MeetingPlatform;
  title: string;
  onEnd: () => void;
}) {
  const [paused, setPaused] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [lines, setLines] = useState<typeof transcript>([]);
  const [sharing, setSharing] = useState(false);
  const [cueAiMode, setCueAiMode] = useState<CueAiMode>("inactive");
  const [cueAiProcessing, setCueAiProcessing] = useState<CueAiProcessing>("idle");
  const scrollRef = useRef<HTMLDivElement>(null);
  const cueAiModeRef = useRef<CueAiMode>("inactive");

  useEffect(() => {
    cueAiModeRef.current = cueAiMode;
  }, [cueAiMode]);

  // Meeting session only — CueAI stays inactive until the user opts in.
  useEffect(() => {
    if (!isDesktopApp()) return;
    const desktop = getDesktop();
    void desktop?.setMeetingSession({
      active: true,
      screenSharing: false,
      meetingId: `live-${platform}`,
      title,
      cueAiMode: "inactive",
    });
    // Do NOT showCompanion here.
    return () => {
      void desktop?.setMeetingSession({
        active: false,
        screenSharing: false,
        cueAiMode: "inactive",
      });
      void desktop?.hideCompanion();
    };
  }, [platform, title]);

  useEffect(() => {
    if (!isDesktopApp()) return;
    void getDesktop()?.setMeetingSession({ screenSharing: sharing });
  }, [sharing]);

  useEffect(() => {
    if (!isDesktopApp()) return;
    const desktop = getDesktop();
    void desktop?.setMeetingSession({ cueAiMode });
    if (cueAiMode === "inactive") {
      void desktop?.hideCompanion();
      setCueAiProcessing("idle");
      return;
    }

    setCueAiProcessing("initializing");
    void desktop?.showCompanion();
    const t = window.setTimeout(() => {
      if (cueAiModeRef.current === cueAiMode) {
        setCueAiProcessing("listening");
      }
    }, 450);
    return () => window.clearTimeout(t);
  }, [cueAiMode]);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [paused]);

  // Transcript / AI simulation only in CueAI Live after initialization.
  useEffect(() => {
    if (cueAiMode !== "live" || cueAiProcessing !== "listening" || paused) return;

    if (lines.length === 0) {
      setLines(transcript);
    }

    const extra = [
      "We should confirm SSO requirements with Security before Phase 3.",
      "Knowledge base citations need to show source titles in the Companion.",
      "Let's bookmark this decision for the summary.",
    ];
    let i = 0;
    const t = setInterval(() => {
      const text = extra[i % extra.length];
      i += 1;
      setLines((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          speaker: i % 2 === 0 ? "Priya Nair" : "Marcus Lee",
          role: i % 2 === 0 ? "PM" : "Eng",
          text,
          time: formatTime(seconds + i),
          confidence: 0.93 + (i % 5) * 0.01,
        },
      ]);
    }, 5000);
    return () => clearInterval(t);
  }, [cueAiMode, cueAiProcessing, paused, seconds, lines.length]);

  useEffect(() => {
    if (cueAiMode === "inactive") {
      setLines([]);
    }
  }, [cueAiMode]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [lines]);

  function toggleCueAi(mode: "private" | "live") {
    setCueAiMode((current) => (current === mode ? "inactive" : mode));
  }

  const cueAiActive = cueAiMode !== "inactive";
  const showLiveProcessing =
    cueAiMode === "live" && cueAiProcessing === "listening" && !paused;
  const showInitializing = cueAiActive && cueAiProcessing === "initializing";

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 animate-fade-up lg:h-[calc(100vh-7rem)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
              {title}
            </h1>
            <Badge variant="success">
              <span className="mr-1 h-1.5 w-1.5 animate-pulse rounded-full bg-teal-400" />
              In meeting
            </Badge>
            {cueAiMode === "private" && (
              <Badge variant="info">CueAI Private</Badge>
            )}
            {cueAiMode === "live" && (
              <Badge variant="purple">CueAI Live</Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-muted">
            {PLATFORM_LABEL[platform]}
            {cueAiMode === "inactive"
              ? " · CueAI off"
              : cueAiMode === "private"
                ? " · Private assistant"
                : " · Live transcription"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-solid)] px-2 py-1.5">
            <span className="px-1.5 text-xs font-medium text-muted">CueAI</span>
            <div className="flex rounded-lg bg-[var(--background)] p-0.5">
              <button
                type="button"
                aria-pressed={cueAiMode === "private"}
                onClick={() => toggleCueAi("private")}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  cueAiMode === "private"
                    ? "bg-teal-500/20 text-teal-300"
                    : "text-muted hover:text-foreground"
                )}
              >
                Private
              </button>
              <button
                type="button"
                aria-pressed={cueAiMode === "live"}
                onClick={() => toggleCueAi("live")}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  cueAiMode === "live"
                    ? "bg-violet-500/20 text-violet-300"
                    : "text-muted hover:text-foreground"
                )}
              >
                Live
              </button>
            </div>
          </div>
          <span className="rounded-xl border border-[var(--border)] bg-[var(--surface-solid)] px-3 py-2 font-mono text-sm tabular-nums">
            {formatTime(seconds)}
          </span>
          {isDesktopApp() && (
            <Button
              variant={sharing ? "primary" : "outline"}
              size="sm"
              onClick={() => setSharing((s) => !s)}
              aria-pressed={sharing}
            >
              {sharing ? "Sharing · Presenter mode" : "Mark screen sharing"}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setPaused((p) => !p)}>
            {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
            {paused ? "Resume" : "Pause"}
          </Button>
          <Link href="/meetings/m2/summary" onClick={onEnd}>
            <Button variant="danger" size="sm">
              <Square className="h-3.5 w-3.5" />
              End Session
            </Button>
          </Link>
        </div>
      </div>

      <Card className="flex items-center gap-4 p-4">
        <div className="flex items-center gap-2 text-sm text-muted">
          <Mic className={cn("h-4 w-4", !paused && "text-teal-400")} />
          Mic
        </div>
        <div className="flex h-10 flex-1 items-end gap-[3px]">
          {Array.from({ length: 48 }).map((_, i) => (
            <span
              key={i}
              className={cn(
                "flex-1 rounded-full bg-gradient-to-t from-teal-700 to-teal-400",
                !paused && cueAiMode === "live" && "wave-bar",
                cueAiMode === "inactive" && "opacity-40"
              )}
              style={{
                height:
                  paused || cueAiMode === "inactive"
                    ? "30%"
                    : `${20 + ((i * 13) % 80)}%`,
                animationDelay: `${(i % 12) * 0.07}s`,
              }}
            />
          ))}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted">
          <Volume2
            className={cn("h-4 w-4", cueAiMode === "live" ? "text-teal-400" : "text-subtle")}
          />
          {cueAiMode === "live" ? "System audio" : "Meeting audio"}
        </div>
      </Card>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[1.25fr_0.85fr]">
        <Card className="flex min-h-[420px] flex-col overflow-hidden p-0 lg:min-h-0">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
            <p className="text-sm font-semibold">Live transcript</p>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" aria-label="Bookmark">
                <Bookmark className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div ref={scrollRef} className="cue-scroll flex-1 space-y-3 overflow-y-auto p-4">
            {cueAiMode === "inactive" && (
              <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-2 text-center">
                <p className="text-sm font-medium text-foreground/90">CueAI is off</p>
                <p className="max-w-sm text-xs text-muted">
                  Choose <span className="text-teal-300">Private</span> or{" "}
                  <span className="text-violet-300">Live</span> above to start the assistant.
                  Your meeting continues independently.
                </p>
              </div>
            )}
            {cueAiMode === "private" && (
              <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-2 text-center">
                {showInitializing ? (
                  <>
                    <p className="text-sm font-medium">Starting CueAI Private…</p>
                    <p className="text-xs text-muted">Initializing private assistant</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-teal-300">Private mode active</p>
                    <p className="max-w-sm text-xs text-muted">
                      The CueAI companion is available privately. Switch to Live for full
                      transcription and AI suggestions in this workspace.
                    </p>
                  </>
                )}
              </div>
            )}
            {cueAiMode === "live" &&
              lines.map((line) => (
                <div
                  key={line.id}
                  className={cn(
                    "rounded-2xl border border-[var(--border)] px-4 py-3",
                    line.role === "You" && "border-teal-500/25 bg-teal-500/5"
                  )}
                >
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">{line.speaker}</span>
                    <Badge variant={line.role === "You" ? "info" : "default"}>
                      {line.role}
                    </Badge>
                    <span className="ml-auto font-mono text-[11px] text-subtle">
                      {line.time}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-foreground/90">{line.text}</p>
                  <p className="mt-1.5 text-[11px] text-subtle">
                    Confidence {(line.confidence * 100).toFixed(0)}%
                  </p>
                </div>
              ))}
            {showInitializing && cueAiMode === "live" && (
              <p className="px-2 text-xs text-muted">Starting CueAI Live…</p>
            )}
            {showLiveProcessing && (
              <div className="flex items-center gap-1.5 px-2 text-subtle">
                <span className="typing-dot h-1.5 w-1.5 rounded-full bg-primary" />
                <span
                  className="typing-dot h-1.5 w-1.5 rounded-full bg-primary"
                  style={{ animationDelay: "0.2s" }}
                />
                <span
                  className="typing-dot h-1.5 w-1.5 rounded-full bg-primary"
                  style={{ animationDelay: "0.4s" }}
                />
                <span className="ml-2 text-xs">Listening…</span>
              </div>
            )}
          </div>
          <div className="border-t border-[var(--border)] px-4 py-3">
            <div className="relative h-2 rounded-full bg-[var(--surface-active)]">
              <div
                className={cn(
                  "absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-teal-600 to-violet-500",
                  cueAiMode === "live" ? "w-[62%]" : "w-[12%] opacity-40"
                )}
              />
              {cueAiMode === "live" && (
                <>
                  <button
                    className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-white bg-primary"
                    style={{ left: "62%" }}
                    aria-label="Playhead"
                  />
                  <span
                    className="absolute -top-1 h-4 w-0.5 bg-amber-400"
                    style={{ left: "28%" }}
                    title="Bookmark"
                  />
                </>
              )}
            </div>
          </div>
        </Card>

        <div className="flex min-h-0 flex-col gap-4">
          <Card glow className="flex-1 space-y-3 overflow-y-auto p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">AI suggestions</p>
              {cueAiMode === "live" && cueAiProcessing === "listening" ? (
                <Badge variant="purple">Streaming</Badge>
              ) : cueAiMode === "private" ? (
                <Badge variant="info">Private</Badge>
              ) : (
                <Badge>Off</Badge>
              )}
            </div>
            {cueAiMode !== "live" && (
              <div className="flex min-h-[160px] flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] px-4 py-8 text-center">
                <p className="text-sm text-muted">
                  {cueAiMode === "private"
                    ? "Private mode uses the companion overlay. Switch to Live for in-workspace suggestions."
                    : "Enable CueAI Live to stream AI suggestions for this meeting."}
                </p>
              </div>
            )}
            {cueAiMode === "live" &&
              cueAiProcessing === "listening" &&
              aiAnswers.map((a) => (
                <div
                  key={a.id}
                  className="rounded-2xl border border-violet-500/25 bg-violet-500/10 p-4"
                >
                  <p className="text-xs font-medium text-violet-300">{a.question}</p>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/90">
                    {a.answer}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <Button size="sm" variant={a.pinned ? "primary" : "outline"}>
                      <Pin className="h-3 w-3" />
                      {a.pinned ? "Pinned" : "Pin"}
                    </Button>
                    <Button size="sm" variant="ghost">
                      <RefreshCw className="h-3 w-3" />
                      Regenerate
                    </Button>
                  </div>
                </div>
              ))}
            {cueAiMode === "live" && showInitializing && (
              <p className="text-xs text-muted">Preparing suggestions…</p>
            )}
          </Card>

          <Card className="p-3">
            <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
              <input
                className="h-11 flex-1 rounded-xl border border-[var(--border-strong)] bg-[var(--background-elevated)] px-3.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-[var(--primary-muted)] disabled:opacity-50"
                placeholder={
                  cueAiActive ? "Ask CueAI anything…" : "Enable CueAI Private or Live to ask…"
                }
                disabled={!cueAiActive}
              />
              <Button type="submit" variant="gradient" disabled={!cueAiActive}>
                Ask
              </Button>
            </form>
            <p className="mt-2 text-center text-[11px] text-subtle">
              Hotkey ⌘⇧Space · Privacy: audio only
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

function formatTime(total: number) {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}
