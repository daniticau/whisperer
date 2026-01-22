import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { HistoryFilters } from "./HistoryFilters";
import { HistoryTable } from "./HistoryTable";
import { useHistory } from "../../hooks/useHistory";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function HistoryView() {
  const { data, loading, fetchHistory, deleteEntry } = useHistory();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"desc" | "asc">("desc");
  const [page, setPage] = useState(1);

  const doFetch = useCallback(() => {
    fetchHistory({ page, limit: 50, search, sort });
  }, [page, search, sort, fetchHistory]);

  useEffect(() => {
    doFetch();
  }, [doFetch]);

  // Debounce search
  useEffect(() => {
    setPage(1);
    const timer = setTimeout(doFetch, 300);
    return () => clearTimeout(timer);
  }, [search, sort]);

  const handleExport = async () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data.items, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dictation-history.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalPages = data ? Math.ceil(data.total / data.limit) : 0;

  return (
    <div>
      <h2 className="text-lg font-semibold text-white tracking-tight mb-1">History</h2>
      <p className="text-xs text-[#52525b] mb-5">
        {data ? <span className="font-mono">{data.total}</span> : "Loading..."}{data ? " total dictations" : ""}
      </p>

      <HistoryFilters
        search={search}
        onSearchChange={setSearch}
        sort={sort}
        onSortToggle={() => setSort(sort === "desc" ? "asc" : "desc")}
        onExport={handleExport}
      />

      <div className="bg-[#0f0f11] border border-[#1f1f23] rounded-lg overflow-hidden">
        {loading ? (
          <div className="space-y-2 p-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 bg-[#161618] rounded-lg animate-pulse" />
            ))}
          </div>
        ) : data ? (
          <HistoryTable
            entries={data.items}
            onDelete={async (id) => {
              await deleteEntry(id);
              doFetch();
            }}
          />
        ) : null}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="p-2 rounded-lg bg-[#0f0f11] border border-[#1f1f23] hover:border-[#27272a] hover:text-white disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-mono text-xs text-[#52525b] px-3">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="p-2 rounded-lg bg-[#0f0f11] border border-[#1f1f23] hover:border-[#27272a] hover:text-white disabled:opacity-30 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
