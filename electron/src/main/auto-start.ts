import { app } from "electron";

export function setAutoStart(enabled: boolean) {
  app.setLoginItemSettings({
    openAtLogin: enabled,
  });
}

export function getAutoStart(): boolean {
  return app.getLoginItemSettings().openAtLogin;
}
