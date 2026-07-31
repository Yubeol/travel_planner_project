docker compose up -d
uv sync
winget install ffmpeg
uv add faster-whisper
uv add requests

uv run uvicorn main:app --reload