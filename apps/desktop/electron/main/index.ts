import { app, BrowserWindow } from "electron";
import { createMainWindow } from "../windows/main-window";
import { createCompanionWindow } from "../windows/companion-window";
import { registerIpcHandlers } from "../ipc/handlers";
import { createTray, destroyTray } from "../tray/tray";
import { registerGlobalShortcuts, unregisterGlobalShortcuts } from "../services/shortcuts";
import { initUpdater } from "../updater/updater";
import { getStoreValue } from "../services/store";
import { allowCompanionQuit } from "../windows/companion-window";

let mainWindow: BrowserWindow | null = null;

function getMainWindow() {
  if (mainWindow && !mainWindow.isDestroyed()) return mainWindow;
  return null;
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    const win = getMainWindow();
    if (win) {
      if (win.isMinimized()) win.restore();
      win.show();
      win.focus();
    }
  });

  app.whenReady().then(() => {
    registerIpcHandlers();
    mainWindow = createMainWindow();

    mainWindow.on("maximize", () => {
      mainWindow?.webContents.send("window:maximized-changed", true);
    });
    mainWindow.on("unmaximize", () => {
      mainWindow?.webContents.send("window:maximized-changed", false);
    });

    createCompanionWindow();

    createTray(getMainWindow);
    registerGlobalShortcuts(getMainWindow);
    initUpdater();

    if (getStoreValue("launchAtStartup")) {
      app.setLoginItemSettings({ openAtLogin: true });
    }

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        mainWindow = createMainWindow();
      } else {
        getMainWindow()?.show();
      }
    });
  });

  app.on("before-quit", () => {
    allowCompanionQuit();
    for (const win of BrowserWindow.getAllWindows()) {
      win.removeAllListeners("close");
    }
  });

  app.on("will-quit", () => {
    unregisterGlobalShortcuts();
    destroyTray();
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      if (!getStoreValue("desktopSettings").minimizeToTray) {
        app.quit();
      }
    }
  });
}

export { getMainWindow };
