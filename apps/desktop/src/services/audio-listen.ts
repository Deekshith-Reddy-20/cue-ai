/**
 * Renderer-side mic + system loopback capture with speech-gated segments.
 * Records only while voice is active, finalizes on ~550ms silence for STT.
 */

import {
  clearAudioError,
  emitLevelsThrottled,
  endMicStart,
  endSystemStart,
  humanizeFetchError,
  resetAudioSessionState,
  setAudioError,
  setMicLevel,
  setMicState,
  setSystemLevel,
  setSystemState,
  subscribeAudioSession,
  tryBeginMicStart,
  tryBeginSystemStart,
  type AudioSessionSnapshot,
} from "./audio-session-manager";
import { pipelineLog } from "./pipeline-log";

export type ListenActiveState = AudioSessionSnapshot;

export type LiveTranscribeConfig = {
  apiBase: string;
  onResult: (line: {
    who: string;
    text: string;
    audioEndAt?: number;
    transcribedAt?: number;
  }) => void;
  onError: (msg: string) => void;
};

type LevelTap = {
  ctx: AudioContext;
  analyser: AnalyserNode;
  source: MediaStreamAudioSourceNode;
  raf: number;
};

type CaptureLane = {
  who: "You" | "System";
  kind: "mic" | "system";
  stream: MediaStream;
  tap: LevelTap;
  speechStartedAt: number | null;
  lastVoiceAt: number;
  recorder: MediaRecorder | null;
  chunks: Blob[];
  mimeType: string;
  flushTimer: number | null;
  maxTimer: number | null;
  pollTimer: number | null;
  onEnded: (() => void) | null;
};

const VOICE_THRESHOLD = 0.012;
/** Wait longer after speech so trailing words aren't cut off. */
const SILENCE_END_MS = 780;
const MIN_SPEECH_MS = 400;
/** Allow full interview questions without hard-cutting mid sentence. */
const MAX_SPEECH_MS = 14_000;
const MIN_TRANSCRIBE_BYTES = 400;
const MAX_IN_FLIGHT = 2;

let micStream: MediaStream | null = null;
let systemStream: MediaStream | null = null;
let micLane: CaptureLane | null = null;
let systemLane: CaptureLane | null = null;
let liveConfig: LiveTranscribeConfig | null = null;
let transcribeInFlight = 0;
let micStartPromise: Promise<void> | null = null;
let systemStartPromise: Promise<void> | null = null;

export function configureLiveTranscription(config: LiveTranscribeConfig | null) {
  liveConfig = config;
}

export function getListenActive(): { mic: boolean; systemAudio: boolean } {
  return {
    mic: Boolean(micStream?.getAudioTracks().some((t) => t.readyState === "live")),
    systemAudio: Boolean(
      systemStream?.getAudioTracks().some((t) => t.readyState === "live"),
    ),
  };
}

function readLevel(analyser: AnalyserNode) {
  const data = new Uint8Array(analyser.fftSize);
  analyser.getByteTimeDomainData(data);
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    const v = (data[i]! - 128) / 128;
    sum += v * v;
  }
  return Math.min(1, Math.sqrt(sum / data.length) * 4);
}

function attachTap(stream: MediaStream, kind: "mic" | "system"): LevelTap {
  const ctx = new AudioContext();
  const source = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 256;
  source.connect(analyser);
  const tap: LevelTap = { ctx, analyser, source, raf: 0 };
  const tick = () => {
    if (kind === "mic") setMicLevel(readLevel(analyser));
    else setSystemLevel(readLevel(analyser));
    emitLevelsThrottled(125);
    tap.raf = requestAnimationFrame(tick);
  };
  tap.raf = requestAnimationFrame(tick);
  void ctx.resume();
  return tap;
}

function releaseTap(tap: LevelTap | null) {
  if (!tap) return;
  cancelAnimationFrame(tap.raf);
  try {
    tap.source.disconnect();
  } catch {
    /* ignore */
  }
  void tap.ctx.close();
}

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((t) => t.stop());
}

