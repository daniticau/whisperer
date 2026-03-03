import time

import sounddevice as sd

_device_cache: list[dict] = []
_cache_time: float = 0
_CACHE_TTL: float = 30  # seconds


def list_input_devices(use_cache: bool = True) -> list[dict]:
    global _device_cache, _cache_time

    if use_cache and _device_cache and (time.monotonic() - _cache_time) < _CACHE_TTL:
        return _device_cache

    devices = sd.query_devices()
    result = []
    default_input = sd.default.device[0]
    for i, dev in enumerate(devices):
        if dev["max_input_channels"] > 0:
            result.append({
                "id": i,
                "name": dev["name"],
                "channels": dev["max_input_channels"],
                "sample_rate": dev["default_samplerate"],
                "is_default": i == default_input,
            })
    _device_cache = result
    _cache_time = time.monotonic()
    return result
