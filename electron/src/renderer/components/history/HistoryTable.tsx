import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, Trash2, Clock } from "lucide-react";
import { format, parseISO } from "date-fns";
import type { HistoryEntry } from "../../lib/types";

interface HistoryTableProps {
  entries: HistoryEntry[];
  onDelete: (id: number) => void;
}

export function HistoryTable({ entries, onDelete }: HistoryTableProps) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [copied, setCopied] = useState<number | null>(null);

  const handleCopy = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-[#52525b]">
        <Clock className="w-8 h-8 mb-3 opacity-40" />
        <p className="text-sm">No dictations found</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {entries.map((entry, i) => (
        <motion.div
          key={entry.id}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.02 }}
          className="group"
        >
          <button
            onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}
            className="w-full text-left px-4 py-3 hover:bg-[#161618] transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="shrink-0 w-20 font-mono text-[11px] text-[#52525b]">
                {format(parseISO(entry.timestamp), "MMM d")}
                <br />
                {format(parseISO(entry.timestamp), "h:mm a")}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#fafafa] truncate">{entry.text}</p>
              </div>
              <div className="shrink-0 flex items-center gap-3 font-mono text-[11px] text-[#52525b]">
                <span>{entry.duration_seconds.toFixed(1)}s</span>
                <span>{entry.word_count}w</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(entry.id);
                }}
                className="shrink-0 opacity-0 group-hover:opacity-100 text-[#52525b] hover:text-[#ef4444] transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </button>
          <AnimatePresence>
            {expanded === entry.id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden"
              >
                <div className="mx-4 mb-2 p-3 bg-[#09090b] border-t border-[#1f1f23] rounded-lg">
                  <p className="text-sm text-[#a1a1aa] leading-relaxed whitespace-pre-wrap">
                    {entry.text}
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() => handleCopy(entry.text, entry.id)}
                      className="flex items-center gap-1 text-xs text-[#a1a1aa] hover:text-white transition-colors"
                    >
                      {copied === entry.id ? (
                        <><Check className="w-3 h-3" /> Copied</>
                      ) : (
                        <><Copy className="w-3 h-3" /> Copy</>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
}
