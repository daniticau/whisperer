import asyncio
import json
import sys
import time
import threading
import signal
import socket
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional

import numpy as np
import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.responses import JSONResponse

from .config import load_config, save_config, update_config
from .audio.capture import AudioCapture
from .audio.devices import list_input_devices
from .transcription.faster_whisper_engine import FasterWhisperEngine, MODELS
from .transcription.post_processor import PostProcessor
from .hotkeys.listener import HotkeyListener
from .history.database import HistoryDatabase
from .history.migration import migrate_jsonl_to_sqlite
from .output.typer import type_text


class DictationApp:
    def __init__(self):
        self.config = load_config()
        self.engine: Optional[FasterWhisperEngine] = None
        self.processor: Optional[PostProcessor] = None
        self.capture: Optional[AudioCapture] = None
        self.hotkey_listener: Optional[HotkeyListener] = None
        self.db = HistoryDatabase()
        self.ws_connections: list[WebSocket] = []
        self.recording_start_time: Optional[float] = None
        self._loop: Optional[asyncio.AbstractEventLoop] = None

        # Migrate old JSONL history if it exists
        jsonl_path = Path(__file__).parent.parent / "dictation_history.jsonl"
        if jsonl_path.exists():
            migrate_jsonl_to_sqlite(jsonl_path, self.db)

    def init_engine(self):
        self.engine = FasterWhisperEngine(
            model_size=self.config.get("model_size", "small.en"),
            device=self.config.get("device", "auto"),
            compute_type=self.config.get("compute_type", "auto"),
            language=self.config.get("language", "en"),
            custom_dictionary=self.config.get("custom_dictionary", []),
        )
        self.engine.load(progress_callback=self._on_model_progress)

    def init_processor(self):
        self.processor = PostProcessor(self.config)

    def init_capture(self):
        device_id = self.config.get("audio_device")
        self.capture = AudioCapture(
            sample_rate=self.config.get("sample_rate", 16000),
            channels=self.config.get("channels", 1),
            device_id=device_id,
        )

    def init_hotkeys(self):
        self.hotkey_listener = HotkeyListener(
            hotkey_name=self.config.get("hotkey", "f4"),
            on_press=self._on_hotkey_press,
            on_release=self._on_hotkey_release,
        )
        self.hotkey_listener.start()

    def _on_model_progress(self, progress: float):
        self._broadcast_sync({"type": "model_loading", "progress": progress})

    def _on_hotkey_press(self):
        if self.capture and not self.capture.is_recording:
            self.capture.start_recording()
            self.recording_start_time = time.time()
            self._broadcast_sync({"type": "state_change", "state": "recording"})

    def _on_hotkey_release(self):
        if self.capture and self.capture.is_recording:
            audio = self.capture.stop_recording()
            duration = time.time() - self.recording_start_time if self.recording_start_time else 0
            self.recording_start_time = None
            self._broadcast_sync({"type": "state_change", "state": "transcribing"})

            # Transcribe in background thread
            thread = threading.Thread(
                target=self._transcribe_and_output,
                args=(audio, duration),
                daemon=True,
            )
            thread.start()

    def _transcribe_and_output(self, audio: np.ndarray, duration: float):
        try:
            if len(audio) == 0 or not self.engine:
                self._broadcast_sync({"type": "state_change", "state": "idle"})
                return

            text = self.engine.transcribe(audio)
            if text and self.processor:
                text = self.processor.process(text)

            if text:
                type_text(text)

                if self.config.get("save_history", True):
                    self.db.log(
                        text=text,
                        duration_seconds=duration,
                        model_used=self.config.get("model_size", "small.en"),
                        language=self.config.get("language", "en"),
                    )

                self._broadcast_sync({
                    "type": "transcription_result",
                    "text": text,
                    "duration": round(duration, 2),
                    "word_count": len(text.split()),
                })
        except Exception as e:
            self._broadcast_sync({"type": "error", "message": str(e)})
        finally:
            self._broadcast_sync({"type": "state_change", "state": "idle"})

    def _broadcast_sync(self, message: dict):
        if self._loop and self.ws_connections:
            asyncio.run_coroutine_threadsafe(self._broadcast(message), self._loop)

    async def _broadcast(self, message: dict):
        dead = []
        for ws in self.ws_connections:
            try:
                await ws.send_json(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.ws_connections.remove(ws)

    def cleanup(self):
        if self.hotkey_listener:
            self.hotkey_listener.stop()
        if self.capture:
            self.capture.cleanup()


app_state = DictationApp()


@asynccontextmanager
async def lifespan(app: FastAPI):
    app_state._loop = asyncio.get_event_loop()

    # Init in background thread to not block startup
    def init():
        app_state.init_engine()
        app_state.init_processor()
        app_state.init_capture()
        app_state.init_hotkeys()
        app_state._broadcast_sync({"type": "state_change", "state": "idle"})
        print("SERVER_INIT_COMPLETE", flush=True)

    threading.Thread(target=init, daemon=True).start()
    yield
    app_state.cleanup()


app = FastAPI(lifespan=lifespan)


# === WebSocket ===

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    app_state.ws_connections.append(websocket)
    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")

            if msg_type == "update_settings":
                settings = data.get("settings", {})
                app_state.config = update_config(settings)
                app_state.processor = PostProcessor(app_state.config)
                await websocket.send_json({"type": "settings_updated", "settings": app_state.config})

            elif msg_type == "reload_model":
                def reload():
                    app_state.init_engine()
                    app_state._broadcast_sync({"type": "model_loaded"})
                threading.Thread(target=reload, daemon=True).start()

            elif msg_type == "start_recording":
                app_state._on_hotkey_press()

            elif msg_type == "stop_recording":
                app_state._on_hotkey_release()

    except WebSocketDisconnect:
        app_state.ws_connections.remove(websocket)
    except Exception:
        if websocket in app_state.ws_connections:
            app_state.ws_connections.remove(websocket)


# === REST endpoints ===

@app.get("/api/settings")
async def get_settings():
    return app_state.config


@app.put("/api/settings")
async def put_settings(settings: dict):
    app_state.config = update_config(settings)
    app_state.processor = PostProcessor(app_state.config)

    # Update hotkey if changed
    if "hotkey" in settings and app_state.hotkey_listener:
        app_state.hotkey_listener.update_hotkey(settings["hotkey"])

    return app_state.config


@app.get("/api/history")
async def get_history(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    search: str = Query(""),
    sort: str = Query("desc"),
    date_from: str = Query(""),
    date_to: str = Query(""),
):
    return app_state.db.get_history(page, limit, search, sort, date_from, date_to)


@app.get("/api/stats")
async def get_stats():
    return app_state.db.get_stats()


@app.get("/api/stats/daily")
async def get_daily_stats(days: int = Query(30, ge=1, le=365)):
    return app_state.db.get_daily_stats(days)


@app.get("/api/devices")
async def get_devices():
    return list_input_devices()


@app.get("/api/models")
async def get_models():
    return {
        "available": MODELS,
        "current": app_state.config.get("model_size", "small.en"),
    }


@app.post("/api/model/reload")
async def reload_model():
    def reload():
        app_state.init_engine()
        app_state._broadcast_sync({"type": "model_loaded"})
    threading.Thread(target=reload, daemon=True).start()
    return {"status": "reloading"}


@app.delete("/api/history/{entry_id}")
async def delete_history_entry(entry_id: int):
    app_state.db.delete_entry(entry_id)
    return {"status": "deleted"}


def get_free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=0)
    args = parser.parse_args()

    port = args.port or get_free_port()
    print(f"SERVER_READY:PORT={port}", flush=True)

    uvicorn.run(app, host="127.0.0.1", port=port, log_level="warning")


if __name__ == "__main__":
    main()
