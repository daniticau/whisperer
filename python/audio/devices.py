import sounddevice as sd


def list_input_devices() -> list[dict]:
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
    return result
