import time

import pyautogui
import pyperclip

from .focus import restore_foreground_window


def type_text(text: str, target_hwnd=None):
    if not text:
        return
    restore_foreground_window(target_hwnd)
    time.sleep(0.1)
    pyperclip.copy(text)
    pyautogui.hotkey("ctrl", "v")
