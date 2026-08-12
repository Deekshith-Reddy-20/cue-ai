import { app, BrowserWindow, screen, shell } from "electron";
import path from "node:path";
import { getStoreValue, setStoreValue } from "../services/store";

export function createMainWindow(): BrowserWindow {
  const isDev = !app.isPackaged;
  const saved = getStoreValue("mainBounds");
  const display = screen.getPrimaryDisplay().workArea;

  const win = new BrowserWindow({
    width: saved?.width ?? Math.min(1440, display.width),
    height: saved?.height ?? Math.min(900, display.height),
    x: saved?.x,
    y: saved?.y,
    minWidth: 1100,
    minHeight: 700,
    show: false,
    frame: false,
    titleBarStyle: "hidden",
    backgroundColor: "#0B0F10",
    roundedCorners: true,
    hasShadow: true,
    thickFrame: true,
    autoHideMenuBar: true,
    title: "CueAI",
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      spellcheck: true,
    },
  });

  // Dev: Next.js on :3000. Prod: set CUEAI_WEB_URL to the deployed / local web origin.
  const webUrl =
    process.env.CUEAI_WEB_URL ||
    (isDev ? "http://localhost:3000" : "http://localhost:3000");
  void win.loadURL(webUrl);

  win.once("ready-to-show", () => {
    win.show();
    win.focus();
  });

  win.on("close", (e) => {
    if (!win.isDestroyed()) {
      setStoreValue("mainBounds", win.getBounds());
    }
    if (getStoreValue("desktopSettings").minimizeToTray && !(e as { defaultPrevented?: boolean })) {
      // handled in IPC close; OS chrome close uses this
    }
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: "deny" };
  });

  return win;
}
