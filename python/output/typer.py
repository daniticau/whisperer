import time

import pyautogui
import pyperclip


def type_text(text: str):
    if not text:
        return
    time.sleep(0.1)
    pyperclip.copy(text)
    pyautogui.hotkey("ctrl", "v")