function pickMimeType() {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/mp4",
  ];
  for (const type of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return "";
}

function humanizeMediaError(err: unknown, kind: "mic" | "system"): string {
  if (!(err instanceof Error) && !(err instanceof DOMException)) {
    return kind === "mic"
      ? "Microphone unavailable."
      : "System audio capture unavailable.";
  }
  const name = "name" in err ? String(err.name) : "";
  const msg = String((err as Error).message || "").toLowerCase();
  if (name === "NotAllowedError" || msg.includes("permission") || msg.includes("notallowed")) {
    return kind === "mic"
      ? "Microphone permission denied. Allow mic access for CueAI."
      : "System audio permission denied.";
  }
  if (name === "NotFoundError" || msg.includes("not found") || msg.includes("device")) {
    return kind === "mic"
      ? "No microphone device found."
      : "No system audio / loopback device found.";
  }
  if (name === "NotReadableError" || msg.includes("in use") || msg.includes("busy")) {
    return kind === "mic"
      ? "Microphone is already in use by another app."
      : "System audio device is unavailable or in use.";
  }
  if (name === "OverconstrainedError" || msg.includes("constraint")) {
    return kind === "mic"
      ? "Microphone constraints not supported on this device."
      : "System audio capture constraints not supported.";
  }
  if (msg.includes("system audio") || msg.includes("loopback")) {
    return "System audio capture is unavailable on this device.";
  }
  return humanizeFetchError(err);
}

async function maybeTranscribeSegment(blob: Blob, who: string, audioEndAt: number) {
  if (!liveConfig) return;
  if (blob.size < MIN_TRANSCRIBE_BYTES) return;
  if (transcribeInFlight >= MAX_IN_FLIGHT) {
    pipelineLog("transcription", "Dropped segment — too many in flight", { who, bytes: blob.size });
    return;
  }

  transcribeInFlight++;
  if (who === "You") setMicState("processing");
  else setSystemState("processing");
  pipelineLog("transcription", "Finalizing speech segment", { who, bytes: blob.size });

  try {
    const line = await transcribeAudioBlob(blob, who, liveConfig.apiBase);
    const transcribedAt = performance.now();
    if (line?.text) {
      pipelineLog("transcription", "Final transcript received", {
        who,
        chars: line.text.length,
      });
      liveConfig.onResult({
        who: line.who,
        text: line.text,
        audioEndAt,
        transcribedAt,
      });
    }
    clearAudioError();
  } catch (err) {
    const msg = humanizeFetchError(err);
    setAudioError(msg);
    liveConfig.onError(msg);
    pipelineLog("transcription", "Transcription failed", { who, error: msg.slice(0, 120) });
  } finally {
    transcribeInFlight--;
    if (who === "You" && micStream) setMicState("listening");
    else if (who === "System" && systemStream) setSystemState("listening");
  }
}

function stopRecorderImmediate(lane: CaptureLane): Promise<Blob | null> {
  const rec = lane.recorder;
  if (!rec || rec.state === "inactive") {
    lane.recorder = null;
    lane.chunks = [];
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    rec.onstop = () => {
      const blob =
        lane.chunks.length > 0
          ? new Blob(lane.chunks, { type: lane.mimeType || "audio/webm" })
          : null;
      lane.recorder = null;
      lane.chunks = [];
      resolve(blob);
    };
    try {
      rec.requestData();
    } catch {
      /* ignore */
    }
    try {
      rec.stop();
    } catch {
      lane.recorder = null;
      lane.chunks = [];
      resolve(null);
    }
  });
}

