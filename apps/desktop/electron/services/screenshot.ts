import { BrowserWindow, desktopCapturer, screen, type Display } from "electron";
import { getCompanionWindow } from "../windows/companion-window";
import { getStoreValue } from "./store";

export type ScreenshotResult = {
  ok: boolean;
  dataUrl?: string;
  savedPath?: string | null;
  error?: string;
  meta?: {
    width: number;
    height: number;
    bytes: number;
    displayId: number;
  };
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function displayForCompanion(companion: BrowserWindow | null): Display {
  try {
    if (companion && !companion.isDestroyed()) {
      const b = companion.getBounds();
      const cx = Math.round(b.x + b.width / 2);
      const cy = Math.round(b.y + b.height / 2);
      return screen.getDisplayNearestPoint({ x: cx, y: cy });
    }
  } catch {
    // fall through
  }
  return screen.getPrimaryDisplay();
}

/**
 * Capture the display under the companion as an in-memory PNG data URL.
 * Never opens a file picker / save dialog.
 * Briefly fades the overlay so the underlying page is what gets captured
 * (even when OS content-protection is uneven across capture APIs).
 */
export async function capturePrimaryScreenshot(_opts?: {
  /** Ignored — Capture is always in-memory. Kept for API compatibility. */
  save?: boolean;
  parent?: BrowserWindow | null;
}): Promise<ScreenshotResult> {
  const companion = getCompanionWindow();
  const canHideOverlay = Boolean(companion && !companion.isDestroyed() && companion.isVisible());
  const previousOpacity = canHideOverlay ? companion!.getOpacity() : 1;

  console.log("[CAPTURE] Capture requested");

  try {
    if (canHideOverlay) {
      console.log("[CAPTURE] Overlay hidden");
      companion!.setIgnoreMouseEvents(true);
      companion!.setOpacity(0);
      // One frame + paint settle so the page behind is visible to desktopCapturer.
      await sleep(90);
    }

    const display = displayForCompanion(companion);
    console.log("[CAPTURE] Display detected", { id: display.id, scale: display.scaleFactor });

    const scale = display.scaleFactor || 1;
    // Cap physical pixels so vision APIs stay fast while text remains readable.
    const maxEdge = 1920;
    const fullW = Math.max(1, Math.round(display.size.width * scale));
    const fullH = Math.max(1, Math.round(display.size.height * scale));
    const longEdge = Math.max(fullW, fullH);
    const factor = longEdge > maxEdge ? maxEdge / longEdge : 1;
    const width = Math.max(1, Math.round(fullW * factor));
    const height = Math.max(1, Math.round(fullH * factor));

    const sources = await desktopCapturer.getSources({
      types: ["screen"],
      thumbnailSize: { width, height },
    });

    const source =
      sources.find((s) => s.display_id && String(display.id) === s.display_id) ||
      sources.find((s) => s.id.includes(String(display.id))) ||
      sources[0];

    if (!source || source.thumbnail.isEmpty()) {
      console.log("[CAPTURE] Screenshot failed — empty source");
      return { ok: false, error: "Screen capture failed. Please try again." };
    }

    // JPEG keeps payload smaller for vision without wrecking text.
    const jpeg = source.thumbnail.toJPEG(82);
    const dataUrl = `data:image/jpeg;base64,${jpeg.toString("base64")}`;
    const size = source.thumbnail.getSize();

    console.log("[CAPTURE] Screenshot captured", {
      width: size.width,
      height: size.height,
      bytes: jpeg.length,
    });
    console.log("[CAPTURE] Screenshot size:", `${size.width}x${size.height}`, jpeg.length);

    return {
      ok: true,
      dataUrl,
      savedPath: null,
      meta: {
        width: size.width,
        height: size.height,
        bytes: jpeg.length,
        displayId: display.id,
      },
    };
  } catch (err) {
    console.error("[CAPTURE] Screenshot failed", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Screen capture failed. Please try again.",
    };
  } finally {
    if (canHideOverlay && companion && !companion.isDestroyed()) {
      const stored = Number(getStoreValue("companionOpacity")) || previousOpacity || 1;
      companion.setOpacity(Math.min(1, Math.max(0.35, stored)));
      companion.setIgnoreMouseEvents(false);
      console.log("[CAPTURE] Overlay restored");
    }
  }
}
