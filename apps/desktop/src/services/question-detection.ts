/**
 * Lightweight question / interview-prompt detection for live auto-answers.
 * Stitches consecutive STT fragments so questions are not cut mid-sentence.
 */

export type QuestionDecision = {
  accept: boolean;
  question: string;
  reason: string;
};

const MAX_RECENT = 8;
const DEDUPE_WINDOW_MS = 45_000;
const STITCH_WINDOW_MS = 2_800;
const MIN_CHARS = 12;
const MAX_CHARS = 600;

const recent: { norm: string; at: number }[] = [];
const rolling: { who: string; text: string; at: number }[] = [];

/** In-progress utterance assembly per speaker. */
const pending: Record<
  string,
  { parts: string[]; updatedAt: number; timer: ReturnType<typeof setTimeout> | null }
> = {};

const WH =
  /^(what|whats|what's|why|how|when|where|who|whom|which|whose|can|could|would|should|do|does|did|is|are|was|were|will|have|has|had)\b/i;

const INTERVIEW =
  /\b(tell me|walk me through|explain|describe|share (your|an?)|talk about|give me an example|how (did|do|would) you|what (is|are|was|were|do|does|did|would)|why (did|do|would|is|are)|can you|could you|please explain)\b/i;

const FILLER_ONLY =
  /^(um+|uh+|hmm+|mm+|yeah|yep|yup|ok|okay|right|sure|thanks|thank you|hello|hi|hey|bye)\.?$/i;

const INCOMPLETE_TAIL =
  /\b(and|or|the|a|an|to|of|for|with|in|on|at|my|your|our|is|are|was|were|you|your|project|implemented)$/i;

function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s?]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function looksLikeQuestion(text: string): boolean {
  const t = text.trim();
  if (t.endsWith("?")) return true;
  if (WH.test(t)) return true;
  if (INTERVIEW.test(t)) return true;
  return false;
}

function isIncomplete(text: string): boolean {
  const t = text.trim();
  if (t.endsWith("?")) return false;
  if (t.length < 22 && !WH.test(t) && !INTERVIEW.test(t)) return true;
  if (INCOMPLETE_TAIL.test(t) && !t.endsWith("?")) return true;
  // Starts like a question but never reaches a clear close and is still short.
  if ((WH.test(t) || INTERVIEW.test(t)) && t.length < 40 && !/[.!?]$/.test(t)) {
    return true;
  }
  return false;
}

function isDuplicate(norm: string, now: number): boolean {
  while (recent.length && now - recent[0]!.at > DEDUPE_WINDOW_MS) recent.shift();
  for (const row of recent) {
    if (row.norm === norm) return true;
    if (norm.length > 20 && (row.norm.includes(norm) || norm.includes(row.norm))) {
      return true;
    }
  }
  return false;
}

/** Append a finalized transcript line into the rolling conversation buffer. */
export function pushRollingTranscript(who: string, text: string) {
  const cleaned = text.trim().slice(0, MAX_CHARS);
  if (!cleaned) return;
  rolling.push({ who, text: cleaned, at: Date.now() });
  while (rolling.length > 24) rolling.shift();
}

export function getRollingContext(limit = 8): { who: string; text: string }[] {
  return rolling.slice(-limit).map(({ who, text }) => ({ who, text }));
}

export function clearQuestionMemory() {
  recent.length = 0;
  rolling.length = 0;
  for (const key of Object.keys(pending)) {
    const bag = pending[key];
    if (bag?.timer) clearTimeout(bag.timer);
    delete pending[key];
  }
}

/**
 * Decide whether a finalized transcript segment should trigger an AI answer.
 */
export function evaluateQuestion(
  text: string,
  opts?: { who?: string; allowSelfQuestions?: boolean },
): QuestionDecision {
  const raw = text.trim().replace(/\s+/g, " ").slice(0, MAX_CHARS);
  if (raw.length < MIN_CHARS) {
    return { accept: false, question: raw, reason: "too_short" };
  }
  if (FILLER_ONLY.test(raw)) {
    return { accept: false, question: raw, reason: "filler" };
  }
  if (isIncomplete(raw)) {
    return { accept: false, question: raw, reason: "incomplete" };
  }
  if (!looksLikeQuestion(raw)) {
    return { accept: false, question: raw, reason: "not_question" };
  }

  const who = opts?.who || "Speaker";
  if (who === "You" && opts?.allowSelfQuestions === false) {
    if (!raw.endsWith("?")) {
      return { accept: false, question: raw, reason: "self_speech" };
    }
  }

  const norm = normalize(raw);
  const now = Date.now();
  if (isDuplicate(norm, now)) {
    return { accept: false, question: raw, reason: "duplicate" };
  }

  recent.push({ norm, at: now });
  while (recent.length > MAX_RECENT) recent.shift();

  return { accept: true, question: raw, reason: "ok" };
}

export type AssembledUtterance = {
  who: string;
  text: string;
  /** True when the stitch window closed or the utterance looks complete. */
  finalized: boolean;
};

/**
 * Merge consecutive STT fragments from the same speaker so end-of-question
 * detection sees the full sentence ("…authentication in your project?") instead
 * of an early cut ("…how you implemented…").
 */
export function assembleUtterance(
  who: string,
  text: string,
  onReady: (utterance: AssembledUtterance) => void,
): void {
  const cleaned = text.trim().replace(/\s+/g, " ");
  if (!cleaned) return;

  const key = who || "Speaker";
  const now = Date.now();
  let bag = pending[key];
  if (!bag || now - bag.updatedAt > STITCH_WINDOW_MS) {
    if (bag?.timer) clearTimeout(bag.timer);
    bag = { parts: [], updatedAt: now, timer: null };
    pending[key] = bag;
  }

  // Avoid appending near-duplicate repeats from overlapping STT.
  const last = bag.parts[bag.parts.length - 1] || "";
  if (!last || normalize(cleaned) !== normalize(last)) {
    if (last && normalize(cleaned).startsWith(normalize(last)) && cleaned.length > last.length) {
      bag.parts[bag.parts.length - 1] = cleaned;
    } else if (!last || !normalize(last).includes(normalize(cleaned))) {
      bag.parts.push(cleaned);
    }
  }
  bag.updatedAt = now;

  const joined = bag.parts.join(" ").replace(/\s+/g, " ").trim();
  const complete = joined.endsWith("?") || (!isIncomplete(joined) && looksLikeQuestion(joined));

  if (bag.timer) clearTimeout(bag.timer);

  if (complete && joined.length >= MIN_CHARS) {
    delete pending[key];
    onReady({ who: key, text: joined, finalized: true });
    return;
  }

  // Wait a short quiet gap for the rest of the sentence, then finalize.
  bag.timer = setTimeout(() => {
    const current = pending[key];
    if (!current) return;
    const finalText = current.parts.join(" ").replace(/\s+/g, " ").trim();
    delete pending[key];
    if (finalText) onReady({ who: key, text: finalText, finalized: true });
  }, STITCH_WINDOW_MS);
}
