import { useState, useCallback } from "react";
import type { HistoryEntry, HistoryResponse } from "../lib/types";

export function useHistory() {
  const [data, setData] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(false);

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
      } finally {
        setLoading(false);
      }
    },
    []
  );

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
