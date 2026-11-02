#!/usr/bin/env python3
"""Resolve a YouTube @handle and publish its newest public upload using YouTube's free Atom feed."""
import json
import re
import sys
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HANDLE_URL = "https://www.youtube.com/@tufirol9695"
HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; LEVEL-NEXT/1.0)"}

def fetch(url):
    request = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(request, timeout=30) as response:
        return response.read(5_000_000)

def local(tag):
    return tag.rsplit("}", 1)[-1]

def main():
    page = fetch(HANDLE_URL).decode("utf-8", "replace")
    matches = re.findall(r'"(?:channelId|externalId)":"(UC[A-Za-z0-9_-]{22})"', page)
    if not matches:
        matches = re.findall(r'/channel/(UC[A-Za-z0-9_-]{22})', page)
    if not matches:
        raise RuntimeError("Nie udało się odczytać ID kanału z publicznej strony YouTube.")
    channel_id = matches[0]

    feed_url = f"https://www.youtube.com/feeds/videos.xml?channel_id={channel_id}"
    root = ET.fromstring(fetch(feed_url))
    entries = [node for node in root if local(node.tag) == "entry"]
    if not entries:
        raise RuntimeError("Kanałowy RSS YouTube nie zawiera żadnych filmów.")

    entry = entries[0]
    fields = {}
    for node in entry:
        fields[local(node.tag)] = (node.text or "").strip()
    video_id = fields.get("videoId", "")
    title = fields.get("title", "")
    if not video_id:
        raise RuntimeError("Najnowszy wpis RSS nie zawiera ID filmu.")

    result = {
        "channelId": channel_id,
        "videoId": video_id,
        "title": title,
        "publishedAt": fields.get("published", ""),
        "url": f"https://www.youtube.com/watch?v={video_id}",
        "updatedAt": __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat(timespec="seconds")
    }
    output = ROOT / "data" / "latest_video.json"
    output.parent.mkdir(exist_ok=True)
    output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Latest video: {title} ({video_id})")

if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"YouTube update failed: {error}", file=sys.stderr)
        raise
