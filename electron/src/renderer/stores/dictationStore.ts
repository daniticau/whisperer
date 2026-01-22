import { create } from "zustand";
import type { DictationState, TranscriptionResult } from "../lib/types";

interface DictationStore {
  state: DictationState;
  lastResult: TranscriptionResult | null;
  modelLoading: number | null;
  error: string | null;
  recentResults: TranscriptionResult[];
  setState: (state: DictationState) => void;
  setLastResult: (result: TranscriptionResult) => void;
  setModelLoading: (progress: number | null) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useDictationStore = create<DictationStore>((set) => ({
  state: "idle",
  lastResult: null,
  modelLoading: null,
  error: null,
  recentResults: [],
  setState: (state) => set({ state }),
  setLastResult: (result) =>
    set((s) => ({
      lastResult: result,
      recentResults: [result, ...s.recentResults].slice(0, 50),
    })),
  setModelLoading: (progress) => set({ modelLoading: progress }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}));
