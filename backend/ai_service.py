import os
import json
import re
import requests
from typing import Dict, Any, List, Optional
from tutor_engine import IntelligentTutorEngine

engine = IntelligentTutorEngine()

SYSTEM_PROMPT = """You are Maya, a warm, patient, and highly intelligent AI English Tutor at FluentUp AI.
Your mission is to help Indian learners—particularly native Telugu speakers—develop natural, confident spoken English.

Personality & Rules:
1. Speak in a friendly, encouraging female voice persona.
2. Use simple, natural, conversational English.
3. Keep the conversation moving forward naturally by asking ONE clear, engaging question at a time.
4. Adapt to the user's level (beginner, intermediate, advanced).
5. If the user makes a grammatical or phrasing mistake, respond warmly to their thought first, then provide a gentle structured correction.
CRITICAL: If the user's sentence is already natural, correct, or has NO mistake, you MUST set "correction": null. NEVER return empty quotes "" or blank correction objects.
6. When explaining grammar or vocabulary, provide both a simple English explanation and a relatable Telugu explanation (e.g. 'Past time lo vachinappudu went vadali', or in Telugu script).
7. If the user is practicing an interview, act as a supportive hiring manager and ask the next relevant interview question.
8. Output valid JSON:
When no mistake exists:
{
  "reply": "Your conversational response to the learner, followed by one clear follow-up question.",
  "correction": null,
  "suggested_replies": [
    "Quick option 1",
    "Quick option 2",
    "Quick option 3"
  ]
}

When a real grammar/phrasing mistake exists:
{
  "reply": "Your warm conversational response to the learner, followed by one clear follow-up question.",
  "correction": {
    "original": "The user's exact phrase with error",
    "improved": "The natural native version",
    "explanation_en": "Simple English explanation of the rule",
    "explanation_te": "Clear Telugu explanation e.g. 'Yesterday ante past time. Kabatti went vadali.'",
    "practice": "A short practice sentence for the user to try"
  },
  "suggested_replies": [
    "Quick option 1",
    "Quick option 2",
    "Quick option 3"
  ]
}
"""

def sanitize_correction(correction: Any) -> Optional[Dict[str, Any]]:
    """Strictly validates and cleans a correction object, returning None if invalid or blank."""
    if not isinstance(correction, dict):
        return None
    orig = str(correction.get("original") or "").strip()
    imp = str(correction.get("improved") or "").strip()

    # Strip surrounding quotes if present
    orig = re.sub(r'^["\']+|["\']+$', '', orig).strip()
    imp = re.sub(r'^["\']+|["\']+$', '', imp).strip()

    if not orig or not imp:
        return None
    if orig.lower() in ["null", "none", "n/a", "no error", "natural", "\"\"", "''"]:
        return None
    if imp.lower() in ["null", "none", "n/a", "no error", "natural", "\"\"", "''"]:
        return None
    if orig.lower() == imp.lower():
        return None

    return {
        "original": orig,
        "improved": imp,
        "explanation_en": str(correction.get("explanation_en") or "").strip(),
        "explanation_te": str(correction.get("explanation_te") or "").strip(),
        "practice": str(correction.get("practice") or "").strip()
    }

def clean_json_response(text: str) -> Optional[Dict[str, Any]]:
    """Strips markdown code blocks and parses JSON."""
    s = text.strip()
    # Strip markdown ```json ... ```
    if s.startswith("```json"):
        s = s[7:]
    elif s.startswith("```"):
        s = s[3:]
    if s.endswith("```"):
        s = s[:-3]
    s = s.strip()

    parsed = None
    try:
        parsed = json.loads(s)
    except Exception:
        # Try finding the first { and last }
        start = s.find("{")
        end = s.rfind("}")
        if start != -1 and end != -1 and end > start:
            try:
                parsed = json.loads(s[start:end+1])
            except Exception:
                pass

    if parsed and isinstance(parsed, dict):
        parsed["correction"] = sanitize_correction(parsed.get("correction"))
    return parsed

