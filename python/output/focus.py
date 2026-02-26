import sys

if sys.platform == "win32":
    import ctypes
    import ctypes.wintypes

    user32 = ctypes.windll.user32
    kernel32 = ctypes.windll.kernel32

    def get_foreground_window():
        """Return the HWND of the current foreground window."""
        return user32.GetForegroundWindow()

    def restore_foreground_window(hwnd):
        """Reliably restore focus to the given HWND.

        Uses the AttachThreadInput trick to work around Windows restrictions
        on SetForegroundWindow from background threads.
        """
        if not hwnd:
            return

        current_thread = kernel32.GetCurrentThreadId()
        foreground_hwnd = user32.GetForegroundWindow()
        foreground_thread = user32.GetWindowThreadProcessId(foreground_hwnd, None)

        if current_thread != foreground_thread:
            user32.AttachThreadInput(current_thread, foreground_thread, True)

        # Send a brief Alt keypress to satisfy SetForegroundWindow's requirements
        user32.keybd_event(0x12, 0, 0, 0)  # Alt down
        user32.keybd_event(0x12, 0, 2, 0)  # Alt up
        user32.SetForegroundWindow(hwnd)

        if current_thread != foreground_thread:
            user32.AttachThreadInput(current_thread, foreground_thread, False)

else:

    def get_foreground_window():
        return None

    def restore_foreground_window(hwnd):
        pass
