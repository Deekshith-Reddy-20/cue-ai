/**
 * Live copilot answer contract, shared by the API route and the overlay clients.
 *
 * The overlay is a small always-on-top panel during a real meeting, so answers
 * must be short, immediately speakable, and never hedge with filler.
 */

export type LiveAnswerMode = "answer" | "summarize" | "actions" | "risks" | "explain" | "screen";

export type LiveTranscriptLine = { who: string; text: string };

export type LiveAnswerRequest = {
  prompt: string;
  transcript?: LiveTranscriptLine[];
  mode?: LiveAnswerMode;
  sessionContext?: string;
};

export type LiveAnswerResponse = {
  ok: true;
  answer: string;
  confidence: number;
  model: string;
  provider: "groq" | "gemini" | "qwen";
};

/** How many transcript lines to send; enough context without slowing the call. */
export const LIVE_TRANSCRIPT_WINDOW = 24;

const MODE_INSTRUCTIONS: Record<LiveAnswerMode, string> = {
  answer:
    "Answer the user's question, or give them the single best thing to say next in the meeting.",
  summarize: "Summarize what has been discussed so far in at most 4 short bullets.",
  actions: "List the concrete action items with an owner and a due date when either was stated.",
  risks: "Name the risks or objections that are live right now, most urgent first.",
  explain: "Explain the last topic in plain language a non-expert could follow.",
  screen:
    "Look at the attached screenshot. Identify the question, coding problem, multiple-choice item, or task visible on screen. Answer it directly and accurately. If it is multiple choice, give the correct option and a brief reason. If there is code, solve or explain what is asked. Ignore the CueAI overlay and unrelated chrome. Do not narrate the screenshot — lead with the speakable answer.",
};

/** Guess the mode from a chip label or free-text prompt. */
export function inferMode(prompt: string): LiveAnswerMode {
  const q = prompt.toLowerCase();
  if (
    q.includes("screenshot") ||
    q.includes("on screen") ||
    q.includes("this screen") ||
    q.includes("what's happening") ||
    q.includes("what is happening")
  ) {
    return "screen";
  }
  if (q.includes("summar")) return "summarize";
  if (q.includes("action") || q.includes("todo") || q.includes("next step")) return "actions";
  if (q.includes("risk") || q.includes("objection") || q.includes("concern")) return "risks";
  if (q.includes("explain") || q.includes("simply") || q.includes("plain")) return "explain";
  return "answer";
}

export function buildSystemInstruction(profileContext: string, hasBriefing: boolean): string {
  return [
    "You are CueAI, a live meeting copilot. The user is in an interview or call and will say your answer out loud.",
    "",
    "Rules:",
    "- Lead with the speakable answer. No preamble, no restating the question, no sign-off.",
    "- Keep it under 90 words unless they ask for detail.",
    "- Use short bullets only when listing more than two items.",
    "- Write in first person as the candidate/participant when they need something to say.",
    "- Use the SESSION BRIEFING (resume, job description, company, call notes) as primary source when the live transcript is thin or empty.",
    "- Do not say the transcript is missing if a resume or job description is available — answer from that briefing instead.",
    "- Never invent employers, dates, metrics, or degrees that are not in the briefing or transcript.",
    "- Set confidence below 0.5 only when both the briefing and the transcript are empty.",
    profileContext ? `\nAbout this user:\n${profileContext}` : "",
    hasBriefing
      ? "\nA session briefing is attached. Treat it as the candidate's prepared materials for this call. Never claim the resume is missing if CANDIDATE RESUME appears below."
      : "\nNo resume is attached yet. Ask the user to upload a resume in Create Session instead of introducing yourself.",
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildUserPrompt(input: {
  prompt: string;
  transcript?: LiveTranscriptLine[];
  mode: LiveAnswerMode;
  sessionContext?: string;
}): string {
  const lines = (input.transcript || [])
    .slice(-LIVE_TRANSCRIPT_WINDOW)
    .map((l) => `${l.who}: ${l.text}`)
    .join("\n");

  return [
    "SESSION BRIEFING (resume, role, company — use this even if the transcript is empty):",
    '"""',
    input.sessionContext?.trim() || "(none provided)",
    '"""',
    "",
    "LIVE TRANSCRIPT (most recent last):",
    '"""',
    lines || "(nothing transcribed yet)",
    '"""',
    "",
    `TASK: ${MODE_INSTRUCTIONS[input.mode]}`,
    input.mode === "screen"
      ? "A screenshot is attached. Answer the visible question/task. Do not describe the UI. Format: Say: <direct answer>. For MCQ include the option letter/text."
      : "If this is an interview, give the user a ready-to-say answer that uses their resume and the job context.",
    "",
    "USER REQUEST:",
    '"""',
    input.prompt.slice(0, 2000),
    '"""',
  ].join("\n");
}

export function clampConfidence(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 0.6;
  return Math.max(0.05, Math.min(1, n > 1 ? n / 100 : n));
}
