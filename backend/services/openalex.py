"""
OpenAlex service — retrieves live research papers and metadata.
An open alternative to Semantic Scholar that does not require an API key.
"""
import requests
import re
from typing import List, Dict

from config import OPENALEX_EMAIL

BASE_URL = "https://api.openalex.org/works"

def search_papers(query: str, limit: int = 5) -> List[Dict]:
    """
    Search OpenAlex for papers matching the query.
    Returns a list of dicts: { id, title, abstract, url, year, type, score }
    """
    # Sanitize query: remove punctuation and common question words
    clean_query = re.sub(r'[^\w\s]', '', query)
    stopwords = ["how", "to", "what", "is", "the", "a", "an", "for", "of", "in", "and"]
    keywords = [w for w in clean_query.split() if w.lower() not in stopwords]
    search_term = " ".join(keywords)
    params = {
        "search": search_term,
        "per-page": limit,
        "select": "id,title,abstract_inverted_index,primary_location,publication_year,type,relevance_score",
    }
    
    if OPENALEX_EMAIL:
        params["mailto"] = OPENALEX_EMAIL
    
    try:
        response = requests.get(BASE_URL, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        results = []
        for work in data.get("results", []):
            # Reconstruct abstract from inverted index if present
            abstract = _reconstruct_abstract(work.get("abstract_inverted_index"))
            
            # Get URL
            url = work.get("primary_location", {}).get("landing_page_url") or f"https://doi.org/{work.get('id').split('/')[-1]}"
            
            results.append({
                "id": work.get("id"),
                "title": work.get("title") or "Untitled",
                "abstract": abstract or "No abstract available.",
                "url": url,
                "year": work.get("publication_year"),
                "type": "paper",
                "score": work.get("relevance_score", 0),
                "domain": "scientific research" # OpenAlex doesn't always provide a simple domain string
            })
        return results
    except Exception as e:
        print(f"[OpenAlex] Error searching papers: {e}")
        return []

def _reconstruct_abstract(inverted_index: Dict) -> str:
    """OpenAlex returns abstracts as an inverted index for legal reasons. Reconstruct it."""
    if not inverted_index:
        return ""
    
    # Create a list of words in their correct positions
    word_list = {}
    for word, positions in inverted_index.items():
        for pos in positions:
            word_list[pos] = word
            
    # Sort positions and join words
    sorted_positions = sorted(word_list.keys())
    return " ".join([word_list[pos] for pos in sorted_positions])