function startSpeechRecorder(lane: CaptureLane) {
  if (lane.recorder) return;
  if (typeof MediaRecorder === "undefined") return;
  const audioOnly = new MediaStream(lane.stream.getAudioTracks());
  if (!audioOnly.getAudioTracks().length) return;
  try {
    const mimeType = pickMimeType();
    const recorder = mimeType
      ? new MediaRecorder(audioOnly, { mimeType })
      : new MediaRecorder(audioOnly);
    lane.mimeType = recorder.mimeType || mimeType || "audio/webm";
    lane.chunks = [];
    lane.recorder = recorder;
    recorder.ondataavailable = (ev) => {
      if (ev.data && ev.data.size > 0) lane.chunks.push(ev.data);
    };
    recorder.start(250);
    lane.speechStartedAt = performance.now();
    if (lane.maxTimer != null) window.clearTimeout(lane.maxTimer);
    lane.maxTimer = window.setTimeout(() => {
      void finalizeSpeech(lane, "max_duration");
    }, MAX_SPEECH_MS);
    pipelineLog("audio", "Speech segment started", { who: lane.who });
  } catch (err) {
    pipelineLog("audio", "Recorder start failed", {
      who: lane.who,
      error: err instanceof Error ? err.message : "unknown",
    });
  }
}

async function finalizeSpeech(lane: CaptureLane, reason: string) {
  if (lane.flushTimer != null) {
    window.clearTimeout(lane.flushTimer);
    lane.flushTimer = null;
  }
  if (lane.maxTimer != null) {
    window.clearTimeout(lane.maxTimer);
    lane.maxTimer = null;
  }
  const started = lane.speechStartedAt;
  lane.speechStartedAt = null;
  if (!lane.recorder) return;
  if (started != null && performance.now() - started < MIN_SPEECH_MS) {
    await stopRecorderImmediate(lane);
    pipelineLog("audio", "Speech too short — discarded", { who: lane.who, reason });
    return;
  }
  const audioEndAt = performance.now();
  const blob = await stopRecorderImmediate(lane);
  pipelineLog("audio", "Speech segment ended", { who: lane.who, reason });
  if (blob) void maybeTranscribeSegment(blob, lane.who, audioEndAt);
}

function pollLane(lane: CaptureLane) {
  const level = readLevel(lane.tap.analyser);
  const now = performance.now();
  const voiced = level >= VOICE_THRESHOLD;

  if (voiced) {
    lane.lastVoiceAt = now;
    if (!lane.recorder) startSpeechRecorder(lane);
    if (lane.flushTimer != null) {
      window.clearTimeout(lane.flushTimer);
      lane.flushTimer = null;
    }
  } else if (lane.recorder && lane.speechStartedAt != null) {
    const silentFor = now - lane.lastVoiceAt;
    if (silentFor >= SILENCE_END_MS && lane.flushTimer == null) {
      lane.flushTimer = window.setTimeout(() => {
        lane.flushTimer = null;
        void finalizeSpeech(lane, "silence");
      }, 20);
    }
  }
}

function beginLanePolling(lane: CaptureLane) {
  if (lane.pollTimer != null) window.clearInterval(lane.pollTimer);
  lane.pollTimer = window.setInterval(() => pollLane(lane), 80);
}

function tearDownLane(lane: CaptureLane | null) {
  if (!lane) return;
  if (lane.pollTimer != null) window.clearInterval(lane.pollTimer);
  if (lane.flushTimer != null) window.clearTimeout(lane.flushTimer);
  if (lane.maxTimer != null) window.clearTimeout(lane.maxTimer);
  if (lane.onEnded) {
    lane.stream.getTracks().forEach((t) => t.removeEventListener("ended", lane.onEnded!));
  }
  if (lane.recorder && lane.recorder.state !== "inactive") {
    try {
      lane.recorder.stop();
    } catch {
      /* ignore */
    }
  }
  releaseTap(lane.tap);
}

function wireTrackEnded(lane: CaptureLane, onDead: () => void) {
  const handler = () => {
    pipelineLog("audio", "Audio device disconnected", { who: lane.who });
    onDead();
  };
  lane.onEnded = handler;
  lane.stream.getTracks().forEach((t) => t.addEventListener("ended", handler));
}

export function subscribeListenLevels(cb: (state: ListenActiveState) => void) {
  return subscribeAudioSession(cb);
}

