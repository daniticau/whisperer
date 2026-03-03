import { useEffect } from "react";
import { useDictationStore } from "../stores/dictationStore";
import { useSettingsStore } from "../stores/settingsStore";
import type { DictationState } from "../lib/types";

export function useDictation() {
  const store = useDictationStore();

  useEffect(() => {
    const api = window.electronAPI;
    if (!api) return;

    const unsubs = [
      api.onDictationState((state: string) => {
        store.setState(state as DictationState);
      }),
      api.onTranscriptionResult((result) => {
        store.setLastResult(result);
      }),
      api.onModelLoading((progress) => {
        store.setModelLoading(progress >= 1 ? null : progress);
      }),
      api.onError((message) => {
        store.setError(message);
      }),
      api.onPythonReconnected(() => {
        // Python crashed and restarted — re-fetch settings
        api.getSettings().then((settings) => {
          useSettingsStore.getState().setSettings(settings);
        });
      }),
    ];

    return () => unsubs.forEach((fn) => fn());
  }, []);

  return store;
}
