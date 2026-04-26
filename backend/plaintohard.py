import requests
import json
import google.generativeai as genai 

from config import PROTOCOLS_IO_TOKEN, GEMINI_API_KEY
genai.configure(api_key=GEMINI_API_KEY)

def test_ai_scientist_pipeline():
    # --- PHASE 1: DYNAMIC TOPIC CHOOSING ---
    print("\n" + "="*60)
    search_topic = input("🧬 WHAT COMPLEX TOPIC SHOULD WE SIMPLIFY TODAY?\n(e.g., CRISPR, Western Blot, DNA Sequencing):\n> ")
    print("="*60)

    print(f"\n🚀 Firing up the Librarian Agent for: {search_topic}...")
    
    search_url = "https://www.protocols.io/api/v3/protocols"
    headers = {"Authorization": f"Bearer {PROTOCOLS_IO_TOKEN}"}
    params = {"filter": "public", "key": search_topic}
    
    try:
        search_response = requests.get(search_url, headers=headers, params=params)
        search_response.raise_for_status() 
    except requests.exceptions.RequestException as e:
        print(f"❌ API Error: {e}")
        return
        
    data = search_response.json()
    if not data.get('items'):
        print(f"❌ No protocols found for '{search_topic}'. Try a broader keyword.")
        return
        
    first_protocol_id = data['items'][0]['id']
    first_protocol_title = data['items'][0]['title']
    print(f"✅ Found Technical Protocol: {first_protocol_title}")
    
    # --- PHASE 2: FETCHING THE HEAVY DATA ---
    print("📥 Fetching deep scientific JSON...")
    detail_url = f"https://www.protocols.io/api/v3/protocols/{first_protocol_id}"
    try:
        detail_response = requests.get(detail_url, headers=headers)
        detail_response.raise_for_status()
        raw_json = detail_response.json()
    except requests.exceptions.RequestException as e:
        print(f"❌ API Error: {e}")
        return
    
    # --- PHASE 3: LLM INITIALIZATION ---
    print("\n🧠 PLANNER AGENT: Loading scientific context into memory...")
    
    protocol_details = raw_json.get("protocol", {})
    extracted_data = {
        "title": protocol_details.get("title", "Unknown"),
        "materials": protocol_details.get("materials", []),
        "steps": protocol_details.get("steps", [])
    }
    clean_data = json.dumps(extracted_data)
    
    model = genai.GenerativeModel('gemini-2.5-flash')
    chat = model.start_chat(history=[])
    
    # SYSTEM INSTRUCTION: Set the personality to "The Simplifier"
    initial_setup = f"""
    You are an AI Scientist specializing in communication. 
    Memorize this complex JSON protocol: {clean_data}. 
    Your primary goal is to translate this heavy scientific data into simple, plain English that anyone can understand. 
    Always respond in absolute plain text with ZERO markdown (no asterisks, no hashes).
    """
    chat.send_message(initial_setup)
    
    print("\n" + "="*60)
    print(f"🟢 SYSTEM LIVE: Ready to simplify '{search_topic}'")
    print("Ask me to explain steps simply, summarize, or define hard terms.")
    print("Type 'exit' to close.")
    print("="*60)
    
    # --- PHASE 4: INTERACTIVE SIMPLIFICATION LOOP ---
    while True:
        pi_request = input("\n👨‍🔬 WHAT SHOULD I SIMPLIFY?\n> ")
        
        if pi_request.lower() == 'exit':
            print("🔌 Shutting down Simplifier...")
            break
            
        prompt = f"""
        User Request: "{pi_request}"
        
        Instruction: Take the heavy scientific data from the protocol and respond to the request in very simple, easy-to-understand language. 
        CRITICAL: Output as absolute plain text. No Markdown formatting whatsoever.
        """
        
        print("⏳ Simplifying...")
        try:
            response = chat.send_message(prompt)
            print("\n================ PLAIN ENGLISH OUTPUT ================\n")
            print(response.text)
        except Exception as e:
             print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_ai_scientist_pipeline()