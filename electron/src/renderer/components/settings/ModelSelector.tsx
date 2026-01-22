import { useState, useEffect } from "react";
import { Cpu, Loader2 } from "lucide-react";
import { useDictationStore } from "../../stores/dictationStore";
import type { ModelInfo } from "../../lib/types";

interface ModelSelectorProps {
  modelSize: string;
  onChange: (model: string) => void;
}

const MODEL_DETAILS: Record<string, { label: string; vram: string; speed: string }> = {
  "base.en":   { label: "Base (English)", vram: "~150 MB", speed: "Fastest" },
  "small.en":  { label: "Small (English)", vram: "~500 MB", speed: "Fast" },
  "medium.en": { label: "Medium (English)", vram: "~1.5 GB", speed: "Moderate" },
  "large-v3":  { label: "Large v3", vram: "~3 GB", speed: "Slow" },
};

export function ModelSelector({ modelSize, onChange }: ModelSelectorProps) {
  const modelLoading = useDictationStore((s) => s.modelLoading);

  const handleChange = async (model: string) => {
    onChange(model);
    const api = window.electronAPI;
    if (api) await api.reloadModel();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Cpu className="w-4 h-4 text-[#a1a1aa]" />
        <div>
          <h4 className="text-xs font-medium text-[#a1a1aa] uppercase tracking-wider">Transcription Model</h4>
          <p className="text-[11px] text-[#52525b]">Larger models are more accurate but slower</p>
        </div>
      </div>

      <div className="space-y-1.5">
        {Object.entries(MODEL_DETAILS).map(([key, info]) => (
          <button
            key={key}
            onClick={() => handleChange(key)}
            disabled={modelLoading !== null}
            className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
              modelSize === key
                ? "border-[#3b82f6] bg-[#0f0f11]"
                : "border-[#1f1f23] hover:border-[#27272a] bg-[#0f0f11]"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-white">{info.label}</span>
                {modelSize === key && modelLoading !== null && (
                  <Loader2 className="inline w-3 h-3 ml-2 text-[#3b82f6] animate-spin" />
                )}
              </div>
              <div className="flex gap-3 font-mono text-[10px] text-[#52525b]">
                <span>{info.vram} VRAM</span>
                <span>{info.speed}</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {modelLoading !== null && (
        <div className="w-full bg-[#1f1f23] rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-300"
            style={{ width: `${modelLoading * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}
