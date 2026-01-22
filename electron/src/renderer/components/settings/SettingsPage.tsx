import { motion } from "framer-motion";
import { useSettings } from "../../hooks/useSettings";
import { HotkeyConfig } from "./HotkeyConfig";
import { ModelSelector } from "./ModelSelector";
import { LanguageSelector } from "./LanguageSelector";
import { CustomDictionary } from "./CustomDictionary";
import { VoiceSnippets } from "./VoiceSnippets";
import { AudioDeviceSelector } from "./AudioDeviceSelector";
import { PrivacySettings } from "./PrivacySettings";
import { Wand2, Loader2 } from "lucide-react";

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

function Section({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="bg-[#0f0f11] border border-[#1f1f23] rounded-lg p-5"
    >
      {children}
    </motion.div>
  );
}

export function SettingsPage() {
  const { settings, loading, updateSettings } = useSettings();

  if (loading || !settings) {
    return (
      <div className="flex items-center gap-2 text-[#52525b] py-12 justify-center">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading settings...
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-white tracking-tight mb-1">Settings</h2>
      <p className="text-xs text-[#52525b] mb-5">Configure your dictation experience</p>

      <div className="space-y-4 max-w-2xl">
        <Section delay={0}>
          <HotkeyConfig
            hotkey={settings.hotkey}
            onChange={(hotkey) => updateSettings({ hotkey })}
          />
        </Section>

        <Section delay={0.05}>
          <ModelSelector
            modelSize={settings.model_size}
            onChange={(model_size) => updateSettings({ model_size })}
          />
        </Section>

        <Section delay={0.1}>
          <LanguageSelector
            language={settings.language}
            onChange={(language) => updateSettings({ language })}
          />
        </Section>

        <Section delay={0.15}>
          <AudioDeviceSelector
            deviceId={settings.audio_device}
            onChange={(audio_device) => updateSettings({ audio_device })}
          />
        </Section>

        {/* Text Processing */}
        <Section delay={0.2}>
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-3">
              <Wand2 className="w-4 h-4 text-[#a1a1aa]" />
              <h4 className="text-xs font-medium text-[#a1a1aa] uppercase tracking-wider">Text Processing</h4>
            </div>

            <div className="flex items-center justify-between px-1">
              <div>
                <p className="text-sm text-white">Remove Filler Words</p>
                <p className="text-[11px] text-[#52525b]">Strip "um", "uh", "like", etc.</p>
              </div>
              <Toggle
                checked={settings.filler_removal}
                onChange={(v) => updateSettings({ filler_removal: v })}
              />
            </div>

            <div className="flex items-center justify-between px-1">
              <div>
                <p className="text-sm text-white">Smart Punctuation</p>
                <p className="text-[11px] text-[#52525b]">Convert spoken punctuation and auto-capitalize</p>
              </div>
              <Toggle
                checked={settings.smart_punctuation}
                onChange={(v) => updateSettings({ smart_punctuation: v })}
              />
            </div>

            <div className="flex items-center justify-between px-1">
              <div>
                <p className="text-sm text-white">Backtracking Correction</p>
                <p className="text-[11px] text-[#52525b]">"meet at 2, actually 3" outputs "meet at 3"</p>
              </div>
              <Toggle
                checked={settings.backtracking_correction}
                onChange={(v) => updateSettings({ backtracking_correction: v })}
              />
            </div>

            <div className="px-1">
              <p className="text-sm text-white mb-2">Tone</p>
              <div className="flex gap-2">
                {["neutral", "formal", "casual"].map((tone) => (
                  <button
                    key={tone}
                    onClick={() => updateSettings({ tone })}
                    className={`px-4 py-2 rounded-lg text-xs capitalize transition-all ${
                      settings.tone === tone
                        ? "bg-white/10 text-white border border-[#3f3f46]"
                        : "bg-transparent text-[#52525b] border border-[#1f1f23] hover:border-[#27272a]"
                    }`}
                  >
                    {tone}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Section>

        <Section delay={0.25}>
          <CustomDictionary
            words={settings.custom_dictionary}
            onChange={(custom_dictionary) => updateSettings({ custom_dictionary })}
          />
        </Section>

        <Section delay={0.3}>
          <VoiceSnippets
            snippets={settings.voice_snippets}
            onChange={(voice_snippets) => updateSettings({ voice_snippets })}
          />
        </Section>

        <Section delay={0.35}>
          <PrivacySettings
            saveHistory={settings.save_history}
            contextAwareness={settings.context_awareness}
            onSaveHistoryChange={(v) => updateSettings({ save_history: v })}
            onContextAwarenessChange={(v) => updateSettings({ context_awareness: v })}
          />
        </Section>
      </div>
    </div>
  );
}
