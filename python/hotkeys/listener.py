import threading
from typing import Callable, Optional

from pynput import keyboard

# Map config string names to pynput keys
KEY_MAP = {
    "f1": keyboard.Key.f1, "f2": keyboard.Key.f2, "f3": keyboard.Key.f3,
    "f4": keyboard.Key.f4, "f5": keyboard.Key.f5, "f6": keyboard.Key.f6,
    "f7": keyboard.Key.f7, "f8": keyboard.Key.f8, "f9": keyboard.Key.f9,
    "f10": keyboard.Key.f10, "f11": keyboard.Key.f11, "f12": keyboard.Key.f12,
    "scroll_lock": keyboard.Key.scroll_lock,
    "pause": keyboard.Key.pause,
    "insert": keyboard.Key.insert,
}


class HotkeyListener:
    def __init__(self, hotkey_name: str, on_press: Callable, on_release: Callable,
                 on_exit: Optional[Callable] = None):
        self.hotkey = KEY_MAP.get(hotkey_name.lower(), keyboard.Key.f4)
        self.hotkey_name = hotkey_name
        self.on_press_cb = on_press
        self.on_release_cb = on_release
        self.on_exit_cb = on_exit
        self.listener: Optional[keyboard.Listener] = None
        self._running = False

    def _on_press(self, key):
        if key == self.hotkey:
            self.on_press_cb()

    def _on_release(self, key):
        if key == self.hotkey:
            self.on_release_cb()
        elif key == keyboard.Key.esc:
            if self.on_exit_cb:
                self.on_exit_cb()
            return False

    def start(self):
        self._running = True
        self.listener = keyboard.Listener(
            on_press=self._on_press,
            on_release=self._on_release,
        )
        self.listener.start()

    def stop(self):
        self._running = False
        if self.listener:
            self.listener.stop()

    def update_hotkey(self, hotkey_name: str):
        self.hotkey_name = hotkey_name
        self.hotkey = KEY_MAP.get(hotkey_name.lower(), keyboard.Key.f4)

    def is_alive(self) -> bool:
        return self.listener is not None and self.listener.is_alive()
