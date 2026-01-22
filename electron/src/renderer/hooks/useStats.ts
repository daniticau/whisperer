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
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { stats, dailyStats, loading, refresh };
}
