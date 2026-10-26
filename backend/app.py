import os
import uuid
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables from all possible locations
backend_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.abspath(os.path.join(backend_dir, ".."))
load_dotenv(os.path.join(backend_dir, ".env"))
load_dotenv(os.path.join(root_dir, ".env"))
load_dotenv(os.path.join(backend_dir, ".env.example"))
load_dotenv()

import database as db
from ai_service import get_tutor_response

# Initialize DB tables
db.init_db()

app = FastAPI(title="FluentUp AI - Conversational English Tutor API", version="1.0.0")

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Models ---
class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    english_level: Optional[str] = "beginner"
    preferred_language: Optional[str] = "en_te"

class LoginRequest(BaseModel):
    email: str
    password: str

class ChatRequest(BaseModel):
    conversation_id: Optional[str] = None
    message: str
    audio_duration_seconds: Optional[float] = 0.0
    learning_target: Optional[str] = None # 'english' or 'hindi'

class ConversationCreate(BaseModel):
    title: Optional[str] = "New Conversation"

class ConversationUpdate(BaseModel):
    title: str

class VocabItem(BaseModel):
    word: str
    definition: str
    telugu_meaning: Optional[str] = ""
    hindi_meaning: Optional[str] = ""
    example_sentence: Optional[str] = ""

class CorrectionItem(BaseModel):
    original_sentence: str
    improved_sentence: str
    explanation_en: str
    explanation_te: Optional[str] = ""
    explanation_hi: Optional[str] = ""
    practice_sentence: Optional[str] = ""

class SettingsUpdate(BaseModel):
    preferred_language: Optional[str] = None
    english_level: Optional[str] = None
    voice_speed: Optional[float] = None
    female_voice_name: Optional[str] = None
    auto_speak: Optional[int] = None
    tutor_name: Optional[str] = None
    learning_target: Optional[str] = None # 'english' or 'hindi'

class ToolGrammarRequest(BaseModel):
    text: str

class ToolTranslateRequest(BaseModel):
    text: str
    target_language: str = "hi" # 'hi', 'te', or 'en'

class ToolSimplifyRequest(BaseModel):
    text: str

class VoiceTimeRequest(BaseModel):
    minutes: float

def get_current_user_optional(authorization: Optional[str] = None) -> Optional[Dict[str, Any]]:
    if not authorization:
        return None
    token = authorization.replace("Bearer ", "").strip()
    return db.get_user_from_token(token)

# --- Routes ---

@app.get("/api/status")
def get_status():
    has_groq = bool(os.getenv("GROQ_API_KEY"))
    has_gemini = bool(os.getenv("GEMINI_API_KEY"))
    has_openai = bool(os.getenv("OPENAI_API_KEY"))

    if has_groq:
        active_mode = f"Cloud AI (Groq: {os.getenv('GROQ_MODEL', 'openai/gpt-oss-120b')})"
    elif has_gemini:
        active_mode = f"Cloud AI (Gemini: {os.getenv('GEMINI_MODEL', 'gemini-3.8-flash')})"
    elif has_openai:
        active_mode = f"Cloud AI (OpenAI: {os.getenv('OPENAI_MODEL', 'gpt-4o-mini')})"
    else:
        active_mode = "FluentUp Intelligent Local Engine (Demo Mode)"

    is_demo = not (has_groq or has_gemini or has_openai)
    return {
        "status": "online",
        "active_mode": active_mode,
        "is_demo_mode": is_demo,
        "setup_instruction": "Live Cloud AI Active: Connected to real conversational language model." if not is_demo else "Add GROQ_API_KEY, GEMINI_API_KEY or OPENAI_API_KEY to backend/.env"
    }

