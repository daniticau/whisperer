import { motion } from "framer-motion";
import type { DailyStats } from "../../lib/types";
import { format, parseISO } from "date-fns";

interface UsageChartProps {
  data: DailyStats[];
}

export function UsageChart({ data }: UsageChartProps) {
  const maxWords = Math.max(...data.map((d) => d.words), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="bg-[#0f0f11] border border-[#1f1f23] rounded-lg p-5"
    >
      <h3 className="text-xs font-medium text-[#a1a1aa] uppercase tracking-wider mb-4">Last 7 Days</h3>
      <div className="flex items-end gap-2 h-32">
        {data.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-[#52525b] text-xs">
            No data yet
          </div>
        ) : (
          data.map((day, i) => {
            const height = Math.max((day.words / maxWords) * 100, 4);
            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                <span className="font-mono text-[10px] text-[#52525b]">{day.words}</span>
                <motion.div
                  className="w-full rounded-t-md bg-white/20 hover:bg-white/40 transition-colors min-h-[4px]"
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ duration: 0.5, delay: i * 0.05, ease: "easeOut" }}
                />
                <span className="font-mono text-[10px] text-[#52525b]">
                  {format(parseISO(day.date), "EEE")}
                </span>
              </div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
