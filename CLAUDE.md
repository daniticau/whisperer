# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Voice Dictation — a desktop app for recording and transcribing voice to text using faster-whisper. Electron + React frontend, FastAPI Python backend running as a sidecar process.

## Build & Run Commands

```bash
# All electron commands run from electron/
cd electron

npm run dev              # Dev mode (main + renderer concurrently)
npm run dev:main         # TypeScript watch for main process only
npm run dev:renderer     # Vite dev server on :5173 only
npm run build            # Build main (tsc) + renderer (vite)
npm start                # Build then launch electron
npm run electron         # Launch electron (assumes already built)

# Python backend (from repo root)
pip install -r requirements.txt
python -m python --port 0   # Starts on random free port
```

There are no tests or linting commands configured.

## Architecture

### Three Processes

1. **Electron Main** (`electron/src/main/`) — Window management, system tray, IPC. Spawns Python as a child process and bridges communication.
2. **Renderer** (`electron/src/renderer/`) — React + Zustand + Tailwind. Two windows: main dashboard and a floating indicator pill.
3. **Python Backend** (`python/`) — FastAPI server with REST + WebSocket. Handles audio capture, whisper transcription, hotkey listening, and text output.

### Startup Flow

Electron main → creates windows → spawns `python -m python --port 0` → Python prints `SERVER_READY:PORT=<num>` to stdout → main process connects WebSocket via `IpcBridge` → app ready.

### Communication

- **Preload script** (`src/preload/index.ts`) exposes `window.electronAPI` with context isolation
- **IPC handlers** in main process proxy requests to Python's REST API (settings, history, stats, devices)
- **WebSocket** for real-time bidirectional updates (dictation state changes, transcription results, model loading progress, errors)
- `IpcBridge` auto-reconnects with exponential backoff (100ms → 5s)

### Recording Flow

Hotkey press → Python `HotkeyListener` → `AudioCapture` records → release → `FasterWhisperEngine` transcribes → `PostProcessor` applies filters → text typed via pyautogui clipboard paste → result saved to SQLite history → WebSocket broadcasts to renderer.

### Renderer Patterns

- **Zustand stores**: `dictationStore` (recording state, results), `settingsStore` (config cache)
- **Custom hooks**: `useDictation`, `useSettings`, `useHistory`, `useStats` — abstract API calls
- **Pages**: Dashboard, History, Settings — navigated via sidebar (Ctrl+1/2/3)
- **Framer Motion** for transitions, **react-window** for virtualized history list, **Recharts** for usage charts

### Python Backend Structure

- `server.py` — FastAPI app, all REST + WebSocket endpoints
- `audio/capture.py` — sounddevice recording
- `transcription/faster_whisper_engine.py` — model loading + inference
- `transcription/post_processor.py` — filler removal, smart punctuation, backtracking correction, custom dictionary
- `hotkeys/listener.py` — pynput keyboard listener
- `history/database.py` — SQLite with FTS5 full-text search
- `output/typer.py` — clipboard paste via pyautogui
- `config.py` — settings persisted to `~/.voice_dictation/config.json`

### Data Storage

- Config: `~/.voice_dictation/config.json`
- History: `~/.voice_dictation/history.db` (SQLite with `transcriptions` table + `transcriptions_fts` FTS5 virtual table)

## Key Implementation Details

- Single instance lock via `requestSingleInstanceLock`
- Close button minimizes to system tray instead of quitting
- Model loading happens in a background thread on startup (doesn't block API)
- GPU auto-detection: checks CUDA availability and VRAM to decide device + compute type
- Two HTML entry points in Vite: `index.html` (dashboard) and `indicator.html` (floating pill)
- Main process TypeScript compiles to CommonJS; renderer is ES modules bundled by Vite
