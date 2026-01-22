from abc import ABC, abstractmethod

import numpy as np


class TranscriptionEngine(ABC):
    @abstractmethod
    def load(self, progress_callback=None) -> None:
        pass

    @abstractmethod
    def transcribe(self, audio: np.ndarray) -> str:
        pass

    @abstractmethod
    def is_loaded(self) -> bool:
        pass
