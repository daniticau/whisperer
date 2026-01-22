import { BrowserWindow, Display } from "electron";
import * as path from "path";

const preloadPath = path.join(__dirname, "../preload/index.js");

export function createDashboardWindow(url: string): BrowserWindow {
  const win = new BrowserWindow({
    width: 1100,
    height: 750,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    titleBarStyle: "hidden",
    backgroundColor: "#09090b",
    show: true,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (url.startsWith("http")) {
    win.loadURL(url);
  } else {
    win.loadFile(url);
  }

  return win;
}

export function createIndicatorWindow(
  url: string,
  display: Display
): BrowserWindow {
  const { width, height } = display.workAreaSize;

  const win = new BrowserWindow({
    width: 80,
    height: 48,
    x: Math.round((width - 80) / 2),
    y: height - 80,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    focusable: false,
    hasShadow: false,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  win.setIgnoreMouseEvents(true, { forward: true });

  if (url.startsWith("http")) {
    win.loadURL(url);
  } else {
    win.loadFile(url);
  }

  return win;
}
