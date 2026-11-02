#!/usr/bin/env python3
"""Build a free, RSS-only LEVEL NEXT DAILY issue (no API keys required)."""
import json
import re
import sys
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from html.parser import HTMLParser
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
WARSAW = ZoneInfo("Europe/Warsaw")
FEEDS = [
    ("GRY-Online", "https://www.gry-online.pl/rss/news.xml"),
    ("GRY-Online / Publicystyka", "https://www.gry-online.pl/rss/teksty.xml"),
    ("Gamerweb", "https://gamerweb.pl/feed/"),
]

class TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts = []
    def handle_data(self, data):
        self.parts.append(data)

def clean_html(value):
    parser = TextExtractor()
    try:
        parser.feed(value or "")
        value = " ".join(parser.parts)
    except Exception:
        pass
    return re.sub(r"\s+", " ", value or "").strip()[:700]

def local_name(tag):
    return tag.rsplit("}", 1)[-1].lower()

def child_text(element, names):
    names = {name.lower() for name in names}
    for child in element:
        if local_name(child.tag) in names:
            if child.text and child.text.strip():
                return child.text.strip()
            href = child.attrib.get("href")
            if href:
                return href.strip()
    return ""

def parse_date(value):
    if not value:
        return ""
    try:
        dt = parsedate_to_datetime(value)
    except Exception:
        try:
            dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
        except Exception:
            return ""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(WARSAW).isoformat(timespec="minutes")

def fetch_feed(name, url):
    request = urllib.request.Request(url, headers={
        "User-Agent": "LEVEL-NEXT-DAILY/1.1 (+https://firol24.github.io/LevelNext)"
    })
    with urllib.request.urlopen(request, timeout=25) as response:
        raw = response.read(1_500_000)
    root = ET.fromstring(raw)
    entries = [node for node in root.iter() if local_name(node.tag) in ("item", "entry")]
    output = []
    for item in entries[:25]:
        title = child_text(item, ["title"])
        link = child_text(item, ["link", "guid", "id"])
        desc = child_text(item, ["description", "encoded", "summary", "content"])
        published = child_text(item, ["pubdate", "published", "updated", "date"])
        if title and link.startswith(("https://", "http://")):
            output.append({
                "sourceName": name,
                "title": clean_html(title),
                "sourceUrl": link,
                "publishedAt": parse_date(published),
                "summary": clean_html(desc),
                "category": "WIADOMOŚCI" if "Publicystyka" not in name else "PUBLICYSTYKA"
            })
    return output

def main():
    now = datetime.now(WARSAW)
    force = __import__("os").environ.get("FORCE_PUBLISH") == "1"
    issue_date = now.date().isoformat()
    if not force and now.hour < 8:
        print(f"Pominięto uruchomienie o {now:%H:%M}; wydanie powstaje od 08:00.")
        return

    current_path = ROOT / "data" / "daily.json"
    if not force:
        try:
            current = json.loads(current_path.read_text(encoding="utf-8"))
            if current.get("date") == issue_date and current.get("status") in ("published", "rss-only"):
                print(f"Wydanie {issue_date} już istnieje — pomijam duplikat.")
                return
        except Exception:
            pass

    articles, seen = [], set()
    for name, url in FEEDS:
        try:
            for item in fetch_feed(name, url):
                if item["sourceUrl"] not in seen:
                    seen.add(item["sourceUrl"])
                    articles.append(item)
        except Exception as error:
            print(f"RSS warning ({name}): {error}", file=sys.stderr)

    if not articles:
        raise RuntimeError("Nie udało się pobrać żadnego materiału RSS. Nie publikuję pustego wydania.")

    articles.sort(key=lambda item: item.get("publishedAt", ""), reverse=True)
    news = articles[:12]
    lead_item = news[0]
    issue = {
        "status": "rss-only",
        "date": issue_date,
        "headline": "Świeże sygnały ze świata gier",
        "editorNote": "Wydanie zbudowane automatycznie z kanałów RSS. Tytuły i opisy pochodzą ze źródeł — kliknij, aby przeczytać oryginalne materiały.",
        "lead": {
            "category": lead_item.get("category", "NAJNOWSZE"),
            "title": lead_item["title"],
            "summary": lead_item["summary"] or "Otwórz oryginalny materiał, aby poznać szczegóły.",
            "sourceUrl": lead_item["sourceUrl"]
        },
        "news": news,
        "indie": [],
        "releases": [],
        "film": None
    }

    data_dir, archive_dir = ROOT / "data", ROOT / "archive"
    data_dir.mkdir(exist_ok=True)
    archive_dir.mkdir(exist_ok=True)
    serialized = json.dumps(issue, ensure_ascii=False, indent=2) + "\n"
    (data_dir / "daily.json").write_text(serialized, encoding="utf-8")
    (archive_dir / f"{issue_date}.json").write_text(serialized, encoding="utf-8")

    index_path = archive_dir / "index.json"
    try:
        archive = json.loads(index_path.read_text(encoding="utf-8"))
    except Exception:
        archive = {"editions": []}
    editions = [x for x in archive.get("editions", []) if x.get("date") != issue_date]
    editions.insert(0, {"date": issue_date, "headline": issue["headline"], "path": f"{issue_date}.json"})
    index_path.write_text(json.dumps({"editions": editions[:180]}, ensure_ascii=False, indent=2) + "\\n", encoding="utf-8")
    print(f"Opublikowano RSS-only LEVEL NEXT DAILY: {issue_date} ({len(news)} materiałów).")

if __name__ == "__main__":
    main()
