/**
 * Structured latency / pipeline logs for the live overlay.
 * Never log API keys or raw audio bytes.
 */

export type LatencyMarks = {
  audioEnd?: number;
  transcriptionFinal?: number;
  questionDetected?: number;
  aiRequest?: number;
  firstToken?: number;
  answerVisible?: number;
};

const PREFIX: Record<string, string> = {
  audio: "[AUDIO]",
  transcription: "[TRANSCRIPTION]",
  question: "[QUESTION DETECTION]",
  ai: "[AI REQUEST]",
  response: "[AI RESPONSE]",
  fallback: "[FALLBACK]",
  overlay: "[OVERLAY]",
};

export function pipelineLog(
  area: keyof typeof PREFIX,
  message: string,
  detail?: Record<string, string | number | boolean | null | undefined>,
) {
  const tag = PREFIX[area] || "[OVERLAY]";
  if (detail && Object.keys(detail).length) {
    console.log(tag, message, detail);
  } else {
    console.log(tag, message);
  }
}

export function createLatencyTracker(label: string) {
  const marks: LatencyMarks = {};
  const started = performance.now();

  function mark(key: keyof LatencyMarks) {
    marks[key] = performance.now();
  }

  function report(stage: string) {
    const q = marks.questionDetected ?? marks.audioEnd ?? started;
    const first = marks.firstToken;
    const visible = marks.answerVisible;
    pipelineLog("response", stage, {
      label: label.slice(0, 80),
      question_to_first_token_ms:
        first != null ? Math.round(first - q) : undefined,
      question_to_answer_visible_ms:
        visible != null ? Math.round(visible - q) : undefined,
      transcription_ms:
        marks.transcriptionFinal != null && marks.audioEnd != null
          ? Math.round(marks.transcriptionFinal - marks.audioEnd)
          : undefined,
      ai_ms:
        marks.aiRequest != null && (first ?? visible) != null
          ? Math.round((first ?? visible)! - marks.aiRequest)
          : undefined,
    });
  }

  return { marks, mark, report };
}
