/**
 * Renderer-side listening streams for companion mic + system audio.
 * Streams are kept muted (Analyser only) so CueAI can "listen" without playback echo.
 * While live, MediaRecorder buffers audio; on stop we return a Blob for transcription.
 */

export type ListenActiveState = {
  mic: boolean;
  systemAudio: boolean;
  micLevel: number;
  systemLevel: number;
  error: string | null;
};

type LevelTap = {
  ctx: AudioContext;
  analyser: AnalyserNode;
  source: MediaStreamAudioSourceNode;
  raf: number;
};

type RecorderBag = {
  recorder: MediaRecorder;
  chunks: BlobPart[];
  mimeType: string;
};

let micStream: MediaStream | null = null;
let systemStream: MediaStream | null = null;
let micTap: LevelTap | null = null;
let systemTap: LevelTap | null = null;
let micRec: RecorderBag | null = null;
let systemRec: RecorderBag | null = null;
let levelListeners = new Set<(state: ListenActiveState) => void>();
let lastError: string | null = null;

function emit() {
  const state: ListenActiveState = {
    mic: Boolean(micStream?.getAudioTracks().some((t) => t.readyState === "live")),
    systemAudio: Boolean(systemStream?.getAudioTracks().some((t) => t.readyState === "live")),
    micLevel: micTap ? readLevel(micTap.analyser) : 0,
    systemLevel: systemTap ? readLevel(systemTap.analyser) : 0,
    error: lastError,
  };
  levelListeners.forEach((cb) => cb(state));
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

function attachTap(stream: MediaStream): LevelTap {
  const ctx = new AudioContext();
  const source = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 256;
  source.connect(analyser);
  const tap: LevelTap = { ctx, analyser, source, raf: 0 };
  const tick = () => {
    emit();
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

function startRecorder(stream: MediaStream): RecorderBag | null {
  if (typeof MediaRecorder === "undefined") return null;
  const audioOnly = new MediaStream(stream.getAudioTracks());
  if (!audioOnly.getAudioTracks().length) return null;
  try {
    const mimeType = pickMimeType();
    const recorder = mimeType
      ? new MediaRecorder(audioOnly, { mimeType })
      : new MediaRecorder(audioOnly);
    const bag: RecorderBag = {
      recorder,
      chunks: [],
      mimeType: recorder.mimeType || mimeType || "audio/webm",
    };
    recorder.ondataavailable = (ev) => {
      if (ev.data && ev.data.size > 0) bag.chunks.push(ev.data);
    };
    recorder.start(1000);
    return bag;
  } catch {
    return null;
  }
}

async function stopRecorder(bag: RecorderBag | null): Promise<Blob | null> {
  if (!bag) return null;
  const { recorder, chunks, mimeType } = bag;
  if (recorder.state === "inactive") {
    return chunks.length ? new Blob(chunks, { type: mimeType }) : null;
  }
  return new Promise((resolve) => {
    recorder.onstop = () => {
      resolve(chunks.length ? new Blob(chunks, { type: mimeType }) : null);
    };
    try {
      recorder.requestData();
    } catch {
      /* ignore */
    }
    recorder.stop();
  });
}

export function subscribeListenLevels(cb: (state: ListenActiveState) => void) {
  levelListeners.add(cb);
  cb({
    mic: Boolean(micStream),
    systemAudio: Boolean(systemStream),
    micLevel: 0,
    systemLevel: 0,
    error: lastError,
  });
  return () => {
    levelListeners.delete(cb);
  };
}

export async function startMicListen(): Promise<void> {
  if (micStream) return;
  lastError = null;
  try {
    micStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: false,
    });
    micTap = attachTap(micStream);
    micRec = startRecorder(micStream);
    emit();
  } catch (err) {
    lastError = err instanceof Error ? err.message : "Microphone permission denied";
    emit();
    throw err;
  }
}

export async function stopMicListen(): Promise<Blob | null> {
  const blob = await stopRecorder(micRec);
  micRec = null;
  releaseTap(micTap);
  micTap = null;
  stopStream(micStream);
  micStream = null;
  emit();
  return blob;
}

export async function startSystemAudioListen(
  getSourceId: () => Promise<string | null>
): Promise<void> {
  if (systemStream) return;
  lastError = null;
  try {
    const sourceId = await getSourceId();
    if (!sourceId) {
      throw new Error("No system audio source available");
    }

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
          maxWidth: 1,
          maxHeight: 1,
        },
      },
    } as unknown as MediaStreamConstraints;

    systemStream = await navigator.mediaDevices.getUserMedia(constraints);
    systemStream.getVideoTracks().forEach((t) => {
      t.enabled = false;
      t.stop();
    });
    if (!systemStream.getAudioTracks().length) {
      stopStream(systemStream);
      systemStream = null;
      throw new Error("System audio not available on this display");
    }
    systemTap = attachTap(systemStream);
    systemRec = startRecorder(systemStream);
    emit();
  } catch (err) {
    lastError = err instanceof Error ? err.message : "System audio capture failed";
    emit();
    throw err;
  }
}

export async function stopSystemAudioListen(): Promise<Blob | null> {
  const blob = await stopRecorder(systemRec);
  systemRec = null;
  releaseTap(systemTap);
  systemTap = null;
  stopStream(systemStream);
  systemStream = null;
  emit();
  return blob;
}

export async function syncListenSources(opts: {
  mic: boolean;
  systemAudio: boolean;
  getDesktopSourceId: () => Promise<string | null>;
}): Promise<{ micBlob: Blob | null; systemBlob: Blob | null }> {
  let micBlob: Blob | null = null;
  let systemBlob: Blob | null = null;

  if (opts.mic) {
    if (!micStream) await startMicListen();
  } else if (micStream) {
    micBlob = await stopMicListen();
  }

  if (opts.systemAudio) {
    if (!systemStream) await startSystemAudioListen(opts.getDesktopSourceId);
  } else if (systemStream) {
    systemBlob = await stopSystemAudioListen();
  }

  return { micBlob, systemBlob };
}

export async function stopAllListen(): Promise<{
  micBlob: Blob | null;
  systemBlob: Blob | null;
}> {
  const micBlob = micStream ? await stopMicListen() : null;
  const systemBlob = systemStream ? await stopSystemAudioListen() : null;
  lastError = null;
  emit();
  return { micBlob, systemBlob };
}

export async function transcribeAudioBlob(
  blob: Blob,
  who: string,
  apiBase = "http://127.0.0.1:3000"
): Promise<{ who: string; text: string } | null> {
  if (!blob || blob.size < 800) return null;
  const body = new FormData();
  const ext = blob.type.includes("ogg") ? "ogg" : blob.type.includes("mp4") ? "m4a" : "webm";
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
  if (!res.ok) throw new Error(data.error || "Transcription failed");
  if (!data.text?.trim()) return null;
  return { who: data.who || who, text: data.text.trim() };
}
