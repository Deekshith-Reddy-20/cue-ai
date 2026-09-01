import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const GROQ_URL = "https://api.groq.com/openai/v1/audio/transcriptions";
const GROQ_STT_MODEL = process.env.GROQ_STT_MODEL || "whisper-large-v3-turbo";
const MAX_BYTES = 25 * 1024 * 1024;

export async function POST(request: Request) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GROQ_API_KEY is not configured on the server." },
      { status: 503 }
    );
  }

  try {
    const form = await request.formData();
    const file = form.get("audio");
    const label = String(form.get("label") || "You").slice(0, 40);

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Audio file is required." }, { status: 400 });
    }
    if (file.size <= 0) {
      return NextResponse.json({ error: "Audio file is empty." }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Audio exceeds 25 MB limit." }, { status: 400 });
    }

    const upstream = new FormData();
    upstream.append("file", file, file.name || "listen.webm");
    upstream.append("model", GROQ_STT_MODEL);
    upstream.append("response_format", "json");
    upstream.append("temperature", "0");

    const groqRes = await fetch(GROQ_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: upstream,
    });

    if (!groqRes.ok) {
      const detail = await groqRes.text();
      console.error("groq_transcribe_failed", groqRes.status, detail.slice(0, 400));
      return NextResponse.json(
        { error: "Transcription failed. Check GROQ_API_KEY / STT model." },
        { status: 502 }
      );
    }

    const payload = (await groqRes.json()) as { text?: string };
    const text = String(payload.text || "").trim();
    if (!text) {
      return NextResponse.json({
        ok: true,
        text: "",
        who: label,
        empty: true,
      });
    }

    try {
      const { randomUUID } = await import("node:crypto");
      const { getSessionFromRequest } = await import("@/lib/server/api-auth");
      const { recordUsageEvent } = await import("@/lib/server/usage");
      const session = await getSessionFromRequest();
      const minutes = Math.max(1, Math.round(file.size / (32_000 * 60)) || 1);
      const requestId = randomUUID();
      await recordUsageEvent(session, {
        type: "meeting_minutes",
        quantity: minutes,
        provider: "groq",
        model: GROQ_STT_MODEL,
        idempotencyKey: `meeting_minutes:${requestId}`,
        metadata: { feature: "transcribe", label, requestId },
      });
      await recordUsageEvent(session, {
        type: "tokens",
        quantity: Math.max(50, Math.round(text.length / 4)),
        provider: "groq",
        model: GROQ_STT_MODEL,
        idempotencyKey: `tokens:transcribe:${requestId}`,
        metadata: { feature: "transcribe", requestId },
      });
    } catch {
      // ignore usage errors
    }

    return NextResponse.json({
      ok: true,
      text,
      who: label,
      empty: false,
    });
  } catch (err) {
    console.error("transcribe_error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unexpected transcription error" },
      { status: 500 }
    );
  }
}
