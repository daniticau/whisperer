import { motion } from "framer-motion";
import { LayoutDashboard, Clock, Settings, Mic, X, Minus, Square } from "lucide-react";
import { useDictationStore } from "../../stores/dictationStore";

type Page = "dashboard" | "history" | "settings";

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const navItems: { id: Page; label: string; icon: typeof LayoutDashboard; shortcut: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, shortcut: "Ctrl+1" },
  { id: "history", label: "History", icon: Clock, shortcut: "Ctrl+2" },
  { id: "settings", label: "Settings", icon: Settings, shortcut: "Ctrl+3" },
];

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const dictationState = useDictationStore((s) => s.state);

  return (
    <div className="w-[220px] h-full flex flex-col bg-[#0f0f11] border-r border-[#1f1f23]">
      {/* Title bar drag region */}
      <div className="drag-region h-10 flex items-center px-4 shrink-0">
        <div className="no-drag flex gap-1 items-center">
          <button
            onClick={() => window.electronAPI?.minimizeToTray()}
            className="p-0.5 text-[#3f3f46] hover:text-[#ef4444] transition-colors"
            title="Close to tray"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => window.electronAPI?.minimize()}
            className="p-0.5 text-[#3f3f46] hover:text-[#a1a1aa] transition-colors"
            title="Minimize"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => window.electronAPI?.maximize()}
            className="p-0.5 text-[#3f3f46] hover:text-[#a1a1aa] transition-colors"
            title="Maximize"
          >
            <Square className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Logo */}
      <div className="px-5 py-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-[#1c1c1f] flex items-center justify-center">
            <Mic className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-[#fafafa]">Whisperer</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className={`w-1.5 h-1.5 rounded-full ${
                dictationState === "recording"
                  ? "bg-white animate-pulse-glow"
                  : dictationState === "transcribing"
                    ? "bg-[#71717a]"
                    : "bg-[#52525b]"
              }`} />
              <span className="text-[10px] text-[#52525b] capitalize">{dictationState}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2">
        {navItems.map((item) => {
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`
                no-drag w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5
                text-sm transition-all duration-150 relative group
                ${isActive
                  ? "text-white bg-[#1c1c1f]"
                  : "text-[#71717a] hover:text-[#a1a1aa] hover:bg-[#161618]"
                }
              `}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-indicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 rounded-r-full bg-white"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <item.icon className="w-4 h-4 shrink-0" />
              <span className="flex-1 text-left">{item.label}</span>
              <span className="font-mono text-[10px] text-[#3f3f46] opacity-0 group-hover:opacity-100 transition-opacity">
                {item.shortcut}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-[#1f1f23] shrink-0">
        <p className="font-mono text-[10px] text-[#3f3f46]">v1.0.0</p>
      </div>
    </div>
  );
}
