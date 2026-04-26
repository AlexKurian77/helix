"""
Protocols.io service — retrieves real lab protocols from the Protocols.io public API.
Integrated from hardtoplain.py / plaintohard.py standalone scripts.

Provides:
  - search_protocols(query) → list of protocol summaries
  - fetch_protocol_detail(protocol_id) → full protocol with steps + materials
"""
import requests
import json
import re
from typing import List, Dict, Optional
from config import PROTOCOLS_IO_TOKEN

SEARCH_URL = "https://www.protocols.io/api/v3/protocols"
DETAIL_URL = "https://www.protocols.io/api/v3/protocols/{protocol_id}"


def _get_headers() -> dict:
    """Return auth headers for Protocols.io API."""
    if not PROTOCOLS_IO_TOKEN:
        return {}
    return {"Authorization": f"Bearer {PROTOCOLS_IO_TOKEN}"}


def _clean_html(text: str) -> str:
    """Strip HTML tags from protocol text fields."""
    if not text:
        return ""
    return re.sub(r'<[^>]+>', '', str(text)).strip()


def search_protocols(query: str, limit: int = 3) -> List[Dict]:
    """
    Search Protocols.io for public protocols matching the query.
    Returns list of dicts: { id, title, type, domain, text, url, score }
    """
    if not PROTOCOLS_IO_TOKEN:
        print("[Protocols.io] No token configured, skipping.")
        return []

    headers = _get_headers()
    params = {"filter": "public", "key": query, "page_size": limit}

    try:
        response = requests.get(SEARCH_URL, headers=headers, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
    except requests.exceptions.RequestException as e:
        print(f"[Protocols.io] Search error: {e}")
        return []

    items = data.get("items", [])
    if not items:
        return []

    results = []
    for i, item in enumerate(items[:limit]):
        protocol_id = item.get("id")
        title = item.get("title", "Untitled Protocol")
        description = _clean_html(item.get("description", ""))
        uri = item.get("uri", "")
        url = f"https://www.protocols.io/view/{uri}" if uri else None

        # Build a summary text from description
        text = description[:500] if description else f"Protocol: {title}"

        results.append({
            "id": f"pio-{protocol_id}",
            "title": title,
            "type": "protocol",
            "domain": "laboratory science",
            "text": text,
            "url": url,
            "score": round(0.85 - (i * 0.05), 3),  # Descending relevance
        })

    return results


def fetch_protocol_detail(protocol_id: int) -> Optional[Dict]:
    """
    Fetch the full detail of a single protocol from Protocols.io.
    Returns dict with: title, materials, steps (as plain text list).
    """
    if not PROTOCOLS_IO_TOKEN:
        return None

    headers = _get_headers()
    url = DETAIL_URL.format(protocol_id=protocol_id)

    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        raw = response.json()
    except requests.exceptions.RequestException as e:
        print(f"[Protocols.io] Detail fetch error: {e}")
        return None

    protocol = raw.get("protocol", {})

    # Extract steps
    steps = []
    for step in protocol.get("steps", []):
        components = step.get("components", [])
        for comp in components:
            if comp.get("type_id") == 1:  # Text component
                step_text = _clean_html(comp.get("source", ""))
                if step_text:
                    steps.append(step_text)

    # Extract materials
    materials = []
    for mat in protocol.get("materials", []):
        mat_name = mat.get("name", "")
        if mat_name:
            materials.append({
                "name": mat_name,
                "vendor": mat.get("vendor", {}).get("name", ""),
                "catalog_number": mat.get("catalog_number", ""),
            })

    return {
        "title": protocol.get("title", "Unknown"),
        "materials": materials,
        "steps": steps,
        "steps_text": "\n".join([f"{i+1}. {s}" for i, s in enumerate(steps)]),
    }