def call_groq(user_message: str, history: List[Dict[str, Any]], preferences: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Calls Groq API for high-speed cloud inference."""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return None

    # Preferred working models on Groq
    model = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
    candidate_models = [model, "openai/gpt-oss-120b", "qwen/qwen3.8-27b", "openai/gpt-oss-20b"]

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for m in history[-8:]:
        role = "user" if m.get("sender") == "user" else "assistant"
        messages.append({"role": role, "content": m.get("text", "")})
    messages.append({"role": "user", "content": user_message})

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    for candidate in candidate_models:
        try:
            payload = {
                "model": candidate,
                "messages": messages,
                "temperature": 0.7,
                "response_format": {"type": "json_object"}
            }
            resp = requests.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload, timeout=12)
            if resp.status_code == 200:
                data = resp.json()
                content = data["choices"][0]["message"]["content"]
                parsed = clean_json_response(content)
                if parsed and "reply" in parsed:
                    parsed["provider"] = f"Groq Cloud AI ({candidate})"
                    parsed["is_demo_mode"] = False
                    return parsed
            else:
                print(f"Groq {candidate} returned status {resp.status_code}: {resp.text[:120]}")
        except Exception as e:
            print(f"Groq candidate {candidate} error: {e}")

    return None

def call_gemini(user_message: str, history: List[Dict[str, Any]], preferences: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Calls Google Gemini API."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return None

    candidate_models = ["gemini-3.8-flash", "gemini-2.5-flash", "gemini-1.5-flash"]
    configured_model = os.getenv("GEMINI_MODEL")
    if configured_model and configured_model not in candidate_models:
        candidate_models.insert(0, configured_model)

    prompt = f"{SYSTEM_PROMPT}\n\nRecent Conversation History:\n"
    for m in history[-6:]:
        role = "User" if m.get("sender") == "user" else "Maya"
        prompt += f"{role}: {m.get('text', '')}\n"
    prompt += f"User: {user_message}\n\nOutput Valid JSON according to schema:"

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"response_mime_type": "application/json"}
    }

    for model_name in candidate_models:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
            resp = requests.post(url, json=payload, timeout=12)
            if resp.status_code == 200:
                data = resp.json()
                raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
                parsed = clean_json_response(raw_text)
                if parsed and "reply" in parsed:
                    parsed["provider"] = f"Google Gemini Cloud ({model_name})"
                    parsed["is_demo_mode"] = False
                    return parsed
            else:
                print(f"Gemini {model_name} status {resp.status_code}: {resp.text[:120]}")
        except Exception as e:
            print(f"Gemini {model_name} error: {e}")

    return None

def call_openai(user_message: str, history: List[Dict[str, Any]], preferences: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Calls OpenAI API."""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None

    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    if model in ["gpt-4.1-mini", "default"]:
        model = "gpt-4o-mini"

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for m in history[-8:]:
        role = "user" if m.get("sender") == "user" else "assistant"
        messages.append({"role": role, "content": m.get("text", "")})
    messages.append({"role": "user", "content": user_message})

    try:
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": model,
            "messages": messages,
            "temperature": 0.7,
            "response_format": {"type": "json_object"}
        }
        resp = requests.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload, timeout=12)
        if resp.status_code == 200:
            data = resp.json()
            content = data["choices"][0]["message"]["content"]
            parsed = clean_json_response(content)
            if parsed and "reply" in parsed:
                parsed["provider"] = f"OpenAI Cloud ({model})"
                parsed["is_demo_mode"] = False
                return parsed
        else:
            print(f"OpenAI error {resp.status_code}: {resp.text[:120]}")
    except Exception as e:
        print(f"OpenAI error: {e}")
    return None

def get_tutor_response(
    user_message: str,
    history: List[Dict[str, Any]],
    preferences: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Coordinates AI provider with automatic fallback:
    1. Groq (High-speed cloud AI)
    2. Google Gemini (Cloud AI)
    3. OpenAI (Cloud AI)
    4. FluentUp Intelligent Tutor Engine (Local Offline)
    """
    # 1. Groq Cloud
    res = call_groq(user_message, history, preferences)
    if res:
        res["correction"] = sanitize_correction(res.get("correction"))
        return res

    # 2. Gemini Cloud
    res = call_gemini(user_message, history, preferences)
    if res:
        res["correction"] = sanitize_correction(res.get("correction"))
        return res

    # 3. OpenAI Cloud
    res = call_openai(user_message, history, preferences)
    if res:
        res["correction"] = sanitize_correction(res.get("correction"))
        return res

    # 4. Intelligent built-in local engine fallback
    local_res = engine.generate_response(user_message, history, preferences)
    local_res["correction"] = sanitize_correction(local_res.get("correction"))
    local_res["provider"] = "FluentUp Intelligent Local Engine"
    local_res["is_demo_mode"] = True
    local_res["setup_hint"] = "Cloud API key configured but rate limited or unavailable. Using intelligent local tutor."
    return local_res
