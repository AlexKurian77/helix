from services.openalex import search_papers
import json

papers = search_papers("How to extract caffeine from coffee beans?")
print(json.dumps(papers, indent=2))
