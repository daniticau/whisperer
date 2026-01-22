import { useState } from "react";
import { Zap, Plus, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface VoiceSnippetsProps {
  snippets: Record<string, string>;
  onChange: (snippets: Record<string, string>) => void;
}

export function VoiceSnippets({ snippets, onChange }: VoiceSnippetsProps) {
  const [trigger, setTrigger] = useState("");
  const [expansion, setExpansion] = useState("");

  const addSnippet = () => {
    const t = trigger.trim();
    const e = expansion.trim();
    if (t && e) {
      onChange({ ...snippets, [t]: e });
      setTrigger("");
      setExpansion("");
    }
  };

  const removeSnippet = (key: string) => {
    const updated = { ...snippets };
    delete updated[key];
    onChange(updated);
  };

  const entries = Object.entries(snippets);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Zap className="w-4 h-4 text-[#a1a1aa]" />
        <div>
          <h4 className="text-xs font-medium text-[#a1a1aa] uppercase tracking-wider">Voice Snippets</h4>
          <p className="text-[11px] text-[#52525b]">Say a trigger phrase to insert preset text</p>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
        <input
          type="text"
          value={trigger}
          onChange={(e) => setTrigger(e.target.value)}
          placeholder="Trigger phrase..."
          className="px-3 py-2 bg-[#09090b] border border-[#1f1f23] rounded-lg text-sm text-white placeholder:text-[#3f3f46] focus:outline-none focus:border-[#3b82f6] transition-colors"
        />
        <input
          type="text"
          value={expansion}
          onChange={(e) => setExpansion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addSnippet()}
          placeholder="Expands to..."
          className="px-3 py-2 bg-[#09090b] border border-[#1f1f23] rounded-lg text-sm text-white placeholder:text-[#3f3f46] focus:outline-none focus:border-[#3b82f6] transition-colors"
        />
        <button
          onClick={addSnippet}
          disabled={!trigger.trim() || !expansion.trim()}
          className="px-3 py-2 bg-[#1c1c1f] text-[#a1a1aa] hover:text-white border border-[#1f1f23] rounded-lg hover:border-[#27272a] disabled:opacity-30 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-1">
        <AnimatePresence>
          {entries.map(([key, value]) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 px-3 py-2 bg-[#1c1c1f] border border-[#1f1f23] rounded-lg"
            >
              <span className="font-mono text-xs font-medium text-white shrink-0">"{key}"</span>
              <span className="text-xs text-[#52525b] shrink-0">&rarr;</span>
              <span className="text-xs text-[#a1a1aa] truncate flex-1">{value}</span>
              <button
                onClick={() => removeSnippet(key)}
                className="text-[#52525b] hover:text-[#ef4444] transition-colors shrink-0"
              >
                <X className="w-3 h-3" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
        {entries.length === 0 && (
          <p className="text-xs text-[#52525b]">No snippets configured</p>
        )}
      </div>
    </div>
  );
}
