export type DictationState = "idle" | "recording" | "transcribing";

export interface TranscriptionResult {
  text: string;
  duration: number;
  word_count: number;
}

export interface HistoryEntry {
  id: number;
  timestamp: string;
  duration_seconds: number;
  text: string;
  char_count: number;
  word_count: number;
  model_used: string;
  language: string;
}

export interface HistoryResponse {
  items: HistoryEntry[];
  total: number;
  page: number;
  limit: number;
}

export interface Stats {
  words_today: number;
  dictations_today: number;
  words_total: number;
  dictations_total: number;
  total_duration_seconds: number;
  avg_words_per_dictation: number;
  time_saved_minutes: number;
}

export interface DailyStats {
  date: string;
  words: number;
  count: number;
}

export interface AudioDevice {
  id: number;
  name: string;
  channels: number;
  sample_rate: number;
  is_default: boolean;
}

export interface Settings {
  hotkey: string;
  model_size: string;
  language: string;
  device: string;
  compute_type: string;
  audio_device: number | null;
  sample_rate: number;
  channels: number;
  tone: string;
  filler_removal: boolean;
  smart_punctuation: boolean;
  backtracking_correction: boolean;
  custom_dictionary: string[];
  voice_snippets: Record<string, string>;
  context_awareness: boolean;
  save_history: boolean;
  auto_start: boolean;
  theme: string;
  indicator_position: { x: number; y: number } | null;
}

export interface ModelInfo {
  available: Record<string, { vram_mb: number; desc: string }>;
  current: string;
}

export interface ElectronAPI {
  sendCommand: (cmd: object) => void;
  onDictationState: (cb: (state: string) => void) => () => void;
  onTranscriptionResult: (cb: (result: TranscriptionResult) => void) => () => void;
  onModelLoading: (cb: (progress: number) => void) => () => void;
  onError: (cb: (message: string) => void) => () => void;
  getSettings: () => Promise<Settings>;
  updateSettings: (settings: Partial<Settings>) => Promise<Settings>;
  getHistory: (params: Record<string, string>) => Promise<HistoryResponse>;
  deleteHistoryEntry: (id: number) => Promise<void>;
  getStats: () => Promise<Stats>;
  getDailyStats: (days: number) => Promise<DailyStats[]>;
  getDevices: () => Promise<AudioDevice[]>;
  getModels: () => Promise<ModelInfo>;
  reloadModel: () => Promise<void>;
  minimizeToTray: () => void;
  minimize: () => void;
  maximize: () => void;
  close: () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
