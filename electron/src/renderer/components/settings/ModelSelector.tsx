import { useEffect, useRef, useState } from "react";
import { Cpu, Loader2 } from "lucide-react";
import { useDictationStore } from "../../stores/dictationStore";

interface ModelSelectorProps {
  modelSize: string;
  onChange: (model: string) => void;
}

const MODEL_DETAILS: Record<string, { label: string; vram: string; speed: string }> = {
  "base.en":        { label: "Base (English)", vram: "~150 MB", speed: "Fastest" },
  "small.en":       { label: "Small (English)", vram: "~500 MB", speed: "Fast" },
  "medium.en":      { label: "Medium (English)", vram: "~1.5 GB", speed: "Moderate" },
  "distil-large-v3": { label: "Distil Large v3", vram: "~1.5 GB", speed: "Fast" },
  "large-v3":       { label: "Large v3", vram: "~3 GB", speed: "Slow" },
};

/** Smoothly interpolates between server progress values using rAF. */
function useSmoothedProgress(serverProgress: number | null): number | null {
  const [display, setDisplay] = useState<number | null>(null);
  const activeRef = useRef(false);
  const currentRef = useRef(0);
  const targetRef = useRef(0);
  const lastRenderedRef = useRef(0);
  const rafRef = useRef(0);

  useEffect(() => {
    cancelAnimationFrame(rafRef.current);

    // Not loading, wasn't loading
    if (serverProgress === null && !activeRef.current) return;

    // Just finished — fill to 100% then hide
    if (serverProgress === null && activeRef.current) {
      const fillAndHide = () => {
        const c = currentRef.current;
        if (c < 0.99) {
          currentRef.current = c + (1 - c) * 0.15;
          setDisplay(currentRef.current);
          rafRef.current = requestAnimationFrame(fillAndHide);
        } else {
          setDisplay(1);
          setTimeout(() => {
            activeRef.current = false;
            currentRef.current = 0;
            lastRenderedRef.current = 0;
            setDisplay(null);
          }, 400);
        }
      };
      rafRef.current = requestAnimationFrame(fillAndHide);
      return () => cancelAnimationFrame(rafRef.current);
    }

    // Just started
    if (!activeRef.current) {
      activeRef.current = true;
      currentRef.current = 0;
      lastRenderedRef.current = 0;
      setDisplay(0);
    }

    targetRef.current = serverProgress!;

    const tick = () => {
      const c = currentRef.current;
      const target = targetRef.current;
      const diff = target - c;

      if (diff > 0.001) {
        // Ease toward server value
        currentRef.current = c + diff * 0.06;
      } else if (c < 0.92) {
        // Creep slowly between server updates
        currentRef.current = c + (0.92 - c) * 0.001;
      }

      // Only re-render when visually different (~0.3% change)
      if (Math.abs(currentRef.current - lastRenderedRef.current) > 0.003) {
        lastRenderedRef.current = currentRef.current;
        setDisplay(currentRef.current);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [serverProgress]);

  return display;
}

export function ModelSelector({ modelSize, onChange }: ModelSelectorProps) {
  const modelLoading = useDictationStore((s) => s.modelLoading);
  const smoothProgress = useSmoothedProgress(modelLoading);

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
            disabled={modelLoading !== null && modelSize === key}
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

      {smoothProgress !== null && (
        <div className="w-full bg-[#1f1f23] rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full bg-white rounded-full"
            style={{ width: `${smoothProgress * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}
