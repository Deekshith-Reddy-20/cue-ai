import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  Bookmark,
  Copy,
  ExternalLink,
  EyeOff,
  GripVertical,
  Languages,
  ListTodo,
  Mic,
  Minimize2,
  Pin,
  Presentation,
  RefreshCw,
  Search,
  Shield,
  Sparkles,
  Volume2,
  X,
} from "lucide-react";
import { cn } from "./lib/utils";
import { useCompanionStore } from "./store/companion-store";
import { AIService, TranslationService } from "./services";

const transcript = [
  { who: "Sarah", text: "Can we ship before the board meeting?" },
  { who: "Alex", text: "If QA finishes by Thursday, yes." },
  { who: "You", text: "CueAI — what's left in QA?" },
];

const suggestions = [
  "Summarize risks for the board",
  "Draft action items",
  "Translate last answer",
];

export default function App() {
  const {
    mode,
    pinned,
    opacity,
    panel,
    session,
    capture,
    setMode,
    setPinned,
    setOpacity,
    setPanel,
    setSession,
    setCapture,
  } = useCompanionStore();

  const [ask, setAsk] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [answer, setAnswer] = useState(
    "QA has 14 SP left. Velocity supports Wednesday EOD finish — Thursday remains buffer before the 5pm deck freeze."
  );
  const [confidence, setConfidence] = useState(0.92);
  const [bookmarkCount, setBookmarkCount] = useState(2);
  const [translated, setTranslated] = useState<string | null>(null);

  useEffect(() => {
    void window.cueai?.setMode(mode);
  }, [mode]);

  useEffect(() => {
    void window.cueai?.pin(pinned);
  }, [pinned]);

  useEffect(() => {
    void window.cueai?.setOpacity(opacity);
  }, [opacity]);

  useEffect(() => {
    void window.cueai?.getCaptureStatus().then((s) => s && setCapture(s));
    void window.cueai?.getSession().then((s) => s && setSession(s));
    const offMode = window.cueai?.onMode((m) => setMode(m));
    const offSession = window.cueai?.onSession((s) => setSession(s));
    const offCapture = window.cueai?.onCaptureStatus((s) => setCapture(s));
    return () => {
      offMode?.();
      offSession?.();
      offCapture?.();
    };
  }, [setCapture, setMode, setSession]);

  function bumpActivity() {
    void window.cueai?.activity();
  }

  async function onAsk(e: FormEvent) {
    e.preventDefault();
    bumpActivity();
    if (!ask.trim()) return;
    const prompt = ask.trim();
    setAsk("");
    setStreaming(true);
    setPanel("answer");
    const result = await AIService.ask(prompt);
    setAnswer(result.answer);
    setConfidence(result.confidence);
    setTranslated(null);
    setStreaming(false);
  }

  const presenting = mode === "presenter" || session.screenSharing;

  return (
    <div
      className="flex h-full flex-col p-2"
      onMouseMove={bumpActivity}
      onFocus={bumpActivity}
    >
      <div
        className={cn(
          "glass flex h-full flex-col overflow-hidden rounded-2xl transition-[box-shadow,opacity] duration-150",
          "shadow-[0_0_0_1px_rgba(45,212,191,0.25),0_0_24px_rgba(20,184,166,0.18)]",
          presenting && "shadow-[0_0_0_1px_rgba(45,212,191,0.15)]",
          mode === "collapsed" && "justify-center"
        )}
      >
        <header className="drag-region flex items-center gap-2 border-b border-white/10 px-3 py-2">
          <GripVertical className="h-4 w-4 text-zinc-500" />
          <Sparkles className="h-3.5 w-3.5 text-teal-400" />
          <span className="text-xs font-semibold tracking-tight">CueAI</span>
          {session.cueAiMode === "private" && (
            <span
              className={cn(
                "rounded-md border px-1.5 py-0.5 text-[10px] font-medium",
                capture?.applied
                  ? "border-teal-500/30 bg-teal-500/15 text-teal-300"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-200"
              )}
              title={capture?.message || "Capture status"}
            >
              <span className="inline-flex items-center gap-1">
                <EyeOff className="h-2.5 w-2.5" /> Private
              </span>
            </span>
          )}
          {session.cueAiMode === "live" && (
            <span className="rounded-md border border-teal-500/20 bg-teal-500/10 px-1.5 py-0.5 text-[10px] text-teal-300">
              Live
            </span>
          )}
          {(!session.cueAiMode || session.cueAiMode === "inactive") && capture?.applied === false && (
            <span className="rounded-md border border-white/10 px-1.5 py-0.5 text-[10px] text-zinc-500">
              Local only
            </span>
          )}
          <div className="no-drag ml-auto flex items-center gap-0.5">
            <IconBtn
              label={pinned ? "Unpin" : "Pin always on top"}
              onClick={() => {
                bumpActivity();
                setPinned(!pinned);
              }}
            >
              <Pin className={cn("h-3.5 w-3.5", pinned && "text-teal-400")} />
            </IconBtn>
            <IconBtn
              label="Presenter mode"
              onClick={() => {
                bumpActivity();
                setMode(mode === "presenter" ? "full" : "presenter");
              }}
            >
              <Presentation className={cn("h-3.5 w-3.5", presenting && "text-teal-400")} />
            </IconBtn>
            {!presenting && (
              <IconBtn
                label="Mini"
                onClick={() => {
                  bumpActivity();
                  setMode(mode === "mini" ? "full" : "mini");
                }}
              >
                <Minimize2 className="h-3.5 w-3.5" />
              </IconBtn>
            )}
            <IconBtn label="Hide" onClick={() => void window.cueai?.hide()}>
              <X className="h-3.5 w-3.5" />
            </IconBtn>
          </div>
        </header>

        {mode === "collapsed" ? (
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-teal-400" />
              </span>
              Listening · private
            </div>
            <button
              className="no-drag rounded-lg px-2 py-1 text-[10px] text-zinc-400 hover:bg-white/5"
              onClick={() => setMode("full")}
            >
              Expand
            </button>
          </div>
        ) : (
          <div className="no-drag flex min-h-0 flex-1 flex-col gap-2.5 p-3">
            {mode === "full" && (
              <div className="flex items-center gap-3 text-[11px] text-zinc-400">
                <span className="inline-flex items-center gap-1">
                  <Mic className="h-3 w-3 text-teal-400" /> Mic
                </span>
                <span className="inline-flex items-center gap-1">
                  <Volume2 className="h-3 w-3 text-teal-400" /> System
                </span>
                <span className="inline-flex items-center gap-1">
                  <Shield className="h-3 w-3 text-teal-300" /> Ephemeral
                </span>
                <label className="ml-auto inline-flex items-center gap-1.5">
                  <span className="text-zinc-500">Opacity</span>
                  <input
                    type="range"
                    min={0.5}
                    max={1}
                    step={0.05}
                    value={opacity}
                    onChange={(e) => setOpacity(Number(e.target.value))}
                    className="w-16 accent-teal-500"
                    aria-label="Window opacity"
                  />
                </label>
              </div>
            )}

            {mode === "full" && (
              <div className="flex gap-1">
                {(
                  [
                    ["answer", "Answer"],
                    ["transcript", "Transcript"],
                    ["actions", "Actions"],
                    ["translate", "Translate"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      bumpActivity();
                      setPanel(id);
                    }}
                    className={cn(
                      "rounded-lg px-2 py-1 text-[11px]",
                      panel === id
                        ? "bg-teal-500/20 text-teal-200"
                        : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            {mode === "full" && panel === "transcript" && (
              <div className="max-h-36 space-y-1.5 overflow-y-auto rounded-xl bg-black/25 p-2.5 text-xs">
                {transcript.map((line) => (
                  <p key={line.text}>
                    <span className="font-medium text-teal-400">{line.who}:</span>{" "}
                    <span className="text-zinc-300">{line.text}</span>
                  </p>
                ))}
              </div>
            )}

            {mode === "full" && panel === "actions" && (
              <div className="space-y-1.5 rounded-xl bg-black/25 p-2.5 text-xs text-zinc-300">
                <p className="inline-flex items-center gap-1.5 text-teal-300">
                  <ListTodo className="h-3 w-3" /> Suggested next steps
                </p>
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className="block w-full rounded-lg px-2 py-1.5 text-left hover:bg-white/5"
                    onClick={() => {
                      setAsk(s);
                      setPanel("answer");
                    }}
                  >
                    {s}
                  </button>
                ))}
                <p className="pt-1 text-[10px] text-zinc-500">
                  Screen context · Resume tips · Timeline · Search (mock)
                </p>
              </div>
            )}

            {mode === "full" && panel === "translate" && (
              <div className="space-y-2 rounded-xl bg-black/25 p-2.5 text-xs">
                <p className="inline-flex items-center gap-1 text-teal-300">
                  <Languages className="h-3 w-3" /> Live translation
                </p>
                <div className="flex gap-1">
                  {["es", "fr", "de", "ja"].map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      className="rounded-lg border border-white/10 px-2 py-1 uppercase text-zinc-400 hover:border-teal-500/40 hover:text-teal-200"
                      onClick={() => {
                        void TranslationService.translate(answer, lang).then((r) =>
                          setTranslated(r.text)
                        );
                      }}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
                <p className="text-zinc-300">{translated || answer}</p>
              </div>
            )}

            {(panel === "answer" || mode !== "full") && (
              <div
                className={cn(
                  "rounded-2xl border border-teal-500/25 bg-teal-500/10 p-3",
                  presenting && "flex-1 border-teal-500/15 bg-teal-500/8"
                )}
              >
                <div className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-teal-300">
                  <Sparkles className="h-3 w-3" />
                  {presenting ? "Presenter answer" : "AI Answer"}
                  {!streaming && (
                    <span className="ml-auto text-[10px] text-zinc-500">
                      {Math.round(confidence * 100)}%
                    </span>
                  )}
                </div>
                {streaming ? (
                  <div className="flex gap-1 py-2" aria-label="Generating answer">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="typing-dot h-2 w-2 rounded-full bg-teal-400"
                        style={{ animationDelay: `${i * 0.2}s` }}
                      />
                    ))}
                  </div>
                ) : (
                  <p
                    className={cn(
                      "leading-relaxed text-zinc-100",
                      presenting ? "text-sm" : mode === "mini" ? "text-xs" : "text-sm"
                    )}
                  >
                    {mode === "mini" ? "QA can finish by Wed EOD." : answer}
                  </p>
                )}
                {!streaming && mode !== "mini" && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    <Chip
                      onClick={() => {
                        bumpActivity();
                        setBookmarkCount((n) => n + 1);
                      }}
                    >
                      <Pin className="h-3 w-3" /> Pin
                    </Chip>
                    <Chip onClick={() => void navigator.clipboard.writeText(answer)}>
                      <Copy className="h-3 w-3" />
                    </Chip>
                    <Chip
                      onClick={() => {
                        setStreaming(true);
                        void AIService.ask("regenerate").then((r) => {
                          setAnswer(r.answer);
                          setConfidence(r.confidence);
                          setStreaming(false);
                        });
                      }}
                    >
                      <RefreshCw className="h-3 w-3" />
                    </Chip>
                    {!presenting && (
                      <>
                        <Chip onClick={() => setBookmarkCount((n) => n + 1)}>
                          <Bookmark className="h-3 w-3" /> {bookmarkCount}
                        </Chip>
                        <Chip onClick={() => setAsk("Explain this simply")}>
                          <Search className="h-3 w-3" /> Explain
                        </Chip>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {!presenting && mode !== "mini" && (
              <form className="flex gap-2" onSubmit={(e) => void onAsk(e)}>
                <input
                  value={ask}
                  onChange={(e) => setAsk(e.target.value)}
                  placeholder="Ask CueAI…"
                  className="h-9 flex-1 rounded-xl border border-white/10 bg-black/30 px-3 text-xs text-white outline-none placeholder:text-zinc-500 focus:border-teal-500/50"
                />
                <button
                  type="submit"
                  className="btn-gradient h-9 rounded-xl px-3 text-xs font-medium text-white"
                >
                  Ask
                </button>
              </form>
            )}

            {mode === "full" && panel === "answer" && (
              <div className="flex flex-wrap items-center gap-1.5">
                {(["Summarize", "Actions", "Risks"] as const).map((q) => (
                  <button
                    key={q}
                    type="button"
                    className="rounded-lg border border-white/10 px-2 py-1 text-[11px] text-zinc-400 hover:border-white/20 hover:text-white"
                    onClick={() => setAsk(q)}
                  >
                    {q}
                  </button>
                ))}
                <button
                  type="button"
                  className="ml-auto inline-flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-300"
                  onClick={() => void window.cueai?.openDashboard()}
                >
                  Dashboard <ExternalLink className="h-3 w-3" />
                </button>
              </div>
            )}

            {mode === "mini" && (
              <button
                type="button"
                className="text-[10px] text-zinc-500 hover:text-zinc-300"
                onClick={() => setMode("collapsed")}
              >
                Collapse · Esc hides
              </button>
            )}

            {presenting && (
              <p className="text-center text-[10px] text-zinc-500">
                Docked · reduced UI · capture exclusion when OS allows
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  label,
}: {
  children: ReactNode;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/5 hover:text-white"
    >
      {children}
    </button>
  );
}

function Chip({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-black/20 px-2 py-1 text-[11px] text-zinc-300 hover:border-white/20"
    >
      {children}
    </button>
  );
}