async function startMicListenInternal(): Promise<void> {
  if (micStream) return;
  if (!tryBeginMicStart()) {
    if (micStartPromise) await micStartPromise;
    return;
  }

  micStartPromise = (async () => {
    let ok = false;
    try {
      setMicState("connecting");
      micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });
      const tap = attachTap(micStream, "mic");
      micLane = {
        who: "You",
        kind: "mic",
        stream: micStream,
        tap,
        speechStartedAt: null,
        lastVoiceAt: 0,
        recorder: null,
        chunks: [],
        mimeType: "",
        flushTimer: null,
        maxTimer: null,
        pollTimer: null,
        onEnded: null,
      };
      wireTrackEnded(micLane, () => {
        void stopMicListen();
        setAudioError("Microphone disconnected.");
        setMicState("error");
      });
      beginLanePolling(micLane);
      setMicState("listening");
      clearAudioError();
      pipelineLog("audio", "Microphone capture started");
      ok = true;
    } catch (err) {
      const msg = humanizeMediaError(err, "mic");
      setAudioError(msg);
      setMicState("error");
      stopStream(micStream);
      micStream = null;
      micLane = null;
      pipelineLog("audio", "Microphone capture failed", { error: msg });
      throw new Error(msg);
    } finally {
      endMicStart(ok);
      micStartPromise = null;
    }
  })();

  await micStartPromise;
}

export async function startMicListen(): Promise<void> {
  return startMicListenInternal();
}

export async function stopMicListen(): Promise<Blob | null> {
  setMicState("stopping");
  if (micLane) {
    await finalizeSpeech(micLane, "stop");
    tearDownLane(micLane);
    micLane = null;
  }
  stopStream(micStream);
  micStream = null;
  setMicLevel(0);
  setMicState("idle");
  pipelineLog("audio", "Microphone capture stopped");
  return null;
}

async function captureSystemStream(
  getSourceId: () => Promise<string | null>,
): Promise<MediaStream> {
  // Prefer getDisplayMedia + Electron loopback handler when available.
  if (typeof navigator.mediaDevices.getDisplayMedia === "function") {
    try {
      const display = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      if (display.getAudioTracks().length) {
        display.getVideoTracks().forEach((t) => {
          t.enabled = false;
          // Keep video track alive — some Chromium builds drop audio if video is stopped.
        });
        return display;
      }
      stopStream(display);
    } catch (err) {
      pipelineLog("audio", "getDisplayMedia loopback failed — trying desktop source", {
        error: err instanceof Error ? err.message.slice(0, 120) : "unknown",
      });
    }
  }

  const sourceId = await getSourceId();
  if (!sourceId) throw new Error("System audio capture is unavailable on this device.");

  const constraints = {
    audio: {
      mandatory: {
        chromeMediaSource: "desktop",
        chromeMediaSourceId: sourceId,
      },
    },
    video: {
      mandatory: {
        chromeMediaSource: "desktop",
        chromeMediaSourceId: sourceId,
        maxWidth: 1280,
        maxHeight: 720,
        maxFrameRate: 5,
      },
    },
  } as unknown as MediaStreamConstraints;

  const stream = await navigator.mediaDevices.getUserMedia(constraints);
  stream.getVideoTracks().forEach((t) => {
    t.enabled = false;
  });
  if (!stream.getAudioTracks().length) {
    stopStream(stream);
    throw new Error("System audio capture is unavailable on this device.");
  }
  return stream;
}

async function startSystemAudioListenInternal(
  getSourceId: () => Promise<string | null>,
): Promise<void> {
  if (systemStream) return;
  if (!tryBeginSystemStart()) {
    if (systemStartPromise) await systemStartPromise;
    return;
  }

  systemStartPromise = (async () => {
    let ok = false;
    try {
      setSystemState("connecting");
      systemStream = await captureSystemStream(getSourceId);
      const tap = attachTap(systemStream, "system");
      systemLane = {
        who: "System",
        kind: "system",
        stream: systemStream,
        tap,
        speechStartedAt: null,
        lastVoiceAt: 0,
        recorder: null,
        chunks: [],
        mimeType: "",
        flushTimer: null,
        maxTimer: null,
        pollTimer: null,
        onEnded: null,
      };
      wireTrackEnded(systemLane, () => {
        void stopSystemAudioListen();
        setAudioError("System audio disconnected.");
        setSystemState("error");
      });
      beginLanePolling(systemLane);
      setSystemState("listening");
      clearAudioError();
      pipelineLog("audio", "System loopback capture started");
      ok = true;
    } catch (err) {
      const msg = humanizeMediaError(err, "system");
      setAudioError(msg);
      setSystemState("error");
      stopStream(systemStream);
      systemStream = null;
      systemLane = null;
      pipelineLog("audio", "System loopback capture failed", { error: msg });
      throw new Error(msg);
    } finally {
      endSystemStart(ok);
      systemStartPromise = null;
    }
  })();

  await systemStartPromise;
}

