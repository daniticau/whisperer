import { useState } from "react";
import { BookOpen, Plus, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CustomDictionaryProps {
  words: string[];
  onChange: (words: string[]) => void;
}

export function CustomDictionary({ words, onChange }: CustomDictionaryProps) {
  const [input, setInput] = useState("");

  const addWord = () => {
    const word = input.trim();
    if (word && !words.includes(word)) {
      onChange([...words, word]);
      setInput("");
    }
  };

  const removeWord = (word: string) => {
    onChange(words.filter((w) => w !== word));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <BookOpen className="w-4 h-4 text-[#a1a1aa]" />
        <div>
          <h4 className="text-xs font-medium text-[#a1a1aa] uppercase tracking-wider">Custom Dictionary</h4>
          <p className="text-[11px] text-[#52525b]">Add words to improve recognition accuracy</p>
        </div>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addWord()}
          placeholder="Add a word or phrase..."
          className="flex-1 px-3 py-2 bg-[#09090b] border border-[#1f1f23] rounded-lg text-sm text-white placeholder:text-[#3f3f46] focus:outline-none focus:border-[#3b82f6] transition-colors"
        />
        <button
          onClick={addWord}
          disabled={!input.trim()}
          className="px-3 py-2 bg-[#1c1c1f] text-[#a1a1aa] hover:text-white border border-[#1f1f23] rounded-lg hover:border-[#27272a] disabled:opacity-30 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <AnimatePresence>
          {words.map((word) => (
            <motion.span
              key={word}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#1c1c1f] border border-[#1f1f23] rounded-lg text-xs text-[#a1a1aa]"
            >
              {word}
              <button
                onClick={() => removeWord(word)}
                className="text-[#52525b] hover:text-[#ef4444] transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </motion.span>
          ))}
        </AnimatePresence>
        {words.length === 0 && (
          <span className="text-xs text-[#52525b]">No custom words added</span>
        )}
      </div>
    </div>
  );
}
