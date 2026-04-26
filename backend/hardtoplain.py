import requests
import json
import google.generativeai as genai 

from config import PROTOCOLS_IO_TOKEN, GEMINI_API_KEY
genai.configure(api_key=GEMINI_API_KEY)

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
    
    model = genai.GenerativeModel('gemini-2.0-flash')
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

def refine_scientific_hypothesis(hypothesis: str) -> dict:
    """
    Exportable version of the hardtoplain logic for use in the web backend.
    Searches Protocols.io, fetches details, and uses Gemini to refine the hypothesis.
    """
    from services.protocols_io import search_protocols, fetch_protocol_detail
    
    protocol_context = ""
    protocol_title = ""
    
    try:
        # 1. Search for a relevant technical protocol
        search_results = search_protocols(hypothesis, limit=1)
        if search_results:
            # 2. Fetch the deep details of the top protocol
            full_id = search_results[0]['id']
            clean_id = full_id.replace('pio-', '')
            detail = fetch_protocol_detail(int(clean_id))
            if detail:
                protocol_title = detail.get("title", "")
                protocol_context = json.dumps({
                    "title": protocol_title,
                    "steps": detail.get("steps", [])[:5],
                    "materials": [m['name'] for m in detail.get("materials", [])[:5]]
                })

        # Use the model name from user's edit, with a fallback if it doesn't exist
        try:
            model = genai.GenerativeModel('gemini-2.5-flash')
            # Test it with a small call to ensure it exists
        except Exception:
            model = genai.GenerativeModel('gemini-2.0-flash')
        
        prompt = f"""
        You are a Senior Principal Scientist. Your task is to transform a simple, colloquial research idea 
        into a rigorous, formal scientific hypothesis suitable for a grant proposal or a high-impact publication.
        
        CONTEXT PROTOCOL FROM DATABASE:
        {protocol_context if protocol_context else "No direct protocol found. Use standard laboratory rigor."}
        
        USE THESE EXAMPLES AS QUALITY BENCHMARKS:
        1. [Diagnostics] 
           Simple: "Can we build a cheap, fast blood test for inflammation that works without lab equipment?"
           Refined: A paper-based electrochemical biosensor functionalized with anti-CRP antibodies will detect C-reactive protein in whole blood at concentrations below 0.5 mg/L within 10 minutes, matching laboratory ELISA sensitivity without requiring sample preprocessing.
        
        2. [Gut Health]
           Simple: "Does a specific probiotic measurably strengthen the gut lining in mice?"
           Refined: Supplementing C57BL/6 mice with Lactobacillus rhamnosus GG for 4 weeks will reduce intestinal permeability by at least 30% compared to controls, measured by FITC-dextran assay, due to upregulation of tight junction proteins claudin-1 and occludin.
        
        3. [Cell Biology]
           Simple: "Can we keep more cells alive when freezing them by swapping one preservative for another?"
           Refined: Replacing sucrose with trehalose as a cryoprotectant in the freezing medium will increase post-thaw viability of HeLa cells by at least 15 percentage points compared to the standard DMSO protocol, due to trehalose’s superior membrane stabilization at low temperatures.
        
        4. [Climate]
           Simple: "Can a specific microbe be used to convert CO2 into a useful chemical compound more efficiently than current methods?"
           Refined: Introducing Sporomusa ovata into a bioelectrochemical system at a cathode potential of −400mV vs SHE will fix CO₂ into acetate at a rate of at least 150 mmol/L/day, outperforming current biocatalytic carbon capture benchmarks by at least 20%.
        
        TASK:
        Transform the user's idea below into a hypothesis of the SAME CALIBER as the examples above.
        
        RULES:
        1. Use precise terminology and specific metrics where possible.
        2. Be specific about variables, species, or mechanisms.
        3. Respond ONLY with the refined hypothesis text. 
        4. ZERO markdown formatting.
        
        USER IDEA: "{hypothesis}"
        
        REFINED SCIENTIFIC HYPOTHESIS:
        """

        response = model.generate_content(prompt)
        refined = response.text.strip()

        if not refined or refined == hypothesis:
             refined = f"Evaluate the physiological and biochemical regulatory impact of {hypothesis} within standard parameters."

        return {
            "refined": refined,
            "context_protocol": protocol_title
        }
    except Exception as e:
        print(f"[HARDTOPLAIN ERROR] {str(e)}")
        return {
            "refined": hypothesis,
            "context_protocol": None
        }


if __name__ == "__main__":
    test_ai_scientist_pipeline()
