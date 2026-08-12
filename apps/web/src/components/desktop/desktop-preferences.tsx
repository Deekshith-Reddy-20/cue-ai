"use client";

import { useEffect, useState } from "react";
import { Card, CardTitle } from "@/components/ui/card";
import { getDesktop, isDesktopApp } from "@/lib/desktop";

type DesktopPrefs = {
  launchAtStartup: boolean;
  minimizeToTray: boolean;
  showNotifications: boolean;
  globalShortcuts: boolean;
  companionPinned: boolean;
  excludeFromCapture: boolean;
  autoPresentOnMeeting: boolean;
  autoHide: boolean;
  autoCollapse: boolean;
};

const defaults: DesktopPrefs = {
  launchAtStartup: false,
  minimizeToTray: true,
  showNotifications: true,
  globalShortcuts: true,
  companionPinned: true,
  excludeFromCapture: true,
  autoPresentOnMeeting: true,
  autoHide: false,
  autoCollapse: true,
};

export function DesktopPreferencesPanel() {
  const [prefs, setPrefs] = useState<DesktopPrefs>(defaults);
  const [ready, setReady] = useState(false);
  const [captureMsg, setCaptureMsg] = useState<string | null>(null);
  const desktop = typeof window !== "undefined" && isDesktopApp();

  useEffect(() => {
    if (!isDesktopApp()) {
      setReady(true);
      return;
    }
    void (async () => {
      const api = getDesktop();
      if (!api) return;
      const all = (await api.storeGetAll()) as Record<string, unknown>;
      const settings = (all.desktopSettings as Partial<DesktopPrefs>) || {};
      setPrefs({
        launchAtStartup: Boolean(all.launchAtStartup),
        minimizeToTray: settings.minimizeToTray ?? true,
        showNotifications: settings.showNotifications ?? true,
        globalShortcuts: settings.globalShortcuts ?? true,
        companionPinned: Boolean(all.companionPinned),
        excludeFromCapture: settings.excludeFromCapture ?? true,
        autoPresentOnMeeting: settings.autoPresentOnMeeting ?? true,
        autoHide: settings.autoHide ?? false,
        autoCollapse: settings.autoCollapse ?? true,
      });
      const status = await api.getCaptureStatus();
      setCaptureMsg(status.message);
      setReady(true);
    })();
  }, []);

  async function update(partial: Partial<DesktopPrefs>) {
    const next = { ...prefs, ...partial };
    setPrefs(next);
    const api = getDesktop();
    if (!api) return;

    if ("launchAtStartup" in partial) {
      await api.storeSet("launchAtStartup", next.launchAtStartup);
    }
    if ("companionPinned" in partial) {
      await api.storeSet("companionPinned", next.companionPinned);
    }

    const settingsKeys = [
      "minimizeToTray",
      "showNotifications",
      "globalShortcuts",
      "excludeFromCapture",
      "autoPresentOnMeeting",
      "autoHide",
      "autoCollapse",
    ] as const;

    if (settingsKeys.some((k) => k in partial)) {
      const existing = (await api.storeGet<Record<string, unknown>>("desktopSettings")) || {};
      await api.storeSet("desktopSettings", {
        ...existing,
        minimizeToTray: next.minimizeToTray,
        showNotifications: next.showNotifications,
        globalShortcuts: next.globalShortcuts,
        excludeFromCapture: next.excludeFromCapture,
        autoPresentOnMeeting: next.autoPresentOnMeeting,
        autoHide: next.autoHide,
        autoCollapse: next.autoCollapse,
      });
    }

    if ("excludeFromCapture" in partial) {
      const status = await api.getCaptureStatus();
      // Re-apply via companion API path through store set + status refresh
      setCaptureMsg(status.message);
      void api.showCompanion();
    }
  }

  if (!ready) return null;

  if (!desktop) {
    return (
      <Card className="space-y-3 p-6">
        <CardTitle>Desktop Preferences</CardTitle>
        <p className="text-sm text-muted">
          Open CueAI Desktop to manage launch at login, tray behavior, and companion window
          preferences.
        </p>
      </Card>
    );
  }

  const rows: { key: keyof DesktopPrefs; label: string }[] = [
    { key: "launchAtStartup", label: "Launch at login" },
    { key: "companionPinned", label: "Companion always on top" },
    { key: "excludeFromCapture", label: "Exclude companion from screen capture (when OS allows)" },
    { key: "autoPresentOnMeeting", label: "Prefer presenter layout when CueAI Private/Live is on" },
    { key: "autoCollapse", label: "Auto-collapse companion when idle" },
    { key: "autoHide", label: "Auto-hide companion when idle" },
    { key: "minimizeToTray", label: "Minimize to tray on close" },
    { key: "showNotifications", label: "Desktop notifications" },
    { key: "globalShortcuts", label: "Global keyboard shortcuts" },
  ];

  return (
    <Card className="space-y-3 p-6">
      <CardTitle>Desktop Preferences</CardTitle>
      {rows.map(({ key, label }) => (
        <label
          key={key}
          className="flex items-center justify-between gap-4 rounded-xl border border-[var(--border)] px-4 py-3 text-sm"
        >
          <span>{label}</span>
          <input
            type="checkbox"
            checked={prefs[key]}
            onChange={(e) => void update({ [key]: e.target.checked })}
            className="rounded"
          />
        </label>
      ))}
      {captureMsg && (
        <p className="text-xs text-muted">{captureMsg}</p>
      )}
    </Card>
  );
}
