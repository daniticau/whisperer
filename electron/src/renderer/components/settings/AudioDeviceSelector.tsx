import { useState, useEffect } from "react";
import { Mic } from "lucide-react";
import type { AudioDevice } from "../../lib/types";

interface AudioDeviceSelectorProps {
  deviceId: number | null;
  onChange: (id: number | null) => void;
}

export function AudioDeviceSelector({ deviceId, onChange }: AudioDeviceSelectorProps) {
  const [devices, setDevices] = useState<AudioDevice[]>([]);

  useEffect(() => {
    const api = window.electronAPI;
    if (api) {
      api.getDevices().then(setDevices);
    }
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Mic className="w-4 h-4 text-[#a1a1aa]" />
        <div>
          <h4 className="text-xs font-medium text-[#a1a1aa] uppercase tracking-wider">Audio Input Device</h4>
          <p className="text-[11px] text-[#52525b]">Microphone used for recording</p>
        </div>
      </div>
      <select
        value={deviceId ?? ""}
        onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : null)}
        className="w-full px-3 py-2.5 bg-[#09090b] border border-[#1f1f23] rounded-lg text-sm text-white focus:outline-none focus:border-[#3b82f6] transition-colors appearance-none cursor-pointer"
      >
        <option value="">System Default</option>
        {devices.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name} {d.is_default ? "(Default)" : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
