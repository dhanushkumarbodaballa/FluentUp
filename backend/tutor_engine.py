import re
import random
from typing import Dict, Any, List, Optional

# High-frequency Indian & Telugu-speaker English patterns with natural Telugu explanations
COMMON_PATTERNS = [
    {
        "tag": "Past Tense",
        "pattern": r"\b(yesterday|last (?:night|week|month|year))\s+(?:i|we|he|she|they)\s+(go|see|buy|eat|come|write|meet|give|take)\b",
        "handler": lambda m: {
            "original": m.group(0),
            "improved": m.group(0).replace(m.group(2), {
                "go": "went", "see": "saw", "buy": "bought", "eat": "ate",
                "come": "came", "write": "wrote", "meet": "met", "give": "gave", "take": "took"
            }.get(m.group(2), "past form")),
            "explanation_en": f"When talking about a finished past time like '{m.group(1)}', use the past tense of the verb.",
            "explanation_te": f"'{m.group(1)}' anedhi jarigipoyina samayam (past time). Andhukani '{m.group(2)}' badhulu past form vadali.",
            "practice": "Yesterday, I had a productive day."
        }
    },
    {
        "tag": "Auxiliary Verbs",
        "pattern": r"\b(did|didn't|did not)\s+(?:you|i|he|she|they|we)\s+(went|saw|bought|ate|came|wrote|met|told)\b",
        "handler": lambda m: {
            "original": m.group(0),
            "improved": m.group(0).replace(m.group(2), {
                "went": "go", "saw": "see", "bought": "buy", "ate": "eat",
                "came": "come", "wrote": "write", "met": "meet", "told": "tell"
            }.get(m.group(2), "base form")),
            "explanation_en": "After 'did' or 'didn't', always use the base form (V1), never the past tense.",
            "explanation_te": "'Did' or 'didn't' vachinappudu main verb eppudu simple base form (V1) lo undali. Rendu sarlu past tense vadakudadhu.",
            "practice": "Did you go to the market?"
        }
    },
    {
        "tag": "Possession",
        "pattern": r"\b(i am having|we are having|he is having|she is having)\s+(two|three|a|\d+)?\s*(brothers?|sisters?|cars?|bikes?|doubts?|laptops?|jobs?)\b",
        "handler": lambda m: {
            "original": m.group(0),
            "improved": m.group(0).replace("am having", "have").replace("is having", "has").replace("are having", "have"),
            "explanation_en": "To express possession or family relations, say 'I have' or 'He has', not 'having'.",
            "explanation_te": "Manaki sonthamga unnadi cheppadaniki 'am having' anadam thappu. Simple ga 'I have a doubt' leda 'I have a brother' ani cheppali.",
            "practice": "I have a question about this topic."
        }
    },
    {
        "tag": "Subject-Verb Agreement",
        "pattern": r"\b(he|she|it|my friend|my brother|my sister)\s+(don't|dont)\b",
        "handler": lambda m: {
            "original": m.group(0),
            "improved": m.group(0).replace(m.group(2), "doesn't"),
            "explanation_en": "For third-person singular (he, she, it, or singular noun), use 'doesn't' instead of 'don't'.",
            "explanation_te": "Third person singular (he, she, it, friend) tho 'don't' kaakunda 'doesn't' vadali.",
            "practice": f"{m.group(1).capitalize()} doesn't like tea."
        }
    },
    {
        "tag": "Time Phrases",
        "pattern": r"\b(today morning|yesterday night)\b",
        "handler": lambda m: {
            "original": m.group(0),
            "improved": "this morning" if "today" in m.group(0) else "last night",
            "explanation_en": "In native English, say 'this morning' instead of 'today morning', and 'last night' instead of 'yesterday night'.",
            "explanation_te": "Standard English lo 'today morning' badhulu 'this morning', 'yesterday night' badhulu 'last night' ani antaru.",
            "practice": "I woke up early this morning."
        }
    },
    {
        "tag": "Self Introduction",
        "pattern": r"\b(myself\s+[a-z]+)\b",
        "handler": lambda m: {
            "original": m.group(0),
            "improved": m.group(0).replace("myself", "I am").replace("Myself", "I am"),
            "explanation_en": "Do not start your introduction with 'Myself'. Say 'I am [Name]' or 'My name is [Name]'.",
            "explanation_te": "Parichayam cheppukonetappudu 'Myself...' anali anukuntaru, kani 'I am...' leda 'My name is...' anedhi correct formal English.",
            "practice": "Hello, I am Dhanush Kumar."
        }
    },
    {
        "tag": "Plural Forms",
        "pattern": r"\b(one of my friend|one of the student|one of my colleague)\b",
        "handler": lambda m: {
            "original": m.group(0),
            "improved": m.group(0).replace("friend", "friends").replace("student", "students").replace("colleague", "colleagues"),
            "explanation_en": "The phrase 'one of my...' is always followed by a plural noun (friends, colleagues).",
            "explanation_te": "'One of my...' tharvatha eppudu plural noun vadali (Friends lo okaru kabatti 'one of my friends').",
            "practice": "One of my friends recommended this book."
        }
    },
    {
        "tag": "Preposition Redundancy",
        "pattern": r"\b(discuss about|ordered for|order for)\b",
        "handler": lambda m: {
            "original": m.group(0),
            "improved": "discuss" if "discuss" in m.group(0) else "order / ordered",
            "explanation_en": "The verbs 'discuss' and 'order' do not take prepositions like 'about' or 'for'. Say 'discuss the project' and 'order coffee'.",
            "explanation_te": "'Discuss' tharvatha 'about' avasaram ledhu. Alage 'order' tharvatha 'for' vadakudadhu.",
            "practice": "Let's discuss the plan over coffee."
        }
    },
    {
        "tag": "Education & Graduation",
        "pattern": r"\b(passed out (?:of|from) college|pass out)\b",
        "handler": lambda m: {
            "original": m.group(0),
            "improved": "graduated from college / completed my degree",
            "explanation_en": "'Pass out' literally means to faint or lose consciousness. To say you completed your studies, use 'graduated from college'.",
            "explanation_te": "'Passed out' ante spruha thappi padipovadam ani ardam vastundi! Degree poorthi aithe 'graduated from college' anali.",
            "practice": "I graduated from university in 2024."
        }
    },
    {
        "tag": "Duration vs Starting Point",
        "pattern": r"\b(since\s+(?:two|three|four|five|several|\d+)\s+(?:days|weeks|months|years))\b",
        "handler": lambda m: {
            "original": m.group(0),
            "improved": m.group(0).replace("since", "for"),
            "explanation_en": "Use 'for' when referring to a duration of time (e.g. for two years), and 'since' for a starting point (e.g. since 2022).",
            "explanation_te": "Konni rojulu/samvathsaraala kalam cheppeppudu 'for' vadali ('for 2 years'). Specific year/date aithe 'since' vadali.",
            "practice": "I have been working here for two years."
        }
    },
    {
        "tag": "Indirect Questions",
        "pattern": r"\btell me what is your problem\b",
        "handler": lambda m: {
            "original": m.group(0),
            "improved": "Tell me what your problem is / What is the problem?",
            "explanation_en": "In indirect questions, the subject comes before the verb: 'what your problem is', not 'what is your problem'.",
            "explanation_te": "Indirect question lo verb chivarana vasthundi: 'what your problem is' anali.",
            "practice": "Could you tell me what the issue is?"
        }
    },
    {
        "tag": "Preposition Usage",
        "pattern": r"\b(explain me|tell to me)\b",
        "handler": lambda m: {
            "original": m.group(0),
            "improved": "explain to me" if "explain" in m.group(0) else "tell me",
            "explanation_en": "Say 'explain to me' or simply 'tell me'. 'Explain' requires 'to'.",
            "explanation_te": "'Explain me' anadam natural kadhu. 'Explain to me' leda 'Can you explain this?' ani cheppali.",
            "practice": "Could you explain this topic to me?"
        }
    },
    {
        "tag": "Verb Form",
        "pattern": r"\bi am agree\b",
        "handler": lambda m: {
            "original": "I am agree",
            "improved": "I agree",
            "explanation_en": "'Agree' is already a verb, so you do not need 'am'. Just say 'I agree'.",
            "explanation_te": "'Agree' anedhe oka verb. Kabatti 'am' avasaram ledhu. Simple ga 'I agree' ante saripothundhi.",
            "practice": "I agree with your point completely."
        }
    },
    {
        "tag": "Corporate Jargon",
        "pattern": r"\b(revert back|reply back|return back)\b",
        "handler": lambda m: {
            "original": m.group(0),
            "improved": "reply / get back to you" if "revert" in m.group(0) or "reply" in m.group(0) else "return",
            "explanation_en": "'Back' is redundant with 'revert', 'reply', or 'return'. Say 'I will reply' or 'I will get back to you'.",
            "explanation_te": "'Revert' lo ne malli cheppadam untundi. Malli 'back' kalapalsina avasaram ledhu. Simple ga 'I will reply' anali.",
            "practice": "I will review this and get back to you today."
        }
    },
    {
        "tag": "Native Idiom",
        "pattern": r"\b(out of station)\b",
        "handler": lambda m: {
            "original": "out of station",
            "improved": "out of town / away",
            "explanation_en": "'Out of station' is outdated Indian English. Native speakers worldwide say 'out of town' or 'away'.",
            "explanation_te": "Standard English lo 'out of station' badhulu 'I am out of town' ani antaru.",
            "practice": "I will be out of town this weekend."
        }
    },
    {
        "tag": "Polite Inquiry",
        "pattern": r"\b(what is your good name)\b",
        "handler": lambda m: {
            "original": "What is your good name?",
            "improved": "May I have your name, please? / What is your name?",
            "explanation_en": "In native English, simply ask 'What is your name?' or politely 'May I have your name, please?'",
            "explanation_te": "'Good name' anedhi direct Indian translation. English lo 'May I have your name, please?' anadam chala polite.",
            "practice": "May I know your name, please?"
        }
    },
    {
        "tag": "State Verbs",
        "pattern": r"\b(i am knowing|are you knowing)\b",
        "handler": lambda m: {
            "original": m.group(0),
            "improved": "I know" if "am knowing" in m.group(0) else "Do you know",
            "explanation_en": "'Know' is a state verb, so we never use it in the continuous (-ing) form.",
            "explanation_te": "'Know' anedhi state verb. Continuous (-ing) vadakudadhu. 'I know' ani anali.",
            "practice": "I know the answer."
        }
    }
]

