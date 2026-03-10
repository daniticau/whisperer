import { app, BrowserWindow, ipcMain, screen } from "electron";
import * as path from "path";
import { PythonSidecar } from "./python-sidecar";
import { IpcBridge } from "./ipc-bridge";
import { createTray } from "./tray";
import {
  createDashboardWindow,
  createIndicatorWindow,
} from "./windows";

let dashboardWindow: BrowserWindow | null = null;
let indicatorWindow: BrowserWindow | null = null;
let sidecar: PythonSidecar | null = null;
let bridge: IpcBridge | null = null;
let pythonPort: number = 0;

const defaultSettings = {
  hotkey: "f4",
  model_size: "small.en",
  language: "en",
  device: "auto",
  compute_type: "auto",
  audio_device: null,
  sample_rate: 16000,
  channels: 1,
  tone: "neutral",
  filler_removal: true,
  smart_punctuation: true,
  backtracking_correction: true,
  custom_dictionary: [],
  voice_snippets: {},
  context_awareness: false,
  save_history: true,
  auto_start: false,
  theme: "dark",
  indicator_position: null,
};

const defaultHistory = { items: [], total: 0, page: 1, limit: 50 };
const defaultStats = {
  words_today: 0,
  dictations_today: 0,
  words_total: 0,
  dictations_total: 0,
  total_duration_seconds: 0,
  avg_words_per_dictation: 0,
  time_saved_minutes: 0,
};

async function requestWithFallback<T>(
  label: string,
  fallback: T,
  request: () => Promise<T>
): Promise<T> {
  try {
    return await request();
  } catch (error) {
    console.error(`${label} failed:`, error);
    return fallback;
  }
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
}

app.on("second-instance", () => {
  if (dashboardWindow) {
    if (dashboardWindow.isMinimized()) dashboardWindow.restore();
    dashboardWindow.show();
    dashboardWindow.focus();
  }
});

function getRendererPath(page: string): string {
  if (process.env.VITE_DEV_SERVER_URL) {
    return `${process.env.VITE_DEV_SERVER_URL}${page}`;
  }
  return path.join(__dirname, "../renderer", page);
}

app.whenReady().then(async () => {
  console.log("[main] app ready, __dirname:", __dirname);
  const primaryDisplay = screen.getPrimaryDisplay();

  const dashPath = getRendererPath("index.html");
  const indicatorPath = getRendererPath("indicator.html");
  console.log("[main] dashboard path:", dashPath);
  console.log("[main] indicator path:", indicatorPath);

  // Create windows FIRST so the UI shows immediately
  dashboardWindow = createDashboardWindow(dashPath);
  indicatorWindow = createIndicatorWindow(
    getRendererPath("indicator.html"),
    primaryDisplay
  );

  dashboardWindow.on("close", (e) => {
    e.preventDefault();
    dashboardWindow?.hide();
  });

  // Create system tray
  createTray(dashboardWindow);

  // Register IPC handlers (these work even before Python connects)
  ipcMain.handle("get-python-port", () => pythonPort);

  ipcMain.on("minimize-to-tray", () => {
    dashboardWindow?.hide();
  });

  ipcMain.on("window-minimize", () => {
    dashboardWindow?.minimize();
  });

  ipcMain.on("window-maximize", () => {
    if (dashboardWindow?.isMaximized()) {
      dashboardWindow.unmaximize();
    } else {
      dashboardWindow?.maximize();
    }
  });

  ipcMain.on("window-close", () => {
    dashboardWindow?.hide();
  });

  ipcMain.handle("get-settings", async () =>
    requestWithFallback("get-settings", defaultSettings, async () => {
      if (!bridge) return defaultSettings;
      return bridge.request("GET", "/api/settings");
    })
  );

  ipcMain.handle("update-settings", async (_e, settings: object) =>
    requestWithFallback("update-settings", defaultSettings, async () => {
      if (!bridge) return defaultSettings;
      return bridge.request("PUT", "/api/settings", settings);
    })
  );

  ipcMain.handle("get-history", async (_e, params: Record<string, string>) =>
    requestWithFallback("get-history", defaultHistory, async () => {
      const query = new URLSearchParams(params).toString();
      if (!bridge) return defaultHistory;
      return bridge.request("GET", `/api/history?${query}`);
    })
  );

  ipcMain.handle("get-stats", async () =>
    requestWithFallback("get-stats", defaultStats, async () => {
      if (!bridge) return defaultStats;
      return bridge.request("GET", "/api/stats");
    })
  );

  ipcMain.handle("get-daily-stats", async (_e, days: number) =>
    requestWithFallback("get-daily-stats", [], async () => {
      if (!bridge) return [];
      return bridge.request("GET", `/api/stats/daily?days=${days}`);
    })
  );

  ipcMain.handle("get-devices", async () =>
    requestWithFallback("get-devices", [], async () => {
      if (!bridge) return [];
      return bridge.request("GET", "/api/devices");
    })
  );

  ipcMain.handle("get-models", async () =>
    requestWithFallback("get-models", { available: {}, current: "small.en" }, async () => {
      if (!bridge) return { available: {}, current: "small.en" };
      return bridge.request("GET", "/api/models");
    })
  );

  ipcMain.handle("reload-model", async () =>
    requestWithFallback("reload-model", null, async () => {
      if (!bridge) return null;
      return bridge.request("POST", "/api/model/reload");
    })
  );

  ipcMain.handle("delete-history-entry", async (_e, id: number) =>
    requestWithFallback("delete-history-entry", null, async () => {
      if (!bridge) return null;
      return bridge.request("DELETE", `/api/history/${id}`);
    })
  );

  ipcMain.on("python-command", (_e, cmd: object) => {
    bridge?.sendWsMessage(cmd);
  });

  // Now start the Python sidecar in the background
  try {
    sidecar = new PythonSidecar();
    pythonPort = await sidecar.start((newPort) => {
      // Python crashed and restarted with CPU mode
      console.log(`Python restarted on port ${newPort}`);
      pythonPort = newPort;
      // Tear down old bridge so it stops reconnecting to the dead port
      bridge?.disconnect();
      bridge = new IpcBridge(newPort, dashboardWindow!, indicatorWindow!);
      bridge.connect().then(() => {
        console.log("IPC bridge reconnected after restart");
        // Tell renderer to re-fetch data now that Python is back
        if (dashboardWindow && !dashboardWindow.isDestroyed()) {
          dashboardWindow.webContents.send("python-reconnected");
        }
      }).catch((err) => {
        console.error("Failed to reconnect after restart:", err);
      });
    });
    console.log(`Python sidecar running on port ${pythonPort}`);

    // Connect IPC bridge
    bridge = new IpcBridge(pythonPort, dashboardWindow!, indicatorWindow!);
    await bridge.connect();
    console.log("IPC bridge connected");
    if (dashboardWindow && !dashboardWindow.isDestroyed()) {
      dashboardWindow.webContents.send("python-reconnected");
    }
  } catch (err) {
    console.error("Failed to start Python sidecar:", err);
    // App still runs - UI shows but dictation won't work
    // Send error to dashboard
    if (dashboardWindow && !dashboardWindow.isDestroyed()) {
      dashboardWindow.webContents.send("error", `Python backend failed to start: ${err}`);
    }
  }
});

app.on("window-all-closed", () => {
  // Don't quit on window close - stay in tray
});

app.on("before-quit", () => {
  sidecar?.stop();
  if (dashboardWindow && !dashboardWindow.isDestroyed()) dashboardWindow.destroy();
  if (indicatorWindow && !indicatorWindow.isDestroyed()) indicatorWindow.destroy();
});
