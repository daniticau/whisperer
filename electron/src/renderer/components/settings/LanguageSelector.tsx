import { Globe } from "lucide-react";

interface LanguageSelectorProps {
  language: string;
  onChange: (lang: string) => void;
}

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "it", label: "Italian" },
  { code: "pt", label: "Portuguese" },
  { code: "nl", label: "Dutch" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
  { code: "zh", label: "Chinese" },
  { code: "ar", label: "Arabic" },
  { code: "hi", label: "Hindi" },
  { code: "ru", label: "Russian" },
  { code: "pl", label: "Polish" },
  { code: "tr", label: "Turkish" },
  { code: "sv", label: "Swedish" },
];

export function LanguageSelector({ language, onChange }: LanguageSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Globe className="w-4 h-4 text-[#a1a1aa]" />
        <div>
          <h4 className="text-xs font-medium text-[#a1a1aa] uppercase tracking-wider">Language</h4>
          <p className="text-[11px] text-[#52525b]">Primary dictation language</p>
        </div>
      </div>
      <select
        value={language}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 bg-[#09090b] border border-[#1f1f23] rounded-lg text-sm text-white focus:outline-none focus:border-[#3b82f6] transition-colors appearance-none cursor-pointer"
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.label}
          </option>
        ))}
      </select>
    </div>
  );
}
