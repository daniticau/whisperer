import { useEffect, useCallback } from "react";
import { useSettingsStore } from "../stores/settingsStore";
import type { Settings } from "../lib/types";

export function useSettings() {
  const store = useSettingsStore();

  useEffect(() => {
    const api = window.electronAPI;
    if (!api) return;

    api.getSettings().then((settings) => {
      store.setSettings(settings);
    });
  }, []);

  const updateSettings = useCallback(
    async (updates: Partial<Settings>) => {
      const api = window.electronAPI;
      if (!api) return;

      // Optimistic update
      if (store.settings) {
        store.setSettings({ ...store.settings, ...updates });
      }

      const result = await api.updateSettings(updates);
      store.setSettings(result);
    },
    [store.settings]
  );

  return { ...store, updateSettings };
}