def analyze_grammar(text: str) -> Optional[Dict[str, str]]:
    """Analyzes text for common mistakes and returns structured correction."""
    cleaned = text.strip()
    if not cleaned or len(cleaned) < 3:
        return None
    cleaned_lower = cleaned.lower()
    for item in COMMON_PATTERNS:
        match = re.search(item["pattern"], cleaned_lower)
        if match:
            res = item["handler"](match)
            if (
                res
                and isinstance(res, dict)
                and res.get("original")
                and res.get("improved")
                and str(res.get("original")).strip().lower() != str(res.get("improved")).strip().lower()
            ):
                return {
                    "original": str(res["original"]).strip(),
                    "improved": str(res["improved"]).strip(),
                    "explanation_en": str(res.get("explanation_en") or "").strip(),
                    "explanation_te": str(res.get("explanation_te") or "").strip(),
                    "practice": str(res.get("practice") or "").strip()
                }
    return None

class IntelligentTutorEngine:
    """
    Intelligent built-in conversational English tutor engine.
    Specializes in spoken English, Telugu+English bilingual explanations,
    natural conversational continuation, and gentle constructive corrections.
    """

    def __init__(self):
        self.tutor_name = "Maya"

    def generate_response(
        self,
        user_message: str,
        conversation_history: List[Dict[str, Any]],
        preferences: Dict[str, Any]
    ) -> Dict[str, Any]:
        text = user_message.strip()
        lower_text = text.lower()
        pref_lang = preferences.get("preferred_language", "en_te")

        # 1. Check for grammar correction opportunities
        correction = analyze_grammar(text)

        # 2. Greeting check - NO correction should ever be generated for clean greetings
        if lower_text in ["hi", "hello", "hey", "namaste", "good morning", "good evening", "good afternoon", "hi there"]:
            greeting_replies = [
                f"Hello! It's great to hear from you. I'm {self.tutor_name}, your personal English speaking coach. What would you like to talk about today?",
                f"Hi there! How is your day going? Ready to practice speaking together?",
                f"Hey! So glad you're here. Let's practice English with confidence. How was your day?"
            ]
            return {
                "reply": random.choice(greeting_replies),
                "correction": None,
                "suggested_replies": [
                    "Let's have a casual conversation.",
                    "Teach me everyday spoken phrases.",
                    "Practise a mock job interview."
                ],
                "intent": "greeting"
            }

        # 3. Handle specific intents
        # Interview practice
        if any(w in lower_text for w in ["interview", "job interview", "hr interview", "mock interview"]):
            return {
                "reply": "That's wonderful! Practicing job interviews will boost your confidence tremendously. Let's start with the most common opening question:\n\n'Tell me a little about yourself and your background.'\n\nTake your time and give a 2-3 sentence answer. Don't worry about grammar—I'll help you refine it!",
                "correction": correction,
                "suggested_replies": [
                    "I am a software engineer with 2 years of experience.",
                    "I recently graduated in Computer Science.",
                    "Could you give me an example answer first?"
                ],
                "intent": "interview"
            }

        # Telugu translation / explain in Telugu
        if any(w in lower_text for w in ["in telugu", "telugu lo", "telugu lo cheppu", "translate", "telugu meaning"]):
            return {
                "reply": "Kandhithamga! (Sure!) I'm happy to explain in Telugu.\n\nWhenever you learn a new sentence, connect the idea to your native thought, then practice saying it in English smoothly.\n\nEmi adagalankuntunnaru? (What would you like me to translate or explain?)",
                "correction": correction,
                "suggested_replies": [
                    "How to say 'Nenu repu vasthanu' in English?",
                    "Teach me everyday office phrases in Telugu + English.",
                    "Explain the difference between 'since' and 'for'."
                ],
                "intent": "telugu_support"
            }

        # Everyday English / Small talk
        if any(w in lower_text for w in ["everyday english", "daily conversation", "daily english", "teach me english"]):
            return {
                "reply": "Everyday English is all about natural, short sentences! Let's roleplay a casual situation: imagine we are meeting at a coffee shop or college.\n\n'Hey! It's so nice to see you. How has your day been so far?'",
                "correction": correction,
                "suggested_replies": [
                    "My day has been really busy, but good!",
                    "Pretty good! I was just attending classes.",
                    "A bit tiring, but I'm excited to practice English."
                ],
                "intent": "everyday_english"
            }

        # Confidence building
        if any(w in lower_text for w in ["confidence", "fear", "hesitate", "hesitation", "nervous"]):
            reply = "I understand completely. Many Telugu speakers feel hesitant or worry about making mistakes in English. But remember: communication is about expressing your idea, not perfection!\n\nEvery mistake you make here is a step towards speaking fluently. Let's start with a simple fun question: What is one movie or hobby you really enjoy?"
            if pref_lang == "en_te":
                reply += "\n\n(Mistakes gurinchi bhayam vaddu. Meetho nenu unnanu!)"
            return {
                "reply": reply,
                "correction": correction,
                "suggested_replies": [
                    "I love watching action movies.",
                    "I enjoy playing cricket with my friends.",
                    "How can I practice speaking every day?"
                ],
                "intent": "confidence"
            }

        # Standard conversation response with adaptive follow up
        conv_prompts = [
            ("That's interesting! Could you tell me a little more about that?", ["Sure, let me explain.", "That's all for now, what next?"]),
            ("I love that! When you talk about this, what do you enjoy most?", ["I like the friendly atmosphere.", "I enjoy learning new things."]),
            ("Great sentence! You expressed that very clearly. How often do you do this?", ["Almost every day.", "Only on weekends."]),
            ("Sounds awesome! If you were explaining this to a colleague at work, how would you describe it?", ["I would say it is very important.", "I would explain the main benefits."])
        ]
        chosen_prompt, suggested = random.choice(conv_prompts)

        # Build natural reply
        if correction:
            reply = f"Well said! I understood your point completely. {chosen_prompt}"
        else:
            acknowledgments = ["Nice!", "That makes total sense.", "I see!", "Wonderful!"]
            reply = f"{random.choice(acknowledgments)} {chosen_prompt}"

        # If user asked a direct question (why, how, what, where, can you)
        if any(lower_text.startswith(q) for q in ["why", "how", "what", "where", "when", "can you", "could you"]):
            if "difference" in lower_text or "vs" in lower_text:
                reply = "That's a classic English question! Let's break it down simply:\n\nOften, the difference comes down to context and time. Could you tell me which two words you're comparing, and I'll explain with Telugu examples?"
                suggested = ["Difference between 'Hear' and 'Listen'", "Difference between 'Say' and 'Tell'", "Difference between 'Since' and 'For'"]
            elif "say" in lower_text or "tell" in lower_text or "speak" in lower_text:
                reply = f"Here is a natural, conversational way to say it in English:\n\n'Could you please clarify this?' or 'I'd love to discuss this with you.'\n\nTry repeating it out loud once! How does it feel to say?"
                suggested = ["It feels natural!", "Could you repeat that more slowly?", "Give me another example."]
            else:
                reply = f"Great question! In English conversation, keeping sentences clear and short is always best.\n\nTo help you practice: what is your personal opinion on this topic?"
                suggested = ["In my opinion, it is useful.", "I have some doubts about it.", "Could you give me an example?"]

        return {
            "reply": reply,
            "correction": correction,
            "suggested_replies": suggested,
            "intent": "conversation"
        }
