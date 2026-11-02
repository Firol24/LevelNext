#!/usr/bin/env python3
"""Find the newest public TikTok post for @tu_firol and publish its ID for the embed player."""
import json
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PROFILE = "https://www.tiktok.com/@tu_firol"

def main():
    command = [
        sys.executable, "-m", "yt_dlp",
        "--flat-playlist", "--playlist-end", "1",
        "--dump-single-json", "--no-warnings",
        PROFILE,
    ]
    raw = subprocess.check_output(command, text=True, stderr=subprocess.STDOUT, timeout=180)
    payload = json.loads(raw)
    entries = payload.get("entries") or []
    video = next((entry for entry in entries if entry and entry.get("id")), None)
    if video is None and payload.get("id"):
        video = payload
    if video is None:
        raise RuntimeError("Nie znaleziono publicznego filmu na profilu TikTok @tu_firol.")

    video_id = str(video.get("id", ""))
    if not re.fullmatch(r"\\d{15,25}", video_id):
        raise RuntimeError(f"Nieprawidłowe ID najnowszego TikToka: {video_id!r}")

    result = {
        "videoId": video_id,
        "title": video.get("title") or video.get("description") or "Najnowszy klip @tu_firol",
        "url": f"https://www.tiktok.com/@tu_firol/video/{video_id}",
        "updatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    }
    output = ROOT / "data" / "latest_tiktok.json"
    output.parent.mkdir(exist_ok=True)
    output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\\n", encoding="utf-8")
    print(f"Latest TikTok: {result['url']}")

if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"TikTok update failed: {error}", file=sys.stderr)
        raise
