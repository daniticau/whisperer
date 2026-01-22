import { app, Tray, Menu, BrowserWindow, nativeImage } from "electron";
import * as path from "path";

let tray: Tray | null = null;

function createTrayIcon() {
  // Create a simple 16x16 microphone icon programmatically
  const size = 16;
  const canvas = Buffer.alloc(size * size * 4);

  // Draw a simple white circle on transparent background
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - 8;
      const dy = y - 8;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const idx = (y * size + x) * 4;

      if (dist < 5) {
        // White filled circle
        canvas[idx] = 200;     // B
        canvas[idx + 1] = 200; // G
        canvas[idx + 2] = 220; // R
        canvas[idx + 3] = 255; // A
      } else if (dist < 6) {
        // Anti-aliased edge
        const alpha = Math.max(0, Math.min(255, Math.round((6 - dist) * 255)));
        canvas[idx] = 180;
        canvas[idx + 1] = 180;
        canvas[idx + 2] = 200;
        canvas[idx + 3] = alpha;
      }
    }
  }

  return nativeImage.createFromBuffer(canvas, { width: size, height: size });
}

export function createTray(dashboardWindow: BrowserWindow) {
  const icon = createTrayIcon();
  tray = new Tray(icon);
  tray.setToolTip("Voice Dictation - Click to open");

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Open Dashboard",
      click: () => {
        dashboardWindow.show();
        dashboardWindow.focus();
      },
    },
    { type: "separator" },
    {
      label: "Quit",
      click: () => {
        app.exit(0);
      },
    },
  ]);

  tray.setContextMenu(contextMenu);

  tray.on("click", () => {
    dashboardWindow.show();
    dashboardWindow.focus();
  });
}
