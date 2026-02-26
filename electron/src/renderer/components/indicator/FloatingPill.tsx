import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { DictationState } from "../../lib/types";

const BAR_COUNT = 7;

const stateConfig = {
  idle: {
    pill: { width: 48, height: 12, borderRadius: 6 },
    bar: { width: 2.5, gap: 4 },
    color: "rgba(161,161,170,0.4)",
    background: "rgba(255,255,255,0.08)",
    glow: "none",
    keyframes: [
      [3], [3], [3], [3], [3], [3], [3],
    ],
    duration: 0,
    staggers: [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9],
  },
  recording: {
    pill: { width: 72, height: 30, borderRadius: 15 },
    bar: { width: 3, gap: 6 },
    color: "rgba(255,255,255,0.95)",
    background: "rgba(255,255,255,0.15)",
    glow: "none",
    keyframes: [
      [3, 10, 5, 14, 7, 3],
      [3, 8, 14, 6, 10, 3],
      [3, 14, 8, 16, 5, 3],
      [3, 6, 16, 8, 14, 3],
      [3, 12, 6, 14, 8, 3],
      [3, 7, 12, 5, 16, 3],
      [3, 9, 6, 11, 4, 3],
    ],
    duration: 0.8,
    staggers: [0, 0, 0, 0, 0, 0, 0],
  },
  transcribing: {
    pill: { width: 60, height: 26, borderRadius: 13 },
    bar: { width: 2.5, gap: 5 },
    color: "rgba(147,197,253,0.7)",
    background: "rgba(148,163,184,0.12)",
    glow: "none",
    keyframes: [
      [4, 7, 12, 7, 4],
      [4, 8, 11, 8, 4],
      [4, 7, 12, 7, 4],
      [4, 9, 12, 9, 4],
      [4, 7, 12, 7, 4],
      [4, 8, 11, 8, 4],
      [4, 7, 12, 7, 4],
    ],
    duration: 1.5,
    staggers: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6],
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
          gap: config.bar.gap,
        }}
        transition={{
          type: "tween",
          duration: 0.25,
          ease: "easeOut",
        }}
        style={{
          background: config.background,
          boxShadow: config.glow,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
      >
        {Array.from({ length: BAR_COUNT }).map((_, i) => (
          <motion.div
            key={i}
            animate={{
              height: config.keyframes[i],
              width: config.bar.width,
            }}
            transition={{
              height: {
                repeat: Infinity,
                repeatType: "loop",
                duration: config.duration,
                ease: "easeInOut",
                delay: config.staggers[i],
              },
              width: {
                type: "tween",
                duration: 0.25,
                ease: "easeOut",
              },
            }}
            style={{
              borderRadius: config.bar.width / 2,
              backgroundColor: config.color,
            }}
          />
        ))}
      </motion.div>
    </div>
  );
}