export async function startSystemAudioListen(
  getSourceId: () => Promise<string | null>,
): Promise<void> {
  return startSystemAudioListenInternal(getSourceId);
}

export async function stopSystemAudioListen(): Promise<Blob | null> {
  setSystemState("stopping");
  if (systemLane) {
    await finalizeSpeech(systemLane, "stop");
    tearDownLane(systemLane);
    systemLane = null;
  }
  stopStream(systemStream);
  systemStream = null;
  setSystemLevel(0);
  setSystemState("idle");
  pipelineLog("audio", "System loopback capture stopped");
  return null;
}

export async function syncListenSources(opts: {
  mic: boolean;
  systemAudio: boolean;
  getDesktopSourceId: () => Promise<string | null>;
}): Promise<{ mic: boolean; systemAudio: boolean }> {
  const errors: string[] = [];

  if (opts.mic) {
    if (!getListenActive().mic) {
      try {
        await startMicListen();
      } catch (err) {
        errors.push(err instanceof Error ? err.message : "Mic failed");
      }
    }
  } else if (micStream) {
    await stopMicListen();
  }

  if (opts.systemAudio) {
    if (!getListenActive().systemAudio) {
      try {
        await startSystemAudioListen(opts.getDesktopSourceId);
      } catch (err) {
        errors.push(err instanceof Error ? err.message : "System audio failed");
      }
    }
  } else if (systemStream) {
    await stopSystemAudioListen();
  }

  const active = getListenActive();
  if (errors.length) {
    const msg = errors.join(" · ");
    setAudioError(msg);
    throw new Error(msg);
  }
  return active;
}

export async function stopAllListen(): Promise<{
  micBlob: Blob | null;
  systemBlob: Blob | null;
}> {
  const micBlob = micStream ? await stopMicListen() : null;
  const systemBlob = systemStream ? await stopSystemAudioListen() : null;
  resetAudioSessionState();
  return { micBlob, systemBlob };
}

export async function transcribeAudioBlob(
  blob: Blob,
  who: string,
  apiBase = "http://127.0.0.1:3000",
): Promise<{ who: string; text: string } | null> {
  if (!blob || blob.size < MIN_TRANSCRIBE_BYTES) return null;

  const buffer = await blob.arrayBuffer();
  const mime = blob.type || "audio/webm";

  if (typeof window !== "undefined" && window.cueai?.transcribe) {
    const data = await window.cueai.transcribe({ data: buffer, mime, label: who });
    if (data.error) throw new Error(data.error);
    if (!data.text?.trim()) return null;
    return { who: data.who || who, text: data.text.trim() };
  }

  const body = new FormData();
  const ext = mime.includes("ogg") ? "ogg" : mime.includes("mp4") ? "m4a" : "webm";
  body.append("audio", blob, `listen.${ext}`);
  body.append("label", who);
  const res = await fetch(`${apiBase.replace(/\/$/, "")}/api/transcribe`, {
    method: "POST",
    body,
  });
  const data = (await res.json()) as {
    text?: string;
    who?: string;
    error?: string;
    empty?: boolean;
  };
  if (!res.ok) throw new Error(data.error || "Unable to transcribe audio.");
  if (!data.text?.trim()) return null;
  return { who: data.who || who, text: data.text.trim() };
}
