import requests
import json
import google.generativeai as genai 

# --- 1. SETUP YOUR KEYS ---
PROTOCOLS_IO_TOKEN = "501f27b98e2ff4c9b702a61cc11e97949601582914bd73b1aa1528e1d115c99a93a312cac371f889ac9b8341fd0bceb116ff28f65b22cf57968b5711426d1fda" 
genai.configure(api_key="AIzaSyBLJ0VZ09AqoT3zW5c02LWBn6iuPva2aQQ")

def test_ai_scientist_pipeline():
    # --- PHASE 1: DYNAMIC SEARCH ---
    print("\n" + "="*60)
    search_topic = input("🧬 WHAT SCIENTIFIC DOMAIN ARE WE RESEARCHING TODAY?\n(e.g., CRISPR, PCR, Western Blot, Microscopy)\n> ")
    print("="*60)

    print(f"\n🚀 Firing up the AI Scientist Pipeline for: {search_topic}...")
    
    search_url = "https://www.protocols.io/api/v3/protocols"
    headers = {"Authorization": f"Bearer {PROTOCOLS_IO_TOKEN}"}
    params = {"filter": "public", "key": search_topic}
    
    try:
        search_response = requests.get(search_url, headers=headers, params=params)
        search_response.raise_for_status() 
    except requests.exceptions.RequestException as e:
        print(f"❌ API Error during search: {e}")
        return
        
    data = search_response.json()
    if not data.get('items'):
        print(f"❌ No protocols found for '{search_topic}'. Try a different keyword.")
        return
        
    first_protocol_id = data['items'][0]['id']
    first_protocol_title = data['items'][0]['title']
    print(f"✅ Found top protocol: {first_protocol_title} (ID: {first_protocol_id})")
    
    # --- PHASE 2: DETAIL FETCHING ---
    print("📥 Fetching deep JSON payload...")
    detail_url = f"https://www.protocols.io/api/v3/protocols/{first_protocol_id}"
    try:
        detail_response = requests.get(detail_url, headers=headers)
        detail_response.raise_for_status()
        raw_json = detail_response.json()
    except requests.exceptions.RequestException as e:
        print(f"❌ API Error fetching details: {e}")
        return
    
    # --- PHASE 3: DATA PREP & LLM SETUP ---
    print("\n🧠 PLANNER AGENT: Initializing Persistent Memory...")
    
    protocol_details = raw_json.get("protocol", {})
    extracted_data = {
        "title": protocol_details.get("title", "Unknown"),
        "materials": protocol_details.get("materials", []),
        "steps": protocol_details.get("steps", [])
    }
    clean_data = json.dumps(extracted_data)
    
    model = genai.GenerativeModel('gemini-2.5-flash')
    chat = model.start_chat(history=[])
    
    # Pre-load the AI with the protocol context
    initial_setup = f"You are an autonomous AI scientist. Memorize this JSON protocol: {clean_data}. For all future prompts, respond in absolute plain text with zero markdown formatting."
    chat.send_message(initial_setup)
    
    print("\n" + "="*60)
    print(f"🟢 SYSTEM LIVE: Currently specialized in {search_topic}")
    print("You can now ask questions, scale samples, or design experiments.")
    print("Type 'exit' to close.")
    print("="*60)
    
    # --- PHASE 4: INTERACTIVE LOOP ---
    while True:
        pi_request = input("\n👨‍🔬 ENTER YOUR COMMAND:\n> ")
        
        if pi_request.lower() == 'exit':
            print("🔌 Shutting down AI Scientist...")
            break
            
        prompt = f"""
        Instruction: "{pi_request}"
        
        CRITICAL: Respond using formal scientific language. Output as absolute plain text. Do NOT use any Markdown formatting (no asterisks, no hashes, no bolding symbols).
        """
        
        print("⏳ Processing...")
        try:
            response = chat.send_message(prompt)
            print("\n================ SYSTEM OUTPUT ================\n")
            print(response.text)
        except Exception as e:
             print(f"❌ LLM Generation Error: {e}")

if __name__ == "__main__":
    test_ai_scientist_pipeline()