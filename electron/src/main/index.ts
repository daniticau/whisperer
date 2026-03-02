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

  ipcMain.handle("get-settings", async () => {
    return bridge?.request("GET", "/api/settings") ?? null;
  });

  ipcMain.handle("update-settings", async (_e, settings: object) => {
    return bridge?.request("PUT", "/api/settings", settings) ?? null;
  });

  ipcMain.handle("get-history", async (_e, params: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return bridge?.request("GET", `/api/history?${query}`) ?? { items: [], total: 0, page: 1, limit: 50 };
  });

  ipcMain.handle("get-stats", async () => {
    return bridge?.request("GET", "/api/stats") ?? {
      words_today: 0, dictations_today: 0, words_total: 0,
      dictations_total: 0, total_duration_seconds: 0,
      avg_words_per_dictation: 0, time_saved_minutes: 0,
    };
  });

  ipcMain.handle("get-daily-stats", async (_e, days: number) => {
    return bridge?.request("GET", `/api/stats/daily?days=${days}`) ?? [];
  });

  ipcMain.handle("get-devices", async () => {
    return bridge?.request("GET", "/api/devices") ?? [];
  });

  ipcMain.handle("get-models", async () => {
    return bridge?.request("GET", "/api/models") ?? { available: {}, current: "small.en" };
  });

  ipcMain.handle("reload-model", async () => {
    return bridge?.request("POST", "/api/model/reload") ?? null;
  });

  ipcMain.handle("delete-history-entry", async (_e, id: number) => {
    return bridge?.request("DELETE", `/api/history/${id}`) ?? null;
  });

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
      bridge = new IpcBridge(newPort, dashboardWindow!, indicatorWindow!);
      bridge.connect().then(() => {
        console.log("IPC bridge reconnected after restart");
      }).catch((err) => {
        console.error("Failed to reconnect after restart:", err);
      });
    });
    console.log(`Python sidecar running on port ${pythonPort}`);

    // Connect IPC bridge
    bridge = new IpcBridge(pythonPort, dashboardWindow!, indicatorWindow!);
    await bridge.connect();
    console.log("IPC bridge connected");
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
