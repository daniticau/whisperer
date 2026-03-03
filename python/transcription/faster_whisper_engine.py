import subprocess
import sys
import threading
from typing import Optional

import numpy as np
from faster_whisper import WhisperModel

from .engine import TranscriptionEngine

MODELS = {
    "base.en":        {"model_id": "base.en",   "vram_mb": 150,  "desc": "Fastest, basic accuracy"},
    "small.en":       {"model_id": "small.en",  "vram_mb": 500,  "desc": "Good balance of speed and accuracy"},
    "medium.en":      {"model_id": "medium.en", "vram_mb": 1500, "desc": "High accuracy, slower"},
    "distil-large-v3": {"model_id": "Systran/faster-distil-whisper-large-v3", "vram_mb": 1500, "desc": "Distilled — fast with near-large accuracy"},
    "large-v3":       {"model_id": "large-v3",  "vram_mb": 3000, "desc": "Best accuracy, requires GPU"},
}


def _probe_cuda_subprocess() -> bool:
    """Test CUDA in a subprocess so a native crash doesn't kill the server."""
    code = (
        "import ctranslate2; "
        "types = ctranslate2.get_supported_compute_types('cuda'); "
        "assert types; "
        "print('CUDA_OK')"
    )
    try:
        result = subprocess.run(
            [sys.executable, "-c", code],
            capture_output=True, text=True, timeout=15,
        )
        return result.returncode == 0 and "CUDA_OK" in result.stdout
    except Exception:
        return False


def _resolve_device(device: str, model_size: str) -> tuple[str, str]:
    if device == "auto":
        if _probe_cuda_subprocess():
            return "cuda", "float16"
        return "cpu", "int8"
    if device == "cuda":
        return "cuda", "float16"
    return "cpu", "int8"


class FasterWhisperEngine(TranscriptionEngine):
    def __init__(self, model_size: str = "small.en", device: str = "auto",
                 compute_type: str = "auto", language: str = "en",
                 custom_dictionary: Optional[list[str]] = None):
        self.model_size = model_size
        self.model_id = MODELS[model_size]["model_id"] if model_size in MODELS else model_size
        self.language = language
        self.custom_dictionary = custom_dictionary or []
        self.model: Optional[WhisperModel] = None

        if compute_type == "auto":
            self.device, self.compute_type = _resolve_device(device, model_size)
        else:
            self.device = device if device != "auto" else "cpu"
            self.compute_type = compute_type

    def load(self, progress_callback=None) -> None:
        print(f"Loading Whisper model '{self.model_size}' on {self.device} ({self.compute_type})...")
        if progress_callback:
            progress_callback(0.05)

        # Tick progress gradually while WhisperModel downloads/loads
        done = threading.Event()
        if progress_callback:
            def _tick():
                p = 0.08
                while not done.is_set():
                    progress_callback(p)
                    p += (0.75 - p) * 0.04
                    done.wait(0.4)
            ticker = threading.Thread(target=_tick, daemon=True)
            ticker.start()

        try:
            self.model = WhisperModel(
                self.model_id,
                device=self.device,
                compute_type=self.compute_type,
            )
        finally:
            done.set()
            if progress_callback:
                ticker.join(timeout=1)

        if progress_callback:
            progress_callback(0.85)

        # Warm up
        if progress_callback:
            progress_callback(0.9)
        dummy = np.zeros(16000, dtype=np.float32)
        list(self.model.transcribe(dummy)[0])

        if progress_callback:
            progress_callback(1.0)
        print(f"[OK] Model ready on {self.device}")

    def transcribe(self, audio: np.ndarray) -> str:
        if not self.model or len(audio) == 0:
            return ""

        kwargs = {
            "beam_size": 5,
            "language": self.language,
            "vad_filter": True,
        }
        if self.custom_dictionary:
            kwargs["hotwords"] = " ".join(self.custom_dictionary)

        segments, info = self.model.transcribe(audio, **kwargs)
        text_parts = [seg.text for seg in segments]
        return " ".join(text_parts).strip()

    def is_loaded(self) -> bool:
        return self.model is not None
