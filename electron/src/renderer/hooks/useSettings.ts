import { useEffect, useCallback } from "react";
import { useSettingsStore } from "../stores/settingsStore";
import type { Settings } from "../lib/types";

const defaultSettings: Settings = {
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

export function useSettings() {
  const store = useSettingsStore();

  useEffect(() => {
    const api = window.electronAPI;
    if (!api) return;

    let mounted = true;

    const syncSettings = async () => {
      try {
        const settings = await api.getSettings();
        if (mounted) {
          store.setSettings(settings ?? defaultSettings);
        }
      } catch {
        if (mounted) {
          store.setSettings(defaultSettings);
        }
      }
    };

    syncSettings();
    const unsubscribe = api.onPythonReconnected(syncSettings);

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const updateSettings = useCallback(
    async (updates: Partial<Settings>) => {
      const api = window.electronAPI;
      if (!api) return;

      // Optimistic update
      if (store.settings) {
        store.setSettings({ ...store.settings, ...updates });
      }

      try {
        const result = await api.updateSettings(updates);
        store.setSettings(result ?? { ...(store.settings ?? defaultSettings), ...updates });
      } catch {
        store.setSettings({ ...(store.settings ?? defaultSettings), ...updates });
      }
    },
    [store.settings]
  );

  return { ...store, updateSettings };
}
