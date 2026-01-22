import { useEffect, useState } from "react";
import { MessageSquare, Timer, Hash, TrendingUp } from "lucide-react";
import { StatsCard } from "./StatsCard";
import { UsageChart } from "./UsageChart";
import { RecentActivity } from "./RecentActivity";
import { useStats } from "../../hooks/useStats";
import { useDictationStore } from "../../stores/dictationStore";
import type { HistoryEntry } from "../../lib/types";

export function Dashboard() {
  const { stats, dailyStats, loading, refresh } = useStats();
  const [recentEntries, setRecentEntries] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    const api = window.electronAPI;
    if (!api) return;

    api.getHistory({ limit: "10", sort: "desc" }).then((res) => {
      setRecentEntries(res.items);
    });
  }, []);

  // Refresh stats when a new transcription comes in
  const lastResult = useDictationStore((s) => s.lastResult);
  useEffect(() => {
    if (lastResult) {
      refresh();
      const api = window.electronAPI;
      if (api) {
        api.getHistory({ limit: "10", sort: "desc" }).then((res) => {
          setRecentEntries(res.items);
        });
      }
    }
  }, [lastResult]);

  if (loading || !stats) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-[#0f0f11] border border-[#1f1f23] rounded-lg p-5 h-28 animate-pulse" />
          ))}
        </div>
        <div className="bg-[#0f0f11] border border-[#1f1f23] rounded-lg h-48 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4">
        <StatsCard
          title="Words Today"
          value={stats.words_today.toLocaleString()}
          subtitle={`${stats.dictations_today} dictations`}
          icon={MessageSquare}
          delay={0}
        />
        <StatsCard
          title="Time Saved"
          value={`${stats.time_saved_minutes}m`}
          subtitle="vs. typing at 100 WPM"
          icon={Timer}
          delay={0.05}
        />
        <StatsCard
          title="Total Words"
          value={stats.words_total.toLocaleString()}
          subtitle={`${stats.dictations_total} total dictations`}
          icon={Hash}
          delay={0.1}
        />
        <StatsCard
          title="Avg. Words"
          value={stats.avg_words_per_dictation}
          subtitle="per dictation"
          icon={TrendingUp}
          delay={0.15}
        />
      </div>

      {/* Chart + Activity */}
      <div className="grid grid-cols-2 gap-4">
        <UsageChart data={dailyStats} />
        <RecentActivity entries={recentEntries} />
      </div>
    </div>
  );
}
