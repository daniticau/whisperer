import threading
from typing import Optional

import numpy as np
import sounddevice as sd


class AudioCapture:
    def __init__(self, sample_rate: int = 16000, channels: int = 1, device_id: Optional[int] = None):
        self.sample_rate = sample_rate
        self.channels = channels
        self.device_id = device_id
        self.is_recording = False
        self.audio_buffer: list[np.ndarray] = []
        self.lock = threading.Lock()
        self.stream: Optional[sd.InputStream] = None

    def _audio_callback(self, indata: np.ndarray, frames: int, time_info, status: sd.CallbackFlags):
        if status:
            import sys
            print(f"Audio status: {status}", file=sys.stderr)
        with self.lock:
            if self.is_recording:
                self.audio_buffer.append(indata.copy())

    def start_recording(self):
        with self.lock:
            if self.is_recording:
                return
            self.is_recording = True
            self.audio_buffer = []

        self.stream = sd.InputStream(
            samplerate=self.sample_rate,
            channels=self.channels,
            dtype=np.float32,
            device=self.device_id,
            callback=self._audio_callback,
        )
        self.stream.start()

    def stop_recording(self) -> np.ndarray:
        if self.stream:
            self.stream.stop()
            self.stream.close()
            self.stream = None

        with self.lock:
            self.is_recording = False
            if self.audio_buffer:
                audio = np.concatenate(self.audio_buffer, axis=0)
                self.audio_buffer = []
                return audio.flatten().astype(np.float32)
            return np.array([], dtype=np.float32)

    def cleanup(self):
        if self.stream:
            try:
                self.stream.stop()
                self.stream.close()
            except Exception:
                pass
            self.stream = None
        with self.lock:
            self.is_recording = False
            self.audio_buffer = []
