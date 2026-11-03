#!/usr/bin/env python3
"""Build a free, RSS-only LEVEL NEXT DAILY issue (no API keys required)."""
import hashlib
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
    ("CD-Action", "https://cdaction.pl/feed/"),
    ("PPE", "http://www.ppe.pl/rss.html"),
    ("Łowcy Gier", "https://lowcygier.pl/feed/"),
]

class TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts = []
    def handle_data(self, data):
        self.parts.append(data)

class ImageExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.images = []
    def handle_starttag(self, tag, attrs):
        if tag.lower() == "img":
            src = dict(attrs).get("src") or dict(attrs).get("data-src")
            if src and src.startswith(("https://", "http://")):
                self.images.append(src)

def clean_html(value):
    parser = TextExtractor()
    try:
        parser.feed(value or "")
        value = " ".join(parser.parts)
    except Exception:
        pass
    return re.sub(r"\s+", " ", value or "").strip()[:700]

def clean_summary(value, title):
    text = clean_html(value)
    text = re.sub(r"\\s+(?:Informacja|Wiadomość)\\s+.+?\\s+została opublikowana przez .+$", "", text, flags=re.I)
    text = re.sub(r"^(?:Informacja|Wiadomość)\\s+.+?\\s+została opublikowana przez .+$", "", text, flags=re.I)
    if title and text.lower().startswith(title.lower()):
        text = text[len(title):].lstrip(" .:—–-")
    return text[:650].strip()

def image_from_item(item, description):
    for node in item.iter():
        name = local_name(node.tag)
        url = node.attrib.get("url") or node.attrib.get("href")
        if url and url.startswith(("https://", "http://")) and (
            name in ("thumbnail", "content", "enclosure") or "image" in node.attrib.get("type", "").lower()
        ):
            return url
    parser = ImageExtractor()
    try:
        parser.feed(description or "")
    except Exception:
        pass
    return parser.images[0] if parser.images else ""

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
            clean_title = clean_html(title)
            item_data = {
                "sourceName": name,
                "title": clean_title,
                "sourceUrl": link,
                "publishedAt": parse_date(published),
                "summary": clean_summary(desc, clean_title),
                "category": (
                    "PUBLICYSTYKA" if "Publicystyka" in name else
                    "PROMOCJE" if name == "Łowcy Gier" else
                    "WIADOMOŚCI"
                )
            }
            image_url = image_from_item(item, desc)
            if image_url:
                item_data["imageUrl"] = image_url
            output.append(item_data)
    return output

def main():
    now = datetime.now(WARSAW)
    force = __import__("os").environ.get("FORCE_PUBLISH") == "1"
    issue_date = now.date().isoformat()
    editorial_path = ROOT / "data" / "editorial.json"
    try:
        editorial = json.loads(editorial_path.read_text(encoding="utf-8"))
    except Exception as error:
        print(f"Editorial data warning: {error}", file=sys.stderr)
        editorial = {}

    current_path = ROOT / "data" / "daily.json"
    editorial_hash = hashlib.sha256(
        json.dumps(editorial, ensure_ascii=False, sort_keys=True).encode("utf-8")
    ).hexdigest()
    try:
        current_issue = json.loads(current_path.read_text(encoding="utf-8"))
    except Exception:
        current_issue = {}
    same_day_update = current_issue.get("date") == issue_date

    articles_by_source, seen = {}, set()
    for name, url in FEEDS:
        try:
            source_items = []
            for item in fetch_feed(name, url):
                if item["sourceUrl"] not in seen:
                    seen.add(item["sourceUrl"])
                    source_items.append(item)
            source_items.sort(key=lambda item: item.get("publishedAt", ""), reverse=True)
            if source_items:
                articles_by_source[name] = source_items
        except Exception as error:
            print(f"RSS warning ({name}): {error}", file=sys.stderr)

    if not articles_by_source:
        raise RuntimeError("Nie udało się pobrać żadnego materiału RSS. Nie publikuję pustego wydania.")

    # Rotacja źródeł: pokazujemy więcej materiałów, ale pilnujemy różnorodności.
    # Liczba newsów jest dynamiczna: zależy od tego, ile pozycji zwrócą RSS-y.
    # Maksymalnie 5 materiałów z jednego źródła, bez sztywnego limitu całego wydania.
    news, source_counts = [], {}
    while True:
        added_this_round = False
        for source_name, source_items in articles_by_source.items():
            if source_items and source_counts.get(source_name, 0) < 5:
                news.append(source_items.pop(0))
                source_counts[source_name] = source_counts.get(source_name, 0) + 1
                added_this_round = True
        if not added_this_round:
            break
    news.sort(key=lambda item: item.get("publishedAt", ""), reverse=True)
    lead_item = news[0]
    rss_fields = {
        "lead": {
            "category": lead_item.get("category", "NAJNOWSZE"),
            "title": lead_item["title"],
            "summary": lead_item["summary"] or "Otwórz oryginalny materiał, aby poznać szczegóły.",
            "sourceUrl": lead_item["sourceUrl"]
        },
        "news": news,
        "updatedAt": now.isoformat(timespec="minutes")
    }
    if lead_item.get("imageUrl"):
        rss_fields["lead"]["imageUrl"] = lead_item["imageUrl"]

    if same_day_update:
        # Aktualizacja tego samego wydania: odświeżamy RSS oraz sekcje redakcyjne,
        # jeśli ich plik źródłowy zmienił się od ostatniej publikacji.
        issue = current_issue
        issue.update(rss_fields)
        if current_issue.get("editorialHash") != editorial_hash:
            issue.update({
                "indie": editorial.get("indie", []),
                "releases": editorial.get("releases", []),
                "cinema": editorial.get("cinema", []),
                "film": editorial.get("film"),
                "editorialUpdatedAt": editorial.get("updatedAt", ""),
                "editorialHash": editorial_hash
            })
            print(f"Odświeżono sekcje Indie, premiery i kino na podstawie data/editorial.json.")
        print(f"Aktualizacja wydania {issue_date}: RSS oraz zmienione sekcje redakcyjne.")
    else:
        # Pierwsze wydanie nowego dnia: odświeżamy całą zawartość redakcyjną.
        issue = {
            "status": "rss-only",
            "date": issue_date,
            "updatedAt": now.isoformat(timespec="minutes"),
            "headline": "Świeże sygnały ze świata gier",
            "editorNote": "Wiadomości zbieramy z kilku niezależnych redakcji. Na LEVEL NEXT czytasz krótki opis z kanału RSS; pełny tekst i autorstwo pozostają u wydawcy.",
            **rss_fields,
            "indie": editorial.get("indie", []),
            "releases": editorial.get("releases", []),
            "cinema": editorial.get("cinema", []),
            "film": editorial.get("film"),
            "editorialUpdatedAt": editorial.get("updatedAt", ""),
            "editorialHash": editorial_hash
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
    index_path.write_text(json.dumps({"editions": editions[:180]}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Opublikowano RSS-only LEVEL NEXT DAILY: {issue_date} ({len(news)} materiałów).")

if __name__ == "__main__":
    main()
