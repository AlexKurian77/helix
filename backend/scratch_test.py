import requests
import json

response = requests.post(
    "http://127.0.0.1:8000/generate",
    json={"query": "How to extract caffeine from coffee beans?"}
)

plan = response.json().get("experiment_plan", {})
qc = response.json().get("literature_qc", {})
print("LITERATURE QC REFERENCES:", json.dumps(qc.get("references", []), indent=2))
print("CITATIONS:", json.dumps(plan.get("citations", []), indent=2))
