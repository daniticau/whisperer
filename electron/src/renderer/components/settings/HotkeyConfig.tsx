import { useState } from "react";
import { Keyboard } from "lucide-react";

interface HotkeyConfigProps {
  hotkey: string;
  onChange: (key: string) => void;
}

const AVAILABLE_KEYS = [
  "f1", "f2", "f3", "f4", "f5", "f6", "f7", "f8", "f9", "f10", "f11", "f12",
  "scroll_lock", "pause", "insert",
];

export function HotkeyConfig({ hotkey, onChange }: HotkeyConfigProps) {
  const [capturing, setCapturing] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Keyboard className="w-4 h-4 text-[#a1a1aa]" />
        <div>
          <h4 className="text-xs font-medium text-[#a1a1aa] uppercase tracking-wider">Push-to-Talk Key</h4>
          <p className="text-[11px] text-[#52525b]">Hold this key to record, release to transcribe</p>
        </div>
      </div>
      <select
        value={hotkey}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 bg-[#09090b] border border-[#1f1f23] rounded-lg text-sm text-white font-mono focus:outline-none focus:border-[#3b82f6] transition-colors appearance-none cursor-pointer"
      >
        {AVAILABLE_KEYS.map((k) => (
          <option key={k} value={k}>
            {k.toUpperCase()}
          </option>
        ))}
      </select>
    </div>
  );
}
