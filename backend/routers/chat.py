from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import os
from groq import Groq
from config import GROQ_API_KEY, GROQ_MODEL
from models.database import get_session, Researcher, InventoryItem, Experiment

router = APIRouter(prefix="/chat")

client = Groq(api_key=GROQ_API_KEY)

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]

@router.post("")
async def chat(request: ChatRequest):
    """
    Mentor Chat endpoint — provides context-aware assistance based on lab history and state.
    """
    session = get_session()
    if not session:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    try:
        # 1. Fetch Lab Context
        researchers = session.query(Researcher).all()
        equipment = session.query(InventoryItem).all()
        past_experiments = session.query(Experiment).order_by(Experiment.created_at.desc()).limit(10).all()
        
        # 2. Build Context String
        context = "LABORATORY CONTEXT:\n"
        context += "RESEARCHERS:\n"
        for r in researchers:
            context += f"- {r.name} ({r.title}): Expertise in {', '.join(r.expertise)}. Availability: {r.availability}.\n"
        
        context += "\nEQUIPMENT:\n"
        for e in equipment:
            context += f"- {e.item_name} ({e.category}): {'Available' if e.availability_status == 'in_stock' else 'Unavailable'}.\n"
            
        context += "\nPAST EXPERIMENTS (RECENT):\n"
        for ex in past_experiments:
            context += f"- [{str(ex.id)[:8]}] {ex.hypothesis} (Status: {ex.status})\n"
            
        # 3. Prepare System Prompt
        system_prompt = f"""You are 'Helix Mentor', a context-aware AI lab assistant for a high-performance research laboratory.
Your goal is to help scientists navigate their lab's memory and capacity.

{context}

RULES:
1. Use the provided context to answer questions. If someone asks "Who knows about HepG2?", look at the researchers' expertise.
2. If asked about past work, reference the specific experiments listed.
3. Keep responses professional, scientific, and helpful. 
4. Use markdown for formatting (bold for emphasis, bullet points for lists).
5. If the context doesn't contain the answer, say you don't have that specific data in your current memory.
"""

        # 4. Call Groq
        messages = [{"role": "system", "content": system_prompt}]
        for msg in request.messages:
            messages.append({"role": msg.role, "content": msg.content})
            
        completion = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=messages,
            temperature=0.7,
            max_tokens=500
        )
        
        return {"content": completion.choices[0].message.content}
        
    except Exception as e:
        print(f"[Chat] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        session.close()
