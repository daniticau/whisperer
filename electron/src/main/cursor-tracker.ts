import { BrowserWindow, screen } from "electron";

export class CursorTracker {
  private indicatorWindow: BrowserWindow;
  private interval: NodeJS.Timeout | null = null;
  private lastDisplayId: number | null = null;
  private paused = false;

  constructor(indicatorWindow: BrowserWindow) {
    this.indicatorWindow = indicatorWindow;
  }

  start() {
    if (this.interval) return;
    this.updatePosition(true);
    this.interval = setInterval(() => this.updatePosition(false), 500);
  }

  pause() {
    this.paused = true;
  }

  resume() {
    this.paused = false;
    this.updatePosition(true);
  }

  private updatePosition(force: boolean) {
    if (this.indicatorWindow.isDestroyed()) {
      if (this.interval) {
        clearInterval(this.interval);
        this.interval = null;
      }
      return;
    }

    if (this.paused && !force) return;

    const cursor = screen.getCursorScreenPoint();
    const display = screen.getDisplayNearestPoint(cursor);

    if (!force && display.id === this.lastDisplayId) return;

    this.lastDisplayId = display.id;
    const { x, y, width, height } = display.workArea;
    this.indicatorWindow.setPosition(
      x + Math.round((width - 80) / 2),
      y + height - 48
    );
    this.indicatorWindow.setSize(80, 48);
  }
}
