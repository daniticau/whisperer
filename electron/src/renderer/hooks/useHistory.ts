import { useState, useCallback, useEffect, useRef } from "react";
import type { HistoryEntry, HistoryResponse } from "../lib/types";

export function useHistory() {
  const [data, setData] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const lastParamsRef = useRef<{
    page?: number;
    limit?: number;
    search?: string;
    sort?: string;
    date_from?: string;
    date_to?: string;
  }>({});

  const fetchHistory = useCallback(
    async (params: {
      page?: number;
      limit?: number;
      search?: string;
      sort?: string;
      date_from?: string;
      date_to?: string;
    } = {}) => {
      const api = window.electronAPI;
      if (!api) return;

      lastParamsRef.current = params;
      setLoading(true);
      try {
        const queryParams: Record<string, string> = {};
        if (params.page) queryParams.page = String(params.page);
        if (params.limit) queryParams.limit = String(params.limit);
        if (params.search) queryParams.search = params.search;
        if (params.sort) queryParams.sort = params.sort;
        if (params.date_from) queryParams.date_from = params.date_from;
        if (params.date_to) queryParams.date_to = params.date_to;

        const result = await api.getHistory(queryParams);
        setData(result);
      } catch {
        setData({
          items: [],
          total: 0,
          page: params.page ?? 1,
          limit: params.limit ?? 50,
        });
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const api = window.electronAPI;
    if (!api) return;

    return api.onPythonReconnected(() => {
      void fetchHistory(lastParamsRef.current);
    });
  }, [fetchHistory]);

  const deleteEntry = useCallback(
    async (id: number) => {
      const api = window.electronAPI;
      if (!api) return;
      await api.deleteHistoryEntry(id);
      // Refresh
      if (data) {
        setData({
          ...data,
          items: data.items.filter((e) => e.id !== id),
          total: data.total - 1,
        });
      }
    },
    [data]
  );

  return { data, loading, fetchHistory, deleteEntry };
}
