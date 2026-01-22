# Voice Dictation

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

- Python 3.10+
- Node.js 18+
- CUDA toolkit (optional, for GPU acceleration)

## Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/voice_dictation.git
cd voice_dictation

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

## Architecture

Three processes work together:

1. **Electron Main** (`electron/src/main/`) -- window management, system tray, IPC bridge. Spawns the Python backend as a child process.
2. **React Renderer** (`electron/src/renderer/`) -- Zustand state management, Tailwind CSS, two windows (dashboard + floating indicator pill).
3. **Python Backend** (`python/`) -- FastAPI server with REST + WebSocket endpoints. Handles audio capture (sounddevice), transcription (faster-whisper), hotkey listening (pynput), and text output (pyautogui).

**Startup flow:** Electron creates windows, spawns `python -m python --port 0`, Python prints `SERVER_READY:PORT=<num>` to stdout, Electron connects via WebSocket with auto-reconnect.

**Data storage:** Config at `~/.voice_dictation/config.json`, history at `~/.voice_dictation/history.db`.

## License

MIT -- see [LICENSE](LICENSE) for details.
