# Whisperer

A desktop app for recording and transcribing speech to text using faster-whisper. All processing happens locally on your machine.

## Features

- **Hold-to-record hotkey** -- hold a configurable key to record, release to transcribe and type
- **Local transcription** with faster-whisper (no cloud APIs, no data leaves your machine)
- **GPU auto-detection** -- automatically uses CUDA when available, falls back to CPU
- **Floating indicator pill** -- minimal overlay shows recording/transcribing state
- **Searchable history** -- SQLite with FTS5 full-text search across all transcriptions
- **Post-processing pipeline** -- filler word removal, smart punctuation, backtracking correction, custom dictionary support
- **System tray integration** -- runs in background, always accessible

## Prerequisites

- Python 3.10+ (3.11 or 3.12 recommended)
- Node.js 18+
- NVIDIA GPU + CUDA toolkit (optional, for GPU acceleration -- CPU works but is much slower)
- On Linux: PortAudio (`sudo apt install libportaudio2`)

## Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/whisperer.git
cd whisperer

# Install Python dependencies
pip install -r requirements.txt

# Install Electron/Node dependencies
cd electron
npm install
```

## Usage

```bash
# Start the app (builds and launches Electron, which spawns Python backend)
cd electron
npm start

# Or for development with hot reload
npm run dev
```

The app starts in the system tray. Hold the configured hotkey (default: Right Ctrl) to record, then release to transcribe. The transcribed text is automatically typed at your cursor position.

Use Ctrl+1/2/3 to navigate between Dashboard, History, and Settings.

## Notes

- **First run downloads the whisper model** -- this takes a minute or two depending on your connection. Progress is shown in the dashboard.
- **GPU vs CPU** -- if you have an NVIDIA GPU with CUDA installed, transcription uses it automatically. Without CUDA it falls back to CPU, which works but is noticeably slower. There's no error either way.
- **Closing the window** keeps the app running in the system tray. Click the tray icon or right-click and select "Open Dashboard" to reopen it. Right-click and select "Quit" to fully exit.

## Architecture

Three processes work together:

1. **Electron Main** (`electron/src/main/`) -- window management, system tray, IPC bridge. Spawns the Python backend as a child process.
2. **React Renderer** (`electron/src/renderer/`) -- Zustand state management, Tailwind CSS, two windows (dashboard + floating indicator pill).
3. **Python Backend** (`python/`) -- FastAPI server with REST + WebSocket endpoints. Handles audio capture (sounddevice), transcription (faster-whisper), hotkey listening (pynput), and text output (pyautogui).

**Startup flow:** Electron creates windows, spawns `python -m python --port 0`, Python prints `SERVER_READY:PORT=<num>` to stdout, Electron connects via WebSocket with auto-reconnect.

**Data storage:** Config at `~/.whisperer/config.json`, history at `~/.whisperer/history.db`.

## License

MIT -- see [LICENSE](LICENSE) for details.
