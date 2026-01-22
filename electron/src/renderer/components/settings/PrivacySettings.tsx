import { Shield } from "lucide-react";

interface PrivacySettingsProps {
  saveHistory: boolean;
  contextAwareness: boolean;
  onSaveHistoryChange: (val: boolean) => void;
  onContextAwarenessChange: (val: boolean) => void;
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (val: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-9 h-5 rounded-full transition-colors ${
        checked ? "bg-[#3b82f6]" : "bg-[#27272a]"
      }`}
    >
      <div
        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-4.5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

export function PrivacySettings({
  saveHistory,
  contextAwareness,
  onSaveHistoryChange,
  onContextAwarenessChange,
}: PrivacySettingsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-3">
        <Shield className="w-4 h-4 text-[#a1a1aa]" />
        <h4 className="text-xs font-medium text-[#a1a1aa] uppercase tracking-wider">Privacy</h4>
      </div>

      <div className="flex items-center justify-between px-1">
        <div>
          <p className="text-sm text-white">Save History</p>
          <p className="text-[11px] text-[#52525b]">Store transcriptions for later review</p>
        </div>
        <Toggle checked={saveHistory} onChange={onSaveHistoryChange} />
      </div>

      <div className="flex items-center justify-between px-1">
        <div>
          <p className="text-sm text-white">Context Awareness</p>
          <p className="text-[11px] text-[#52525b]">Use surrounding text to improve accuracy</p>
        </div>
        <Toggle checked={contextAwareness} onChange={onContextAwarenessChange} />
      </div>
    </div>
  );
}
