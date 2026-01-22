import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { DictationState } from "../../lib/types";

const BAR_COUNT = 5;

const stateConfig = {
  idle: {
    pill: { width: 32, height: 10, borderRadius: 5 },
    bar: { width: 2, gap: 2 },
    color: "rgba(161,161,170,0.4)",
    background: "rgba(255,255,255,0.08)",
    glow: "none",
    keyframes: [
      [2, 4, 2],
      [2, 4, 2],
      [2, 4, 2],
      [2, 4, 2],
      [2, 4, 2],
    ],
    duration: 3,
    staggers: [0, 0.2, 0.4, 0.6, 0.8],
  },
  recording: {
    pill: { width: 56, height: 22, borderRadius: 11 },
    bar: { width: 3, gap: 3 },
    color: "rgba(255,255,255,0.95)",
    background: "rgba(255,255,255,0.15)",
    glow: "0 0 12px rgba(255,255,255,0.2), 0 0 24px rgba(255,255,255,0.08)",
    keyframes: [
      [3, 10, 5, 14, 7, 3],
      [3, 8, 14, 6, 10, 3],
      [3, 14, 8, 12, 5, 3],
      [3, 6, 12, 8, 14, 3],
      [3, 9, 6, 11, 4, 3],
    ],
    duration: 0.8,
    staggers: [0, 0, 0, 0, 0],
  },
  transcribing: {
    pill: { width: 48, height: 18, borderRadius: 9 },
    bar: { width: 2.5, gap: 3 },
    color: "rgba(147,197,253,0.7)",
    background: "rgba(148,163,184,0.12)",
    glow: "0 0 8px rgba(147,197,253,0.15)",
    keyframes: [
      [4, 10, 4],
      [4, 10, 4],
      [4, 10, 4],
      [4, 10, 4],
      [4, 10, 4],
    ],
    duration: 1.2,
    staggers: [0, 0.15, 0.3, 0.45, 0.6],
  },
} as const;

export function FloatingPill() {
  const [state, setState] = useState<DictationState>("idle");

  useEffect(() => {
    const api = window.electronAPI;
    if (!api) return;

    const unsub = api.onDictationState((s: string) => {
      setState(s as DictationState);
    });

    return () => {
      unsub();
    };
  }, []);

  const config = stateConfig[state];

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <motion.div
        animate={{
          width: config.pill.width,
          height: config.pill.height,
          borderRadius: config.pill.borderRadius,
          opacity: state === "idle" ? 0.6 : 1,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 25,
        }}
        style={{
          background: config.background,
          boxShadow: config.glow,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: config.bar.gap,
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
      >
        {Array.from({ length: BAR_COUNT }).map((_, i) => (
          <motion.div
            key={i}
            animate={{
              height: config.keyframes[i],
            }}
            transition={{
              height: {
                repeat: Infinity,
                repeatType: "loop",
                duration: config.duration,
                ease: "easeInOut",
                delay: config.staggers[i],
              },
            }}
            style={{
              width: config.bar.width,
              borderRadius: config.bar.width / 2,
              backgroundColor: config.color,
            }}
          />
        ))}
      </motion.div>
    </div>
  );
}
