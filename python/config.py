import json
from pathlib import Path
from typing import Any

CONFIG_DIR = Path.home() / ".voice_dictation"
CONFIG_FILE = CONFIG_DIR / "config.json"

DEFAULT_CONFIG = {
    "hotkey": "f4",
    "model_size": "small.en",
    "language": "en",
    "device": "auto",
    "compute_type": "auto",
    "audio_device": None,
    "sample_rate": 16000,
    "channels": 1,
    "tone": "neutral",
    "filler_removal": True,
    "smart_punctuation": True,
    "backtracking_correction": True,
    "custom_dictionary": [],
    "voice_snippets": {},
    "context_awareness": False,
    "save_history": True,
    "auto_start": False,
    "theme": "dark",
    "indicator_position": None,
}


def load_config() -> dict:
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    if CONFIG_FILE.exists():
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                user_config = json.load(f)
            merged = {**DEFAULT_CONFIG, **user_config}
            return merged
        except (json.JSONDecodeError, OSError):
            pass
    save_config(DEFAULT_CONFIG)
    return dict(DEFAULT_CONFIG)


def save_config(config: dict) -> None:
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    with open(CONFIG_FILE, "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2, ensure_ascii=False)


def update_config(updates: dict[str, Any]) -> dict:
    config = load_config()
    config.update(updates)
    save_config(config)
    return config