# --- Auth Endpoints ---
@app.post("/api/auth/register")
def register(data: RegisterRequest):
    try:
        return db.register_user(
            name=data.name,
            email=data.email,
            password=data.password,
            english_level=data.english_level or "beginner",
            preferred_language=data.preferred_language or "en_te"
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@app.post("/api/auth/login")
def login(data: LoginRequest):
    try:
        return db.login_user(email=data.email, password=data.password)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")

@app.get("/api/auth/me")
def get_me(authorization: Optional[str] = Header(None)):
    user = get_current_user_optional(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return {"user": user}

@app.post("/api/auth/logout")
def logout(authorization: Optional[str] = Header(None)):
    if authorization:
        token = authorization.replace("Bearer ", "").strip()
        db.delete_user_session(token)
    return {"status": "logged_out"}

# --- Conversations ---
@app.get("/api/conversations")
def get_conversations(authorization: Optional[str] = Header(None)):
    user = get_current_user_optional(authorization)
    user_id = user["id"] if user else None
    return db.list_conversations(user_id)

@app.post("/api/conversations")
def create_conversation(data: ConversationCreate, authorization: Optional[str] = Header(None)):
    user = get_current_user_optional(authorization)
    user_id = user["id"] if user else "guest"
    conv_id = str(uuid.uuid4())
    return db.create_conversation(conv_id, data.title or "New Conversation", user_id=user_id)

@app.get("/api/conversations/{conversation_id}")
def get_conversation_history(conversation_id: str):
    messages = db.get_conversation_messages(conversation_id)
    return {"conversation_id": conversation_id, "messages": messages}

@app.patch("/api/conversations/{conversation_id}")
def rename_conversation(conversation_id: str, data: ConversationUpdate):
    db.update_conversation_title(conversation_id, data.title)
    return {"status": "updated"}

@app.delete("/api/conversations/{conversation_id}")
def delete_conversation(conversation_id: str):
    db.delete_conversation(conversation_id)
    return {"status": "deleted"}

# --- Chat ---
@app.post("/api/chat")
def chat(request: ChatRequest, authorization: Optional[str] = Header(None)):
    user = get_current_user_optional(authorization)
    user_id = user["id"] if user else "guest"

    conv_id = request.conversation_id or str(uuid.uuid4())
    user_msg_id = str(uuid.uuid4())
    asst_msg_id = str(uuid.uuid4())

    # Record audio time if sent
    if request.audio_duration_seconds and request.audio_duration_seconds > 0:
        db.record_spoken_time(request.audio_duration_seconds / 60.0)

    # 1. Fetch history for context
    history = db.get_conversation_messages(conv_id)

    # 2. Fetch user preferences
    prefs = db.get_settings(user_id)
    if request.learning_target:
        prefs["learning_target"] = request.learning_target

    # 3. Save user message to database
    db.add_message(user_msg_id, conv_id, "user", request.message, user_id=user_id)

    # 4. Generate AI tutor response
    ai_result = get_tutor_response(request.message, history, prefs)

    reply_text = ai_result.get("reply", "I'm listening! Let's continue practicing.")
    correction = ai_result.get("correction")

    # 5. Save assistant message to database
    db.add_message(asst_msg_id, conv_id, "assistant", reply_text, correction, user_id=user_id)

    return {
        "conversation_id": conv_id,
        "message_id": asst_msg_id,
        "reply": reply_text,
        "correction": correction,
        "suggested_replies": ai_result.get("suggested_replies", []),
        "provider": ai_result.get("provider", "FluentUp Tutor"),
        "is_demo_mode": ai_result.get("is_demo_mode", False),
        "setup_hint": ai_result.get("setup_hint")
    }

# --- Vocabulary ---
@app.get("/api/vocabulary")
def get_vocabulary(authorization: Optional[str] = Header(None)):
    user = get_current_user_optional(authorization)
    user_id = user["id"] if user else None
    return db.list_vocabulary(user_id)

@app.post("/api/vocabulary")
def add_vocabulary(data: VocabItem, authorization: Optional[str] = Header(None)):
    user = get_current_user_optional(authorization)
    user_id = user["id"] if user else "guest"
    vocab_id = str(uuid.uuid4())
    return db.save_vocabulary(vocab_id, data.word, data.definition, data.telugu_meaning or "", data.example_sentence or "", user_id=user_id)

@app.delete("/api/vocabulary/{vocab_id}")
def remove_vocabulary(vocab_id: str):
    db.delete_vocabulary(vocab_id)
    return {"status": "deleted"}

# --- Saved Corrections ---
@app.get("/api/corrections")
def get_corrections(authorization: Optional[str] = Header(None)):
    user = get_current_user_optional(authorization)
    user_id = user["id"] if user else None
    return db.list_saved_corrections(user_id)

@app.post("/api/corrections")
def add_saved_correction(data: CorrectionItem, authorization: Optional[str] = Header(None)):
    user = get_current_user_optional(authorization)
    user_id = user["id"] if user else "guest"
    corr_id = str(uuid.uuid4())
    return db.save_correction(
        corr_id,
        data.original_sentence,
        data.improved_sentence,
        data.explanation_en,
        data.explanation_te or "",
        data.practice_sentence or "",
        user_id=user_id
    )

@app.delete("/api/corrections/{corr_id}")
def remove_saved_correction(corr_id: str):
    db.delete_saved_correction(corr_id)
    return {"status": "deleted"}

# --- Settings & Progress ---
@app.get("/api/settings")
def get_settings(authorization: Optional[str] = Header(None)):
    user = get_current_user_optional(authorization)
    user_id = user["id"] if user else None
    return db.get_settings(user_id)

@app.post("/api/settings")
def update_settings(data: SettingsUpdate, authorization: Optional[str] = Header(None)):
    user = get_current_user_optional(authorization)
    user_id = user["id"] if user else None
    return db.update_settings(data.model_dump(exclude_unset=True), user_id)

@app.get("/api/progress")
def get_progress(authorization: Optional[str] = Header(None)):
    user = get_current_user_optional(authorization)
    user_id = user["id"] if user else None
    return db.get_learning_stats(user_id)

@app.post("/api/progress/voice-time")
def add_voice_time(data: VoiceTimeRequest):
    db.record_spoken_time(data.minutes)
    return {"status": "recorded"}

# --- Lightweight AI Tools ---
@app.post("/api/tools/grammar")
def tool_check_grammar(data: ToolGrammarRequest):
    from tutor_engine import analyze_grammar
    corr = analyze_grammar(data.text)
    if corr:
        return {
            "has_error": True,
            "correction": corr,
            "message": "Grammar review complete. Here is how to make it more natural:"
        }
    return {
        "has_error": False,
        "correction": None,
        "message": "Great job! This sentence looks clear and natural."
    }

@app.post("/api/tools/translate")
def tool_translate(data: ToolTranslateRequest):
    target = data.target_language.lower().strip()
    cleaned = data.text.strip().lower()

    # English -> Hindi translations for common words & phrases
    en_to_hi = {
        "water": ("पानी (Paani)", "Masculine noun (पुल्लिंग). Example: मुझे पानी चाहिए (Mujhe paani chahiye)."),
        "food": ("खाना (Khaana)", "Masculine noun. Example: खाना तैयार है (Khaana tayyar hai)."),
        "tea": ("चाय (Chaay)", "Feminine noun (स्त्रीलिंग). Example: मुझे एक कप चाय चाहिए (Mujhe ek cup chai chahiye)."),
        "friend": ("दोस्त / मित्र (Dost / Mitra)", "Common noun. Example: वह मेरा अच्छा दोस्त है (Woh mera accha dost hai)."),
        "hello": ("नमस्ते (Namaste)", "Respectful traditional Indian greeting used any time of day."),
        "thank you": ("धन्यवाद / शुक्रिया (Dhanyavaad / Shukriya)", "Polite expression of gratitude."),
        "good morning": ("शुभ प्रभात (Shubh Prabhaat) / नमस्ते", "Morning greeting. You can also simply say 'Namaste'."),
        "how are you": ("आप कैसे हैं? (Aap kaise hain?)", "Polite, respectful way to ask someone how they are."),
        "where are you going": ("आप कहाँ जा रहे हैं? (Aap kahaan ja rahe hain?)", "Used when asking someone's destination politely."),
        "what is your name": ("आपका नाम क्या है? (Aapka naam kya hai?)", "Polite way to inquire someone's name in Hindi."),
        "my name is": ("मेरा नाम ... है। (Mera naam ... hai.)", "Standard Hindi self-introduction structure."),
        "help": ("मदद / सहायता (Madad / Sahaayata)", "Feminine noun. Example: क्या आप मेरी मदद करेंगे? (Will you help me?)."),
        "book": ("किताब / पुस्तक (Kitaab / Pustak)", "Feminine noun. Example: यह मेरी किताब है (Yeh meri kitaab hai)."),
        "house": ("घर (Ghar)", "Masculine noun. Example: यह मेरा घर है (Yeh mera ghar hai)."),
        "home": ("घर (Ghar)", "Masculine noun. Example: मैं घर पर हूँ (Main ghar par hoon)."),
        "money": ("पैसे / रुपया (Paise / Rupaya)", "Plural masculine. Example: इसके कितने पैसे हुए? (How much money is this?)."),
        "time": ("समय / वक़्त (Samay / Waqt)", "Masculine noun. Example: क्या समय हुआ है? (What time is it?)."),
        "work": ("काम (Kaam)", "Masculine noun. Example: मैं काम कर रहा हूँ (Main kaam kar raha hoon)."),
        "come": ("आना (Aana)", "Verb. Example: यहाँ आइए (Yahaan aaiye - Come here politely)."),
        "go": ("जाना (Jaana)", "Verb. Example: अब हमें जाना चाहिए (Now we should go)."),
        "eat": ("खाना (Khaana)", "Verb. Example: आपने क्या खाया? (What did you eat?)."),
        "drink": ("पीना (Peena)", "Verb. Example: पानी पियो (Drink water).")
    }

    # English -> Japanese translations for common words & phrases
    en_to_ja = {
        "water": ("水 (みず / Mizu)", "Polite: お水 (O-mizu). Example: お水をください (O-mizu o kudasai - Water, please)."),
        "food": ("ご飯 / 食べ物 (Gohan / Tabemono)", "Gohan means rice or meal. Example: ご飯を食べます (Gohan o tabemasu)."),
        "tea": ("お茶 (おちゃ / O-cha)", "Green tea / tea. Example: お茶をどうぞ (O-cha o douzo - Please have some tea)."),
        "friend": ("友達 (ともだち / Tomodachi)", "Example: 彼は私の友達です (Kare wa watashi no tomodachi desu)."),
        "hello": ("こんにちは (Konnichiwa)", "Universal polite daytime greeting in Japan."),
        "thank you": ("ありがとうございます (Arigatou gozaimasu)", "Polite gratitude. Casual with friends: 'Arigatou'."),
        "good morning": ("おはようございます (Ohayou gozaimasu)", "Morning greeting. Casual: 'Ohayou'."),
        "good night": ("おやすみなさい (Oyasuminasai)", "Evening/bedtime polite farewell."),
        "how are you": ("お元気ですか？ (O-genki desu ka?)", "Polite greeting inquiry. Reply: 'Hai, genki desu!'."),
        "where are you going": ("どこへ行きますか？ (Doko e ikimasu ka?)", "Polite question asking destination."),
        "what is your name": ("お名前は何ですか？ (O-namae wa nan desu ka?)", "Polite way to ask someone's name."),
        "my name is": ("私の名前は ... です (Watashi no namae wa ... desu)", "Standard Japanese self-introduction."),
        "delicious": ("美味しい (おいしい / Oishii)", "Useful in any restaurant! Example: とても美味しいです (Totemo oishii desu)."),
        "help": ("助けて / 手伝って (Tasukete / Tetsudatte)", "Tasukete is emergency help; Tetsudatte is helping with a task."),
        "book": ("本 (ほん / Hon)", "Example: 本を読みます (Hon o yomimasu - I read a book)."),
        "house": ("家 (いえ / Ie)", "Example: 私の家 (Watashi no ie - My house)."),
        "home": ("家 (いえ / Ie)", "Example: 家に帰ります (Ie ni kaerimasu - I go home)."),
        "money": ("お金 (おかね / O-kane)", "Example: いくらですか？ (Ikura desu ka? - How much is it?)."),
        "time": ("時間 (じかん / Jikan)", "Example: 今何時ですか？ (Ima nan-ji desu ka? - What time is it now?)."),
        "work": ("仕事 (しごと / Shigoto)", "Example: 仕事に行きます (Shigoto ni ikimasu - I go to work)."),
        "come": ("来る / 来ます (Kuru / Kimasu)", "Polite request: 来てください (Kite kudasai - Please come)."),
        "go": ("行く / 行きます (Iku / Ikimasu)", "Example: 学校へ行きます (Gakkou e ikimasu - I go to school)."),
        "eat": ("食べる / 食べます (Taberu / Tabemasu)", "Example: ご飯を食べます (Gohan o tabemasu - I eat a meal)."),
        "drink": ("飲む / 飲みます (Nomu / Nomimasu)", "Example: 水を飲みます (Mizu o nomimasu - I drink water).")
    }

    phrases = {
        # Telugu phrases
        "nenu repu vasthanu": ("I will come tomorrow.", "Future simple action."),
        "nenu college ki velthunnanu": ("I am going to college.", "Present continuous action."),
        "naku ardham kaaledhu": ("I didn't understand / Could you please repeat that?", "Polite conversation request."),
        "meetho matladatam chala anandhanga undhi": ("It was great talking to you.", "Natural closing phrase."),
        "e roju naku chala pani undhi": ("I have a lot of work today.", "Expressing busy schedule."),
        # Hindi phrases
        "main kal aunga": ("I will come tomorrow.", "Future simple action."),
        "main kal aaunga": ("I will come tomorrow.", "Future simple action."),
        "main college ja raha hoon": ("I am going to college.", "Present continuous action."),
        "mujhe samajh nahi aaya": ("I didn't understand / Could you please repeat that?", "Polite conversation request."),
        "aapse baat karke accha laga": ("It was great talking to you.", "Natural closing phrase."),
        "aapse baat karke bohot accha laga": ("It was great talking to you.", "Natural closing phrase."),
        "aaj mujhe bohot kaam hai": ("I have a lot of work today.", "Expressing busy schedule."),
        "kya aap meri madad kar sakte hain": ("Could you please help me?", "Polite inquiry."),
        "mujhe english seekhni hai": ("I want to learn English.", "Expressing learning aspiration.")
    }

    if target in ["ja", "japanese", "jp"] and cleaned in en_to_ja:
        match = en_to_ja[cleaned]
        return {
            "original": data.text,
            "translated": match[0],
            "note": match[1]
        }

    if target == "hi" and cleaned in en_to_hi:
        match = en_to_hi[cleaned]
        return {
            "original": data.text,
            "translated": match[0],
            "note": match[1]
        }

    match = phrases.get(cleaned)
    if match:
        return {
            "original": data.text,
            "translated": match[0],
            "note": match[1]
        }

    if target in ["ja", "japanese", "jp"]:
        return {
            "original": data.text,
            "translated": f"In Japanese, '{data.text.capitalize()}' is translated with polite Kanji/Kana and Romaji.",
            "note": "Ask Maya directly in chat to get the exact pronunciation and daily Japanese sentence examples!"
        }

    if target == "hi":
        return {
            "original": data.text,
            "translated": f"In Hindi, '{data.text.capitalize()}' is translated naturally in context.",
            "note": "Ask Maya directly in chat to get the exact pronunciation and daily Hindi sentence examples!"
        }

    return {
        "original": data.text,
        "translated": f"In English, express this simply: '{data.text.capitalize()}'.",
        "note": "Speak with confidence! Simple words are always better than complex grammar."
    }

@app.post("/api/tools/simplify")
def tool_simplify(data: ToolSimplifyRequest):
    return {
        "original": data.text,
        "simplified": "Try saying: 'Let's keep it simple and clear.'",
        "tip": "Short sentences with Subject + Verb + Object are easiest to speak fluently."
    }

@app.get("/api/tools/daily-challenge")
def get_daily_challenge():
    challenges = [
        {
            "id": "c1",
            "title": "Introduce Yourself Confidently",
            "instruction": "Speak 3 sentences about your current work or study, one thing you enjoy, and your goal for this month.",
            "sample_start": "Hi, I'm currently working as...",
            "target_time_seconds": 45
        },
        {
            "id": "c2",
            "title": "Describe Your Favorite Weekend",
            "instruction": "Explain how you spent your last Sunday using simple past tense (e.g. woke up, visited, cooked, relaxed).",
            "sample_start": "Last Sunday, I had a very relaxing day...",
            "target_time_seconds": 60
        },
        {
            "id": "c3",
            "title": "Order at a Cafe",
            "instruction": "Order a hot cappuccino and ask if they have dairy-free milk or a snack recommendation.",
            "sample_start": "Hi there! Could I please get a cappuccino...",
            "target_time_seconds": 30
        }
    ]
    import random
    return random.choice(challenges)

# Mount frontend build if it exists
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
if os.path.exists(frontend_dist):
    from fastapi.staticfiles import StaticFiles
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")
