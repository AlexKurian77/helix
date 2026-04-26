"""
/simplify endpoint — uses Gemini to translate complex scientific protocols
into plain English. Integrated from plaintohard.py.
"""
from fastapi import APIRouter
from pydantic import BaseModel, Field
import google.generativeai as genai
from config import GEMINI_API_KEY

router = APIRouter()

# Configure Gemini
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)


class SimplifyRequest(BaseModel):
    text: str = Field(..., min_length=5, description="Scientific text to simplify")
    context: str = Field(default="", description="Optional protocol context")


class SimplifyResponse(BaseModel):
    original: str
    simplified: str


@router.post("/simplify", response_model=SimplifyResponse)
async def simplify(request: SimplifyRequest):
    """
    Translate complex scientific text into simple plain English using Gemini.
    """
    if not GEMINI_API_KEY:
        return SimplifyResponse(
            original=request.text,
            simplified="Gemini API key not configured. Cannot simplify."
        )

    try:
        model = genai.GenerativeModel('gemini-2.0-flash')

        prompt = f"""You are a science communicator. Translate the following complex scientific text into simple, 
plain English that a non-scientist can understand. Keep it accurate but accessible.
Respond in plain text only — no markdown, no bullet points, no headers.

{f'Context: {request.context}' if request.context else ''}

Text to simplify:
{request.text}"""

        response = model.generate_content(prompt)
        simplified = response.text.strip()

        return SimplifyResponse(
            original=request.text,
            simplified=simplified,
        )
    except Exception as e:
        return SimplifyResponse(
            original=request.text,
            simplified=f"Error simplifying: {str(e)}"
        )
