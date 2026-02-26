import { BrowserWindow } from "electron";
import WebSocket from "ws";
import { CursorTracker } from "./cursor-tracker";

export class IpcBridge {
  private ws: WebSocket | null = null;
  private port: number;
  private dashboardWindow: BrowserWindow;
  private indicatorWindow: BrowserWindow;
  private cursorTracker: CursorTracker;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectDelay = 100;

  constructor(
    port: number,
    dashboardWindow: BrowserWindow,
    indicatorWindow: BrowserWindow
  ) {
    this.port = port;
    this.dashboardWindow = dashboardWindow;
    this.indicatorWindow = indicatorWindow;
    this.cursorTracker = new CursorTracker(indicatorWindow);
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(`ws://127.0.0.1:${this.port}/ws`);

      this.ws.on("open", () => {
        console.log("WebSocket connected to Python sidecar");
        this.reconnectDelay = 100;
        this.cursorTracker.start();
        resolve();
      });

      this.ws.on("message", (data: WebSocket.Data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(message);
        } catch (e) {
          console.error("Failed to parse WS message:", e);
        }
      });

      this.ws.on("close", () => {
        console.log("WebSocket disconnected");
        this.scheduleReconnect();
      });

      this.ws.on("error", (err) => {
        console.error("WebSocket error:", err.message);
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
          reject(err);
        }
      });
    });
  }

  private handleMessage(message: any) {
    const { type } = message;

    // Forward state changes to indicator window
    if (type === "state_change") {
      const state = message.state;
      this.sendToWindow(this.indicatorWindow, "dictation-state", state);
      this.sendToWindow(this.dashboardWindow, "dictation-state", state);

      // Pause cursor tracker during recording/transcribing to prevent focus theft
      if (state === "recording" || state === "transcribing") {
        this.cursorTracker.pause();
      } else if (state === "idle") {
        this.cursorTracker.resume();
      }
    }

    // Forward transcription results to dashboard
    if (type === "transcription_result") {
      this.sendToWindow(this.dashboardWindow, "transcription-result", message);
    }

    // Forward model loading progress
    if (type === "model_loading") {
      this.sendToWindow(this.dashboardWindow, "model-loading", message.progress);
    }

    // Forward errors
    if (type === "error") {
      this.sendToWindow(this.dashboardWindow, "error", message.message);
    }

    // Forward all messages as generic events too
    this.sendToWindow(this.dashboardWindow, "python-message", message);
  }

  private sendToWindow(win: BrowserWindow, channel: string, data: any) {
    if (!win.isDestroyed()) {
      win.webContents.send(channel, data);
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, 5000);
      this.connect().catch(() => {});
    }, this.reconnectDelay);
  }

  sendWsMessage(message: object) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  async request(method: string, path: string, body?: object): Promise<any> {
    const url = `http://127.0.0.1:${this.port}${path}`;
    const options: RequestInit = {
      method,
      headers: { "Content-Type": "application/json" },
    };
    if (body) {
      options.body = JSON.stringify(body);
    }
    const response = await fetch(url, options);
    return response.json();
  }
}
