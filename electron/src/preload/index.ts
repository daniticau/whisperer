import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  // Python commands
  sendCommand: (cmd: object) => ipcRenderer.send("python-command", cmd),

  // Real-time events from Python
  onDictationState: (cb: (state: string) => void) => {
    const listener = (_: any, state: string) => cb(state);
    ipcRenderer.on("dictation-state", listener);
    return () => ipcRenderer.removeListener("dictation-state", listener);
  },
  onTranscriptionResult: (cb: (result: any) => void) => {
    const listener = (_: any, result: any) => cb(result);
    ipcRenderer.on("transcription-result", listener);
    return () => ipcRenderer.removeListener("transcription-result", listener);
  },
  onModelLoading: (cb: (progress: number) => void) => {
    const listener = (_: any, progress: number) => cb(progress);
    ipcRenderer.on("model-loading", listener);
    return () => ipcRenderer.removeListener("model-loading", listener);
  },
  onError: (cb: (message: string) => void) => {
    const listener = (_: any, message: string) => cb(message);
    ipcRenderer.on("error", listener);
    return () => ipcRenderer.removeListener("error", listener);
  },

  // Settings
  getSettings: () => ipcRenderer.invoke("get-settings"),
  updateSettings: (settings: object) =>
    ipcRenderer.invoke("update-settings", settings),

  // History
  getHistory: (params: Record<string, string>) =>
    ipcRenderer.invoke("get-history", params),
  deleteHistoryEntry: (id: number) =>
    ipcRenderer.invoke("delete-history-entry", id),

  // Stats
  getStats: () => ipcRenderer.invoke("get-stats"),
  getDailyStats: (days: number) => ipcRenderer.invoke("get-daily-stats", days),

  // Devices
  getDevices: () => ipcRenderer.invoke("get-devices"),

  // Models
  getModels: () => ipcRenderer.invoke("get-models"),
  reloadModel: () => ipcRenderer.invoke("reload-model"),

  // Window
  minimizeToTray: () => ipcRenderer.send("minimize-to-tray"),
  minimize: () => ipcRenderer.send("window-minimize"),
  maximize: () => ipcRenderer.send("window-maximize"),
  close: () => ipcRenderer.send("window-close"),
});
