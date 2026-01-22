import { Search, SortDesc, SortAsc, Download } from "lucide-react";

interface HistoryFiltersProps {
  search: string;
  onSearchChange: (val: string) => void;
  sort: "desc" | "asc";
  onSortToggle: () => void;
  onExport: () => void;
}

export function HistoryFilters({
  search,
  onSearchChange,
  sort,
  onSortToggle,
  onExport,
}: HistoryFiltersProps) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3f3f46]" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search dictations..."
          className="w-full pl-9 pr-4 py-2.5 bg-[#0f0f11] border border-[#1f1f23] rounded-lg text-sm text-[#fafafa] placeholder:text-[#3f3f46] focus:outline-none focus:border-[#3b82f6] transition-colors"
        />
      </div>
      <button
        onClick={onSortToggle}
        className="p-2.5 bg-[#0f0f11] border border-[#1f1f23] rounded-lg hover:border-[#27272a] transition-colors"
        title={sort === "desc" ? "Newest first" : "Oldest first"}
      >
        {sort === "desc" ? (
          <SortDesc className="w-4 h-4 text-[#a1a1aa]" />
        ) : (
          <SortAsc className="w-4 h-4 text-[#a1a1aa]" />
        )}
      </button>
      <button
        onClick={onExport}
        className="p-2.5 bg-[#0f0f11] border border-[#1f1f23] rounded-lg hover:border-[#27272a] transition-colors"
        title="Export as JSON"
      >
        <Download className="w-4 h-4 text-[#a1a1aa]" />
      </button>
    </div>
  );
}
