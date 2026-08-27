/**
 * Renderer-side listening streams for companion mic + system audio.
 * Streams are kept muted (Analyser only) so CueAI can "listen" without playback echo.
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

let micStream: MediaStream | null = null;
let systemStream: MediaStream | null = null;
let micTap: LevelTap | null = null;
let systemTap: LevelTap | null = null;
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
  // Do not connect to destination — silent listen.
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
    emit();
  } catch (err) {
    lastError = err instanceof Error ? err.message : "Microphone permission denied";
    emit();
    throw err;
  }
}

export async function stopMicListen(): Promise<void> {
  releaseTap(micTap);
  micTap = null;
  stopStream(micStream);
  micStream = null;
  emit();
}

export async function startSystemAudioListen(getSourceId: () => Promise<string | null>): Promise<void> {
  if (systemStream) return;
  lastError = null;
  try {
    const sourceId = await getSourceId();
    if (!sourceId) {
      throw new Error("No system audio source available");
    }

    // Electron desktop capture: video constraint is required on many platforms
    // even when we only care about loopback audio.
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
    emit();
  } catch (err) {
    lastError = err instanceof Error ? err.message : "System audio capture failed";
    emit();
    throw err;
  }
}

export async function stopSystemAudioListen(): Promise<void> {
  releaseTap(systemTap);
  systemTap = null;
  stopStream(systemStream);
  systemStream = null;
  emit();
}

export async function syncListenSources(opts: {
  mic: boolean;
  systemAudio: boolean;
  getDesktopSourceId: () => Promise<string | null>;
}) {
  if (opts.mic) {
    if (!micStream) await startMicListen();
  } else {
    await stopMicListen();
  }

  if (opts.systemAudio) {
    if (!systemStream) await startSystemAudioListen(opts.getDesktopSourceId);
  } else {
    await stopSystemAudioListen();
  }
}

export async function stopAllListen() {
  await stopMicListen();
  await stopSystemAudioListen();
  lastError = null;
  emit();
}
