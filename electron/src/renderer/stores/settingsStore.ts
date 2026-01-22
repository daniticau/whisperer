import { create } from "zustand";
import type { Settings } from "../lib/types";

interface SettingsStore {
  settings: Settings | null;
  loading: boolean;
  setSettings: (settings: Settings) => void;
  setLoading: (loading: boolean) => void;
  updateField: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
}

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

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: null,
  loading: true,
  setSettings: (settings) => set({ settings, loading: false }),
  setLoading: (loading) => set({ loading }),
  updateField: (key, value) =>
    set((s) => ({
      settings: s.settings ? { ...s.settings, [key]: value } : null,
    })),
}));
