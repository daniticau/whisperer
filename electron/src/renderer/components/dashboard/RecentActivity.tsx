import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, ChevronDown, Copy, Check } from "lucide-react";
import { format, parseISO } from "date-fns";
import type { HistoryEntry } from "../../lib/types";

interface RecentActivityProps {
  entries: HistoryEntry[];
}

export function RecentActivity({ entries }: RecentActivityProps) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [copied, setCopied] = useState<number | null>(null);

  const handleCopy = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="bg-[#0f0f11] border border-[#1f1f23] rounded-lg p-5"
    >
      <h3 className="text-xs font-medium text-[#a1a1aa] uppercase tracking-wider mb-3">Recent Activity</h3>
      <div className="space-y-1">
        {entries.length === 0 ? (
          <p className="text-xs text-[#52525b] py-4 text-center">
            No dictations yet. Press F4 to start!
          </p>
        ) : (
          entries.slice(0, 10).map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <button
                onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}
                className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-[#1c1c1f] transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#fafafa] truncate">
                      {entry.text}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="w-3 h-3 text-[#3f3f46]" />
                      <span className="font-mono text-[10px] text-[#52525b]">
                        {format(parseISO(entry.timestamp), "h:mm a")}
                      </span>
                      <span className="font-mono text-[10px] text-[#52525b]">
                        {entry.duration_seconds.toFixed(1)}s
                      </span>
                      <span className="font-mono text-[10px] text-[#52525b]">
                        {entry.word_count} words
                      </span>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-[#3f3f46] transition-transform ${
                      expanded === entry.id ? "rotate-180" : ""
                    }`}
                  />
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
                    <div className="px-3 pb-2">
                      <div className="bg-[#09090b] rounded-lg p-3 text-xs text-[#a1a1aa] leading-relaxed">
                        {entry.text}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(entry.text, entry.id);
                          }}
                          className="mt-2 flex items-center gap-1 text-[#a1a1aa] hover:text-white transition-colors"
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
          ))
        )}
      </div>
    </motion.div>
  );
}
