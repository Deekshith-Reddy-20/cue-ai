export type DesktopStatus = {
  isDesktop: true;
  version: string;
  companionVisible: boolean;
  companionMode: "full" | "mini" | "collapsed" | "presenter";
  alwaysOnTop: boolean;
  launchAtStartup: boolean;
  platform: string;
  captureExcluded?: boolean;
  meetingActive?: boolean;
  screenSharing?: boolean;
};

export type MeetingSession = {
  active: boolean;
  screenSharing: boolean;
  meetingId?: string;
  title?: string;
  cueAiMode?: "inactive" | "private" | "live";
};

export type CaptureStatus = {
  requested: boolean;
  applied: boolean;
  supported: boolean;
  message: string;
};

export type CueDesktopAPI = {
  isDesktop: true;
  minimize: () => Promise<void>;
  maximize: () => Promise<boolean>;
  close: () => Promise<void>;
  isMaximized: () => Promise<boolean>;
  onMaximizedChange: (cb: (maximized: boolean) => void) => () => void;
  onNavigate: (cb: (path: string) => void) => () => void;
  onShortcut: (cb: (name: string) => void) => () => void;
  toggleCompanion: () => Promise<void>;
  showCompanion: () => Promise<void>;
  hideCompanion: () => Promise<void>;
  getStatus: () => Promise<DesktopStatus>;
  getVersion: () => Promise<string>;
  openExternal: (url: string) => Promise<void>;
  notify: (title: string, body: string) => Promise<boolean>;
  pickFile: () => Promise<string | null>;
  saveFile: (opts?: {
    defaultPath?: string;
    filters?: { name: string; extensions: string[] }[];
  }) => Promise<string | null>;
  storeGet: <T = unknown>(key: string) => Promise<T>;
  storeSet: (key: string, value: unknown) => Promise<void>;
  storeGetAll: () => Promise<Record<string, unknown>>;
  setMeetingSession: (session: Partial<MeetingSession>) => Promise<MeetingSession>;
  getMeetingSession: () => Promise<MeetingSession>;
  getCaptureStatus: () => Promise<CaptureStatus>;
};

declare global {
  interface Window {
    cueDesktop?: CueDesktopAPI;
  }
}

export function isDesktopApp() {
  return typeof window !== "undefined" && Boolean(window.cueDesktop?.isDesktop);
}

export function getDesktop() {
  return typeof window !== "undefined" ? window.cueDesktop : undefined;
}
