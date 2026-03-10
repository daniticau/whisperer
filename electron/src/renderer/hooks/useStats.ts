import { useState, useEffect, useCallback } from "react";
import type { Stats, DailyStats } from "../lib/types";

export function useStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const api = window.electronAPI;
    if (!api) return;

    try {
      const [s, d] = await Promise.all([
        api.getStats(),
        api.getDailyStats(7),
      ]);
      setStats(s);
      setDailyStats(d);
    } catch {
      setStats({
        words_today: 0,
        dictations_today: 0,
        words_total: 0,
        dictations_total: 0,
        total_duration_seconds: 0,
        avg_words_per_dictation: 0,
        time_saved_minutes: 0,
      });
      setDailyStats([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const api = window.electronAPI;
    if (!api) return;

    return api.onPythonReconnected(() => {
      void refresh();
    });
  }, [refresh]);

  return { stats, dailyStats, loading, refresh };
}
