import re


FILLER_PATTERN = re.compile(
    r'\b(um|uh|er|ah|hmm|hm|uh huh|you know|I mean|like,?\s(?=like)|'
    r'basically|literally|actually,?\s(?=actually)|sort of|kind of)\b',
    re.IGNORECASE,
)

SPOKEN_PUNCTUATION = {
    "period": ".",
    "full stop": ".",
    "comma": ",",
    "question mark": "?",
    "exclamation point": "!",
    "exclamation mark": "!",
    "colon": ":",
    "semicolon": ";",
    "new line": "\n",
    "newline": "\n",
    "new paragraph": "\n\n",
}

BACKTRACK_TRIGGERS = re.compile(
    r',?\s*\b(actually|no wait|wait|sorry|I mean|correction|rather)\b[,.]?\s*',
    re.IGNORECASE,
)

CONTRACTIONS_EXPAND = {
    "don't": "do not", "doesn't": "does not", "didn't": "did not",
    "can't": "cannot", "couldn't": "could not", "wouldn't": "would not",
    "shouldn't": "should not", "won't": "will not", "isn't": "is not",
    "aren't": "are not", "wasn't": "was not", "weren't": "were not",
    "hasn't": "has not", "haven't": "have not", "hadn't": "had not",
    "I'm": "I am", "I've": "I have", "I'll": "I will", "I'd": "I would",
    "we're": "we are", "we've": "we have", "we'll": "we will",
    "they're": "they are", "they've": "they have", "they'll": "they will",
    "you're": "you are", "you've": "you have", "you'll": "you will",
    "it's": "it is", "that's": "that is", "there's": "there is",
    "here's": "here is", "what's": "what is", "who's": "who is",
    "let's": "let us",
}


class PostProcessor:
    def __init__(self, config: dict):
        self.config = config

    def process(self, text: str) -> str:
        if not text:
            return text

        if self.config.get("filler_removal", True):
            text = self._remove_fillers(text)

        if self.config.get("backtracking_correction", True):
            text = self._apply_backtracking(text)

        if self.config.get("smart_punctuation", True):
            text = self._smart_punctuation(text)

        tone = self.config.get("tone", "neutral")
        if tone == "formal":
            text = self._formalize(text)

        text = self._expand_snippets(text)
        text = self._clean_whitespace(text)
        return text

    def _remove_fillers(self, text: str) -> str:
        text = FILLER_PATTERN.sub("", text)
        return self._clean_whitespace(text)

    def _apply_backtracking(self, text: str) -> str:
        # Find correction triggers and replace only the last word/phrase before them
        # "meet at 2, actually 3" → "meet at 3"
        # "go to the store, no wait, the mall" → "go to the mall"
        result = text
        for match in reversed(list(BACKTRACK_TRIGGERS.finditer(result))):
            start = match.start()
            end = match.end()
            before = result[:start].rstrip(", ")
            after = result[end:].lstrip(", ")

            if not after:
                continue

            # Get the correction (first clause after trigger)
            correction = after.split(",")[0].strip()

            # Try to find what's being corrected: replace the last word/number before trigger
            words_before = before.rsplit(None, 1)
            if len(words_before) == 2:
                result = words_before[0] + " " + correction
                # Append anything after the correction clause
                remaining_after = after[len(correction):].lstrip(", ")
                if remaining_after:
                    result += " " + remaining_after
            else:
                result = correction
                remaining_after = after[len(correction):].lstrip(", ")
                if remaining_after:
                    result += " " + remaining_after

        # Remove duplicate adjacent words ("the the" -> "the")
        result = re.sub(r'\b(\w+)\s+\1\b', r'\1', result, flags=re.IGNORECASE)
        return result.strip()

    def _smart_punctuation(self, text: str) -> str:
        for spoken, punct in SPOKEN_PUNCTUATION.items():
            pattern = re.compile(r'\b' + re.escape(spoken) + r'\b', re.IGNORECASE)
            text = pattern.sub(punct, text)

        # Capitalize after sentence-ending punctuation
        text = re.sub(r'([.!?])\s+([a-z])', lambda m: m.group(1) + " " + m.group(2).upper(), text)

        # Capitalize first character
        if text and text[0].islower():
            text = text[0].upper() + text[1:]

        return text

    def _formalize(self, text: str) -> str:
        for contraction, expansion in CONTRACTIONS_EXPAND.items():
            text = re.sub(re.escape(contraction), expansion, text, flags=re.IGNORECASE)

        # Remove casual sentence starters
        text = re.sub(r'^(So|Well|Yeah|Okay|OK),?\s+', '', text)
        text = re.sub(r'(?<=[.!?]\s)(So|Well|Yeah|Okay|OK),?\s+', '', text)
        return text

    def _expand_snippets(self, text: str) -> str:
        snippets = self.config.get("voice_snippets", {})
        for trigger, expansion in snippets.items():
            pattern = re.compile(re.escape(trigger), re.IGNORECASE)
            text = pattern.sub(expansion, text)
        return text

    def _clean_whitespace(self, text: str) -> str:
        text = re.sub(r' {2,}', ' ', text)
        text = re.sub(r'\s+([,.:;!?])', r'\1', text)
        text = re.sub(r',\s*,', ',', text)
        return text.strip()
