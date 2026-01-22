import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  delay?: number;
}

export function StatsCard({ title, value, subtitle, icon: Icon, delay = 0 }: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      className="bg-[#0f0f11] border border-[#1f1f23] rounded-lg p-5 hover:border-[#27272a] transition-colors group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-md bg-[#1c1c1f] flex items-center justify-center">
          <Icon className="w-4 h-4 text-[#a1a1aa]" />
        </div>
      </div>
      <motion.p
        className="font-mono text-2xl font-semibold text-white tracking-tight"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: delay + 0.2 }}
      >
        {value}
      </motion.p>
      <p className="text-xs uppercase tracking-wider text-[#a1a1aa] mt-1">{title}</p>
      {subtitle && (
        <p className="font-mono text-[10px] text-[#52525b] mt-0.5">{subtitle}</p>
      )}
    </motion.div>
  );
}
