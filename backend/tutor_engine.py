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
            "explanation_hi": f"'{m.group(1)}' beete hue samay (past time) ki baat karta hai. Isliye '{m.group(2)}' ki jagah past form use kijiye.",
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
            "explanation_hi": "'Did' ya 'didn't' aane par main verb hamesha base form (V1) me hoti hai. Double past tense use nahi karte.",
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
            "explanation_hi": "Possession ya sambandh batane ke liye 'am having' nahi, balki 'I have' ya 'He has' use karte hain.",
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
            "explanation_hi": "He, she, it ya singular noun ke sath 'don't' nahi, 'doesn't' lagate hain.",
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
            "explanation_hi": "Standard English me 'today morning' ki jagah 'this morning', aur 'yesterday night' ki jagah 'last night' bolte hain.",
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

def analyze_grammar(text: str, pref_lang: str = "en_te") -> Optional[Dict[str, str]]:
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
                exp_hi = str(res.get("explanation_hi") or "").strip()
                exp_te = str(res.get("explanation_te") or "").strip()
                if pref_lang == "en_hi":
                    native_exp = exp_hi or exp_te
                elif pref_lang == "en_only":
                    native_exp = ""
                else:
                    native_exp = exp_te or exp_hi

                return {
                    "original": str(res["original"]).strip(),
                    "improved": str(res["improved"]).strip(),
                    "explanation_en": str(res.get("explanation_en") or "").strip(),
                    "explanation_te": native_exp,
                    "explanation_hi": exp_hi,
                    "practice": str(res.get("practice") or "").strip()
                }
    return None

HINDI_TUTOR_DICTIONARY = {
    "water": {
        "dev": "पानी",
        "rom": "Paani",
        "gender": "Masculine noun (पुल्लिंग)",
        "tip": "In Hindi, water is grammatically masculine. So verbs and adjectives take masculine forms (e.g., 'paani thanda hai').",
        "ex1": ("मुझे पीने का पानी चाहिए।", "Mujhe peene ka paani chahiye.", "I want drinking water."),
        "ex2": ("क्या आप पानी पिएंगे?", "Kya aap paani piyenge?", "Would you like to drink water?"),
        "practice": "Mujhe ek glass paani chahiye"
    },
    "food": {
        "dev": "खाना",
        "rom": "Khaana",
        "gender": "Masculine noun (पुल्लिंग)",
        "tip": "'Khaana' is both the noun (food) and the verb (to eat).",
        "ex1": ("खाना बहुत स्वादिष्ट है!", "Khaana bohot swaadisht hai!", "The food is very delicious!"),
        "ex2": ("क्या आपने खाना खाया?", "Kya aapne khaana khaya?", "Did you eat food?"),
        "practice": "Khaana bohot swaadisht hai"
    },
    "tea": {
        "dev": "चाय",
        "rom": "Chaay",
        "gender": "Feminine noun (स्त्रीलिंग)",
        "tip": "'Chai' is grammatically feminine. So you say 'garam chai' and 'chai acchi hai'.",
        "ex1": ("मुझे एक कप गर्म चाय चाहिए।", "Mujhe ek cup garm chai chahiye.", "I want a cup of hot tea."),
        "ex2": ("क्या आप चाय पिएंगे?", "Kya aap chai piyenge?", "Will you have some tea?"),
        "practice": "Mujhe ek cup chai dijiye"
    },
    "friend": {
        "dev": "दोस्त / मित्र",
        "rom": "Dost / Mitra",
        "gender": "Common noun",
        "tip": "'Dost' is the most popular conversational word; 'Mitra' is more formal Hindi.",
        "ex1": ("वह मेरा सबसे अच्छा दोस्त है।", "Woh mera sabse accha dost hai.", "He is my best friend."),
        "ex2": ("हम अच्छे दोस्त हैं।", "Hum acche dost hain.", "We are good friends."),
        "practice": "Aap mere acche dost hain"
    },
    "thank you": {
        "dev": "धन्यवाद / शुक्रिया",
        "rom": "Dhanyavaad / Shukriya",
        "gender": "Greeting expression",
        "tip": "'Dhanyavaad' is formal/traditional; 'Shukriya' is warm everyday conversational Hindi.",
        "ex1": ("आपकी मदद के लिए बहुत-बहुत धन्यवाद।", "Aapki madad ke liye bohot-bohot dhanyavaad.", "Thank you very much for your help."),
        "ex2": ("शुक्रिया दोस्त!", "Shukriya dost!", "Thanks friend!"),
        "practice": "Bohot-bohot dhanyavaad"
    },
    "hello": {
        "dev": "नमस्ते",
        "rom": "Namaste / Pranaam",
        "gender": "Greeting expression",
        "tip": "'Namaste' is the timeless respectful Indian greeting, joining both hands together.",
        "ex1": ("नमस्ते! आप कैसे हैं?", "Namaste! Aap kaise hain?", "Hello! How are you?"),
        "ex2": ("नमस्ते, मेरा नाम धनुष है।", "Namaste, mera naam Dhanush hai.", "Hello, my name is Dhanush."),
        "practice": "Namaste! Aap kaise hain?"
    },
    "good morning": {
        "dev": "शुभ प्रभात / नमस्ते",
        "rom": "Shubh Prabhaat / Namaste",
        "gender": "Greeting expression",
        "tip": "'Shubh Prabhaat' is formal morning greeting. In daily spoken life, 'Namaste' is also universally used.",
        "ex1": ("शुभ प्रभात! आपका दिन मंगलमय हो।", "Shubh prabhaat! Aapka din mangalmay ho.", "Good morning! Have a wonderful day."),
        "ex2": ("सुप्रभात, आप कैसे हैं?", "Suprabhaat, aap kaise hain?", "Good morning, how are you?"),
        "practice": "Shubh prabhaat! Aaj ka din accha ho"
    },
    "good night": {
        "dev": "शुभ रात्रि",
        "rom": "Shubh Raatri",
        "gender": "Night greeting",
        "tip": "Said before going to sleep at night.",
        "ex1": ("शुभ रात्रि, अच्छे सपने देखें।", "Shubh raatri, acche sapne dekhein.", "Good night, sweet dreams."),
        "ex2": ("कल मिलते हैं, शुभ रात्रि।", "Kal milte hain, shubh raatri.", "See you tomorrow, good night."),
        "practice": "Shubh raatri, kal milte hain"
    },
    "book": {
        "dev": "किताब / पुस्तक",
        "rom": "Kitaab / Pustak",
        "gender": "Feminine noun (स्त्रीलिंग)",
        "tip": "'Kitaab' is feminine, so adjectives take feminine endings (e.g., 'acchi kitaab').",
        "ex1": ("यह मेरी पसंदीदा किताब है।", "Yeh meri pasandeeda kitaab hai.", "This is my favorite book."),
        "ex2": ("मैं एक नई किताब पढ़ रहा हूँ।", "Main ek nayi kitaab padh raha hoon.", "I am reading a new book."),
        "practice": "Main ek kitaab padh raha hoon"
    },
    "house": {
        "dev": "घर",
        "rom": "Ghar",
        "gender": "Masculine noun (पुल्लिंग)",
        "tip": "'Ghar' represents home and hearth.",
        "ex1": ("यह मेरा घर है।", "Yeh mera ghar hai.", "This is my home."),
        "ex2": ("मैं घर पर हूँ।", "Main ghar par hoon.", "I am at home."),
        "practice": "Mera ghar bohot sundar hai"
    },
    "home": {
        "dev": "घर",
        "rom": "Ghar",
        "gender": "Masculine noun (पुल्लिंग)",
        "tip": "'Ghar' is used for both home and house.",
        "ex1": ("मैं घर जा रहा हूँ।", "Main ghar ja raha hoon.", "I am going home."),
        "ex2": ("क्या आप घर पर हैं?", "Kya aap ghar par hain?", "Are you at home?"),
        "practice": "Main ghar ja raha hoon"
    },
    "help": {
        "dev": "मदद / सहायता",
        "rom": "Madad / Sahaayata",
        "gender": "Feminine noun (स्त्रीलिंग)",
        "tip": "'Madad' is feminine ('Aapki madad').",
        "ex1": ("क्या आप मेरी मदद कर सकते हैं?", "Kya aap meri madad kar sakte hain?", "Could you please help me?"),
        "ex2": ("मुझे आपकी मदद चाहिए।", "Mujhe aapki madad chahiye.", "I need your help."),
        "practice": "Kya aap meri madad karenge?"
    },
    "time": {
        "dev": "समय / वक़्त",
        "rom": "Samay / Waqt",
        "gender": "Masculine noun (पुल्लिंग)",
        "tip": "To ask the time in Hindi, say 'Kitne baje hain?' or 'Kya samay hua hai?'.",
        "ex1": ("अभी क्या समय हुआ है?", "Abhi kya samay hua hai?", "What time is it right now?"),
        "ex2": ("मेरे पास अभी समय नहीं है।", "Mere paas abhi samay nahi hai.", "I don't have time right now."),
        "practice": "Kitne baje hain?"
    },
    "money": {
        "dev": "पैसे / रुपया",
        "rom": "Paise / Rupaya",
        "gender": "Plural masculine",
        "tip": "'Paise' is used when shopping, paying fares, or discussing cost.",
        "ex1": ("इसके कितने पैसे हुए?", "Iske kitne paise hue?", "How much money does this cost?"),
        "ex2": ("मेरे पास खुले पैसे हैं।", "Mere paas khule paise hain.", "I have change."),
        "practice": "Iske kitne paise hue?"
    },
    "work": {
        "dev": "काम",
        "rom": "Kaam",
        "gender": "Masculine noun (पुल्लिंग)",
        "tip": "'Kaam' means work or job.",
        "ex1": ("मैं अभी काम कर रहा हूँ।", "Main abhi kaam kar raha hoon.", "I am working right now."),
        "ex2": ("आज मुझे बहुत काम है।", "Aaj mujhe bohot kaam hai.", "I have a lot of work today."),
        "practice": "Aaj mujhe bohot kaam hai"
    },
    "how are you": {
        "dev": "आप कैसे हैं?",
        "rom": "Aap kaise hain? (to male) / Aap kaisi hain? (to female)",
        "gender": "Respectful question",
        "tip": "'Aap' expresses polite respect. When speaking to close friends, you can say 'Tum kaise ho?'.",
        "ex1": ("नमस्ते! आप कैसे हैं?", "Namaste! Aap kaise hain?", "Hello! How are you?"),
        "ex2": ("मैं बिल्कुल ठीक हूँ, आप बताइए?", "Main bilkul theek hoon, aap bataiye?", "I am completely fine, what about you?"),
        "practice": "Main theek hoon, aap kaise hain?"
    },
    "where are you going": {
        "dev": "आप कहाँ जा रहे हैं?",
        "rom": "Aap kahaan ja rahe hain? (to male) / ja rahi hain? (to female)",
        "gender": "Conversational question",
        "tip": "Hindi verbs change ending with gender (-rahe for masculine, -rahi for feminine).",
        "ex1": ("आप इतनी जल्दी कहाँ जा रहे हैं?", "Aap itni jaldi kahaan ja rahe hain?", "Where are you going so early?"),
        "ex2": ("मैं कॉलेज जा रहा हूँ।", "Main college ja raha hoon.", "I am going to college."),
        "practice": "Main college ja raha hoon"
    },
    "what is your name": {
        "dev": "आपका नाम क्या है?",
        "rom": "Aapka naam kya hai?",
        "gender": "Respectful question",
        "tip": "Reply with 'Mera naam ... hai' (My name is ...).",
        "ex1": ("नमस्ते! आपका नाम क्या है?", "Namaste! Aapka naam kya hai?", "Hello! What is your name?"),
        "ex2": ("मेरा नाम धनुष है।", "Mera naam Dhanush hai.", "My name is Dhanush."),
        "practice": "Mera naam Maya hai"
    },
    "sleep": {
        "dev": "सोना / नींद",
        "rom": "Sona / Neend",
        "gender": "Verb / Feminine noun",
        "tip": "'Mujhe neend aa rahi hai' means 'I am feeling sleepy'.",
        "ex1": ("मुझे अब सोना चाहिए।", "Mujhe ab sona chahiye.", "I should sleep now."),
        "ex2": ("मुझे बहुत तेज़ नींद आ रही है।", "Mujhe bohot tez neend aa rahi hai.", "I am feeling very sleepy."),
        "practice": "Mujhe neend aa rahi hai"
    },
    "eat": {
        "dev": "खाना",
        "rom": "Khaana",
        "gender": "Verb",
        "tip": "'Maine khaya' (I ate), 'Main kha raha hoon' (I am eating).",
        "ex1": ("आइए साथ मिलकर खाना खाते हैं।", "Aaiye saath milkar khaana khaate hain.", "Come, let's eat together."),
        "ex2": ("आपने नाश्ता किया?", "Aapne naashta kiya?", "Did you have breakfast?"),
        "practice": "Maine khaana kha liya"
    },
    "drink": {
        "dev": "पीना",
        "rom": "Peena",
        "gender": "Verb",
        "tip": "'Paani piyo' (drink water), 'Chai peena' (to drink tea).",
        "ex1": ("गर्म पानी पीजिए।", "Garm paani peejiye.", "Drink warm water."),
        "ex2": ("मैं चाय पी रहा हूँ।", "Main chai pee raha hoon.", "I am drinking tea."),
        "practice": "Main paani pee raha hoon"
    },
    "go": {
        "dev": "जाना",
        "rom": "Jaana",
        "gender": "Verb",
        "tip": "'Jao' (informal), 'Jaaiye' (polite).",
        "ex1": ("मुझे बाज़ार जाना है।", "Mujhe bazaar jaana hai.", "I have to go to the market."),
        "ex2": ("हम सब साथ जाएंगे।", "Hum sab saath jaayenge.", "We will all go together."),
        "practice": "Mujhe abhi jaana hai"
    },
    "come": {
        "dev": "आना",
        "rom": "Aana",
        "gender": "Verb",
        "tip": "'Aao' (informal), 'Aaiye' (polite).",
        "ex1": ("कृपया अंदर आइए।", "Kripya andar aaiye.", "Please come inside."),
        "ex2": ("मैं कल सुबह आऊंगा।", "Main kal subah aaunga.", "I will come tomorrow morning."),
        "practice": "Kripya andar aaiye"
    },
    "speak": {
        "dev": "बोलना",
        "rom": "Bolna",
        "gender": "Verb",
        "tip": "'Bolna' means to speak.",
        "ex1": ("क्या आप हिंदी बोल सकते हैं?", "Kya aap Hindi bol sakte hain?", "Can you speak Hindi?"),
        "ex2": ("थोड़ा धीरे बोलिए।", "Thoda dheere boliye.", "Please speak a bit slowly."),
        "practice": "Main Hindi bol sakta hoon"
    },
    "learn": {
        "dev": "सीखना",
        "rom": "Seekhna",
        "gender": "Verb",
        "tip": "'Seekhna' means to learn.",
        "ex1": ("मैं हिंदी बोलना सीख रहा हूँ।", "Main Hindi bolna seekh raha hoon.", "I am learning to speak Hindi."),
        "ex2": ("हिंदी सीखना बहुत आसान है।", "Hindi seekhna bohot aasaan hai.", "Learning Hindi is very easy."),
        "practice": "Main roz Hindi seekhta hoon"
    }
}

JAPANESE_TUTOR_DICTIONARY = {
    "water": {
        "kanji": "水",
        "kana": "みず",
        "rom": "Mizu / O-mizu",
        "tip": "Usually spoken politely as 'お水' (O-mizu) in restaurants and conversations.",
        "ex1": ("お水をください。", "O-mizu o kudasai.", "Please give me water."),
        "ex2": ("冷たいお水を飲みますか？", "Tsumetai o-mizu o nomimasu ka?", "Would you like to drink cold water?"),
        "practice": "O-mizu o kudasai"
    },
    "food": {
        "kanji": "食べ物",
        "kana": "たべもの",
        "rom": "Tabemono",
        "tip": "'Taberu' is the verb to eat. 'Gohan' is also used for a meal/rice.",
        "ex1": ("日本の食べ物はとても美味しいです。", "Nihon no tabemono wa totemo oishii desu.", "Japanese food is very delicious."),
        "ex2": ("好きな食べ物は何ですか？", "Sukina tabemono wa nan desu ka?", "What is your favorite food?"),
        "practice": "Tabemono wa totemo oishii desu"
    },
    "tea": {
        "kanji": "お茶",
        "kana": "おちゃ",
        "rom": "O-cha",
        "tip": "Often refers to Japanese green tea, prefixed with the polite 'O-'.",
        "ex1": ("温かいお茶をどうぞ。", "Atatakai o-cha o douzo.", "Please have some warm tea."),
        "ex2": ("お茶を飲みましょう。", "O-cha o nomimashou.", "Let's drink tea."),
        "practice": "O-cha o kudasai"
    },
    "friend": {
        "kanji": "友達",
        "kana": "ともだち",
        "rom": "Tomodachi",
        "tip": "'Tomodachi' is the standard everyday word for friend.",
        "ex1": ("彼は私の友達です。", "Kare wa watashi no tomodachi desu.", "He is my friend."),
        "ex2": ("友達と一緒に勉強します。", "Tomodachi to issho ni benkyou shimasu.", "I study together with my friend."),
        "practice": "Watashi no tomodachi desu"
    },
    "thank you": {
        "kanji": "ありがとうございます",
        "kana": "ありがとうございます",
        "rom": "Arigatou gozaimasu",
        "tip": "Polite everyday gratitude. With close friends, you can just say 'Arigatou' or 'Doumo'.",
        "ex1": ("手伝ってくれてありがとうございます。", "Tetsudatte kurete arigatou gozaimasu.", "Thank you very much for helping me."),
        "ex2": ("いつもありがとうございます！", "Itsumo arigatou gozaimasu!", "Thank you as always!"),
        "practice": "Arigatou gozaimasu"
    },
    "hello": {
        "kanji": "こんにちは",
        "kana": "こんにちは",
        "rom": "Konnichiwa",
        "tip": "Daytime greeting used from late morning to late afternoon.",
        "ex1": ("皆さん、こんにちは！", "Minasan, konnichiwa!", "Hello everyone!"),
        "ex2": ("こんにちは、お元気ですか？", "Konnichiwa, o-genki desu ka?", "Hello, how are you?"),
        "practice": "Konnichiwa, o-genki desu ka?"
    },
    "good morning": {
        "kanji": "おはようございます",
        "kana": "おはようございます",
        "rom": "Ohayou gozaimasu",
        "tip": "Standard morning greeting. Friends and family simply say 'Ohayou'.",
        "ex1": ("おはようございます！今日も一日頑張りましょう。", "Ohayou gozaimasu! Kyou mo ichinichi ganbarimashou.", "Good morning! Let's do our best today."),
        "ex2": ("先生、おはようございます。", "Sensei, ohayou gozaimasu.", "Good morning, teacher."),
        "practice": "Ohayou gozaimasu!"
    },
    "good night": {
        "kanji": "おやすみなさい",
        "kana": "おやすみなさい",
        "rom": "Oyasuminasai",
        "tip": "Farewell before going to bed. Casual version is 'Oyasumi'.",
        "ex1": ("おやすみなさい、良い夢を。", "Oyasuminasai, yoi yume o.", "Good night, sweet dreams."),
        "ex2": ("また明日、おやすみなさい。", "Mata ashita, oyasuminasai.", "See you tomorrow, good night."),
        "practice": "Oyasuminasai, mata ashita"
    },
    "book": {
        "kanji": "本",
        "kana": "ほん",
        "rom": "Hon",
        "tip": "'Hon o yomu' means to read a book.",
        "ex1": ("この本はとても面白いです。", "Kono hon wa totemo omoshiroi desu.", "This book is very interesting."),
        "ex2": ("私は日本語の本を読んでいます。", "Watashi wa Nihongo no hon o yonde imasu.", "I am reading a Japanese book."),
        "practice": "Hon o yonde imasu"
    },
    "house": {
        "kanji": "家",
        "kana": "いえ / うち",
        "rom": "Ie / Uchi",
        "tip": "'Uchi' is used when talking about one's own home, 'Ie' is general house.",
        "ex1": ("私の家へようこそ！", "Watashi no ie e youkoso!", "Welcome to my house!"),
        "ex2": ("早く家に帰りたいです。", "Hayaku ie ni kaeritai desu.", "I want to go home early."),
        "practice": "Uchi ni kaerimasu"
    },
    "home": {
        "kanji": "家",
        "kana": "うち",
        "rom": "Uchi / Ie",
        "tip": "'Uchi' represents warm home.",
        "ex1": ("家に帰りましょう。", "Ie ni kaerimashou.", "Let's go home."),
        "ex2": ("今、家にいます。", "Ima, ie ni imasu.", "I am at home right now."),
        "practice": "Ie ni kaerimasu"
    },
    "help": {
        "kanji": "手伝い / 助け",
        "kana": "てつだい / たすけ",
        "rom": "Tetsudai / Tasuke",
        "tip": "'Tetsudatte kudasai' means 'Please help me'. 'Tasukete!' is an urgent cry for help.",
        "ex1": ("手伝っていただけますか？", "Tetsudatte itadakemasu ka?", "Could you please help me?"),
        "ex2": ("何か手伝いましょうか？", "Nanika tetsudaimashou ka?", "Shall I help you with anything?"),
        "practice": "Tetsudatte kudasai"
    },
    "time": {
        "kanji": "時間",
        "kana": "じかん",
        "rom": "Jikan",
        "tip": "'Ima nan-ji desu ka?' asks 'What time is it now?'.",
        "ex1": ("今、何時ですか？", "Ima, nan-ji desu ka?", "What time is it right now?"),
        "ex2": ("今は時間がありません。", "Ima wa jikan ga arimasen.", "I don't have time right now."),
        "practice": "Ima, nan-ji desu ka?"
    },
    "money": {
        "kanji": "お金",
        "kana": "おかね",
        "rom": "O-kane",
        "tip": "Usually prefixed with polite 'O-'. 'Ikura desu ka?' asks 'How much is this?'.",
        "ex1": ("これはいくらですか？", "Kore wa ikura desu ka?", "How much is this?"),
        "ex2": ("お金を払います。", "O-kane o haraimasu.", "I will pay the money."),
        "practice": "Kore wa ikura desu ka?"
    },
    "work": {
        "kanji": "仕事",
        "kana": "しごと",
        "rom": "Shigoto",
        "tip": "'Shigoto o suru' means to work. 'Otsukaresama desu' praises someone's hard work.",
        "ex1": ("私は今仕事をしています。", "Watashi wa ima shigoto o shite imasu.", "I am working right now."),
        "ex2": ("お仕事、お疲れ様です！", "O-shigoto, otsukaresama desu!", "Thank you for your hard work!"),
        "practice": "Ima shigoto o shite imasu"
    },
    "delicious": {
        "kanji": "美味しい",
        "kana": "おいしい",
        "rom": "Oishii",
        "tip": "I-adjective. Casual exclamation is 'Umai!' or 'Oishii!'.",
        "ex1": ("このラーメンは本当に美味しいです！", "Kono raamen wa hontou ni oishii desu!", "This ramen is really delicious!"),
        "ex2": ("とても美味しいですね。", "Totemo oishii desu ne.", "It is very delicious, isn't it?"),
        "practice": "Hontou ni oishii desu!"
    },
    "how are you": {
        "kanji": "お元気ですか？",
        "kana": "おげんきですか？",
        "rom": "O-genki desu ka?",
        "tip": "Polite greeting. The standard reply is 'Hai, genki desu' (Yes, I am fine).",
        "ex1": ("お久しぶりです、お元気ですか？", "O-hisashiburi desu, o-genki desu ka?", "Long time no see, how are you?"),
        "ex2": ("はい、とても元気です！", "Hai, totemo genki desu!", "Yes, I am doing great!"),
        "practice": "Hai, totemo genki desu!"
    },
    "where are you going": {
        "kanji": "どこへ行きますか？",
        "kana": "どこへいきますか？",
        "rom": "Doko e ikimasu ka?",
        "tip": "The particle 'e' (written as へ) indicates destination direction.",
        "ex1": ("今からどこへ行きますか？", "Ima kara doko e ikimasu ka?", "Where are you going from now?"),
        "ex2": ("駅へ行きます。", "Eki e ikimasu.", "I am going to the station."),
        "practice": "Eki e ikimasu"
    },
    "what is your name": {
        "kanji": "お名前は何ですか？",
        "kana": "おなまえはなんですか？",
        "rom": "O-namae wa nan desu ka?",
        "tip": "Reply with 'Watashi no namae wa [Name] desu'.",
        "ex1": ("初めまして、お名前は何ですか？", "Hajimemashite, o-namae wa nan desu ka?", "Nice to meet you, what is your name?"),
        "ex2": ("私の名前はマヤです。", "Watashi no namae wa Maya desu.", "My name is Maya."),
        "practice": "Watashi no namae wa Maya desu"
    },
    "eat": {
        "kanji": "食べる",
        "kana": "たべる",
        "rom": "Taberu (polite: Tabemasu)",
        "tip": "Before eating, Japanese people say 'Itadakimasu'.",
        "ex1": ("一緒にご飯を食べましょう！", "Issho ni gohan o tabemashou!", "Let's eat a meal together!"),
        "ex2": ("朝ごはんを食べましたか？", "Asagohan o tabemashita ka?", "Did you eat breakfast?"),
        "practice": "Gohan o tabemasu"
    },
    "drink": {
        "kanji": "飲む",
        "kana": "のむ",
        "rom": "Nomu (polite: Nomimasu)",
        "tip": "When cheering a drink, say 'Kanpai!'.",
        "ex1": ("冷たいお茶を飲みます。", "Tsumetai o-cha o nomimasu.", "I drink cold tea."),
        "ex2": ("コーヒーを飲みますか？", "Koohii o nomimasu ka?", "Will you drink coffee?"),
        "practice": "O-mizu o nomimasu"
    },
    "go": {
        "kanji": "行く",
        "kana": "いく",
        "rom": "Iku (polite: Ikimasu)",
        "tip": "'Ikimashou!' means 'Let's go!'.",
        "ex1": ("学校へ行きます。", "Gakkou e ikimasu.", "I am going to school."),
        "ex2": ("一緒に行きましょう！", "Issho ni ikimashou!", "Let's go together!"),
        "practice": "Issho ni ikimashou"
    },
    "come": {
        "kanji": "来る",
        "kana": "くる",
        "rom": "Kuru (polite: Kimasu)",
        "tip": "'Kite kudasai' means 'Please come'.",
        "ex1": ("こちらへ来てください。", "Kochira e kite kudasai.", "Please come this way."),
        "ex2": ("明日また来ます。", "Ashita mata kimasu.", "I will come again tomorrow."),
        "practice": "Kochira e kite kudasai"
    },
    "speak": {
        "kanji": "話す",
        "kana": "はなす",
        "rom": "Hanasu (polite: Hanashimasu)",
        "tip": "'Nihongo o hanasemasu ka?' means 'Can you speak Japanese?'.",
        "ex1": ("日本語を話せますか？", "Nihongo o hanasemasu ka?", "Can you speak Japanese?"),
        "ex2": ("ゆっくり話してください。", "Yukkuri hanashite kudasai.", "Please speak slowly."),
        "practice": "Nihongo o benkyou shite imasu"
    },
    "learn": {
        "kanji": "学ぶ / 勉強する",
        "kana": "まなぶ / べんきょうする",
        "rom": "Manabu / Benkyou suru",
        "tip": "'Benkyou shite imasu' means 'I am studying'.",
        "ex1": ("私は毎日日本語を勉強しています。", "Watashi wa mainichi Nihongo o benkyou shite imasu.", "I study Japanese every day."),
        "ex2": ("日本語を学ぶのは楽しいです！", "Nihongo o manabu no wa tanoshii desu!", "Learning Japanese is fun!"),
        "practice": "Mainichi Nihongo o benkyou shimasu"
    }
}

# Structured Beginner Curriculum for Japanese from Basics
JAPANESE_BASICS_LESSONS = {
    1: {
        "title": "Lesson 1: Japanese Foundations & Essential Greetings",
        "description": "How Japanese sounds work and the 6 golden greetings",
        "content": (
            "🌸 **Japanese Basics — Lesson 1: How Japanese Works & Essential Greetings (挨拶)**\n\n"
            "Welcome to learning Japanese from the basics! Here are the 3 foundational rules to speak Japanese easily:\n"
            "1. **5 Pure Vowels:** Japanese uses only 5 crisp vowel sounds: **A** (ah), **I** (ee), **U** (oo), **E** (eh), **O** (oh).\n"
            "2. **Romaji (Alphabet):** We provide Romaji (English letters) next to every word so you can read and pronounce it right away!\n"
            "3. **Politeness:** Adding *'Gozaimasu'* or *'Desu'* shows respect and makes your speech natural and polite.\n\n"
            "🗣️ **The 6 Golden Greetings Every Learner Must Know:**\n"
            "1. **こんにちは** (*Konnichiwa*) — Hello / Good day\n"
            "   *(Tip: The ending 'wa' is written with the Hiragana 'ha', pronounced 'wa')*\n"
            "2. **おはようございます** (*Ohayou gozaimasu*) — Good morning (Polite)\n"
            "   *(Casual with friends: just 'Ohayou')*\n"
            "3. **こんばんは** (*Konbanwa*) — Good evening\n"
            "4. **ありがとうございます** (*Arigatou gozaimasu*) — Thank you very much\n"
            "   *(Casual: 'Arigatou' or 'Doumo')*\n"
            "5. **すみません** (*Sumimasen*) — Excuse me / Sorry / Pardon\n"
            "   *(Super useful: in cafes, asking for help, or getting someone's attention!)*\n"
            "6. **さようなら** (*Sayounara*) — Goodbye\n"
            "   *(Casual with friends: 'Jaa ne' or 'Mata ne' - See you later!)*\n\n"
            "👉 **Speaking Drill:** Repeat out loud 3 times:\n"
            "✨ *'Arigatou gozaimasu'* (Thank you very much!)\n"
            "✨ *'Sumimasen'* (Excuse me!)\n\n"
            "Whenever you're ready, say **'Next lesson'** or tap **'Start Lesson 2'** below!"
        ),
        "suggested_replies": [
            "Start Lesson 2: Self-Introduction",
            "How to pronounce 'Arigatou gozaimasu'?",
            "How to say 'Excuse me' in Japanese?"
        ]
    },
    2: {
        "title": "Lesson 2: Self-Introduction (Hajimemashite)",
        "description": "Introduce yourself naturally in Japanese",
        "content": (
            "🙋‍♂️ **Japanese Basics — Lesson 2: Self-Introduction (自己紹介 - Jiko Shoukai)**\n\n"
            "When meeting someone in Japan for the first time, you use this magical 3-step introduction:\n\n"
            "**Step 1: The Opening**\n"
            "• **初めまして** (*Hajimemashite*)\n"
            "  Meaning: 'Nice to meet you' (Only used the very first time you meet someone).\n\n"
            "**Step 2: State Your Name**\n"
            "• **私は [Your Name] です** (*Watashi wa [Name] desu*)\n"
            "  - **私 (Watashi)** = I / Me\n"
            "  - **は (wa)** = Topic particle (marks the topic: 'As for me...')\n"
            "  - **です (desu)** = Am / Is (polite copula, sounds like 'dess')\n"
            "  *Example:* 私はダヌシュです。 (*Watashi wa Dhanush desu.*) — 'I am Dhanush.'\n\n"
            "**Step 3: The Polite Closing**\n"
            "• **よろしくお願いします** (*Yoroshiku onegaishimasu*)\n"
            "  Meaning: 'Please treat me kindly / Looking forward to working with you.' (Essential Japanese social etiquette!).\n\n"
            "💬 **Full Self-Introduction Example:**\n"
            "\"初めまして！ 私はダヌシュです。 よろしくお願いします！\"\n"
            "*(Hajimemashite! Watashi wa Dhanush desu. Yoroshiku onegaishimasu!)*\n\n"
            "👉 **Speaking Drill:** Try introducing yourself! Say:\n"
            "✨ *'Hajimemashite! Watashi wa [your name] desu.'*\n\n"
            "Ready for Lesson 3 (Numbers 1 to 10)?"
        ),
        "suggested_replies": [
            "Start Lesson 3: Numbers 1 to 10",
            "What does 'Yoroshiku onegaishimasu' mean?",
            "How do I say 'I am from India / America'?"
        ]
    },
    3: {
        "title": "Lesson 3: Numbers 1 to 10 (数字 - Sūji)",
        "description": "Master Japanese numbers and counting easily",
        "content": (
            "🔢 **Japanese Basics — Lesson 3: Numbers 1 to 10 (数字 - Sūji)**\n\n"
            "Counting in Japanese is rhythmic and very easy to remember! Let's learn 1 to 10:\n\n"
            "• **1:** 一 (いち / *Ichi*)\n"
            "• **2:** 二 (に / *Ni*)\n"
            "• **3:** 三 (さん / *San*)\n"
            "• **4:** 四 (よん / *Yon* or し / *Shi*)\n"
            "• **5:** 五 (ご / *Go*)\n"
            "• **6:** 六 (ろく / *Roku*)\n"
            "• **7:** 七 (なな / *Nana* or しち / *Shichi*)\n"
            "• **8:** 八 (はち / *Hachi*)\n"
            "• **9:** 九 (きゅう / *Kyuu* or く / *Ku*)\n"
            "• **10:** 十 (じゅう / *Juu*)\n\n"
            "💡 **Bonus Magic Trick (11 to 20):**\n"
            "Japanese numbers are modular! Just combine 10 + number:\n"
            "- 11 = 10 + 1 → **十 一** (*Juu-ichi*)\n"
            "- 12 = 10 + 2 → **十 二** (*Juu-ni*)\n"
            "- 15 = 10 + 5 → **十 五** (*Juu-go*)\n"
            "- 20 = 2 × 10 → **二 十** (*Ni-juu*)\n"
            "- 30 = 3 × 10 → **三 十** (*San-juu*)\n\n"
            "👉 **Speaking Drill:** Count out loud from 1 to 5: *'Ichi, Ni, San, Yon, Go!'*\n\n"
            "Ready for Lesson 4 (Daily Survival Words & 'Please')?"
        ),
        "suggested_replies": [
            "Start Lesson 4: Daily Survival Words & Please",
            "How do I say 50 or 100 in Japanese?",
            "Practice counting 1 to 10 again."
        ]
    },
    4: {
        "title": "Lesson 4: Daily Survival Words & Asking 'Please' (Kudasai)",
        "description": "Essential everyday words and ordering politely",
        "content": (
            "🍵 **Japanese Basics — Lesson 4: Daily Survival Words & Asking 'Please'**\n\n"
            "With just a few survival words and one golden phrase, you can navigate any Japanese restaurant, cafe, or store!\n\n"
            "**Key Survival Vocabulary:**\n"
            "• **はい** (*Hai*) — Yes / Understood\n"
            "• **いいえ** (*Iie*) — No / Not at all\n"
            "• **水** (みず / *Mizu*) — Water (Polite: お水 *O-mizu*)\n"
            "• **お茶** (おちゃ / *O-cha*) — Green tea\n"
            "• **ご飯** (ごはん / *Gohan*) — Meal / Rice / Food\n"
            "• **これ** (*Kore*) — This (near you)\n"
            "• **それ** (*Sore*) — That (near the listener)\n\n"
            "✨ **The Magic Request Formula:**\n"
            "**[Item] + をください ([Item] o kudasai) = 'Please give me [Item]'**\n\n"
            "Examples:\n"
            "1. **お水をください。** (*O-mizu o kudasai.*) — Please give me water.\n"
            "2. **お茶をください。** (*O-cha o kudasai.*) — Please give me green tea.\n"
            "3. **これをください。** (*Kore o kudasai.*) — Please give me this (Point at menu/item!).\n\n"
            "👉 **Speaking Drill:** Imagine you are in Tokyo. Say out loud:\n"
            "✨ *'Kore o kudasai'* (Please give me this!).\n\n"
            "Ready for Lesson 5 (Essential Questions with 'ka')?"
        ),
        "suggested_replies": [
            "Start Lesson 5: Essential Questions with 'ka'",
            "How to say 'Check please' in Japanese?",
            "How to say 'Is this delicious?' in Japanese?"
        ]
    },
    5: {
        "title": "Lesson 5: Essential Questions & The Magic Particle 'か' (ka)",
        "description": "Turn any sentence into a question and ask where things are",
        "content": (
            "❓ **Japanese Basics — Lesson 5: Essential Questions & The Magic Particle 'か' (ka)**\n\n"
            "In English, making a question requires changing word order (*'It is'* → *'Is it?'*).\n"
            "In Japanese, it is much easier: **just add 'か' (ka) at the end of any statement!**\n\n"
            "**Top 5 Essential Questions for Beginners:**\n"
            "1. **これは何ですか？** (*Kore wa nan desu ka?*)\n"
            "   → 'What is this?' *(Point at anything!)*\n"
            "2. **トイレはどこですか？** (*Toire wa doko desu ka?*)\n"
            "   → 'Where is the restroom?' *(Lifesaver when traveling!)*\n"
            "3. **いくらですか？** (*Ikura desu ka?*)\n"
            "   → 'How much is it?' *(Essential for shopping)*\n"
            "4. **大丈夫ですか？** (*Daijoubu desu ka?*)\n"
            "   → 'Are you okay?' / 'Is everything alright?'\n"
            "5. **日本語を話せますか？** (*Nihongo o hanasemasu ka?*)\n"
            "   → 'Can you speak Japanese?'\n\n"
            "💡 **Bonus Answer:** If someone asks *'Daijoubu desu ka?'*, you can simply smile and reply: **'Hai, daijoubu desu!'** (Yes, I'm okay!).\n\n"
            "👉 **Speaking Drill:** Ask me: *'Toire wa doko desu ka?'* or *'Kore wa nan desu ka?'*\n\n"
            "Ready for Lesson 6 (Japanese Sentence Structure & Word Order)?"
        ),
        "suggested_replies": [
            "Start Lesson 6: Sentence Order & Structure",
            "How to ask 'Where is the train station?'",
            "Practice asking 'How much is this?'"
        ]
    },
    6: {
        "title": "Lesson 6: Japanese Sentence Structure (Subject + Object + Verb)",
        "description": "Understand how Japanese sentences are built like LEGO blocks",
        "content": (
            "🧩 **Japanese Basics — Lesson 6: Sentence Structure (SOV Order)**\n\n"
            "Congratulations on reaching Lesson 6! Now you understand how full Japanese sentences work.\n\n"
            "**The Golden Rule of Japanese Grammar:**\n"
            "• In English: **Subject + Verb + Object** (*I drink water*)\n"
            "• In Japanese: **Subject + Object + Verb** (*I water drink*) — **Verb is ALWAYS at the end!**\n\n"
            "**The 2 Essential Connectors (Particles):**\n"
            "1. **は** (*wa*) = Marks the Subject/Topic (\"As for...\")\n"
            "2. **を** (*o*) = Marks the Object (the thing being acted on)\n\n"
            "💬 **Look how clean and modular it is:**\n"
            "1. **私は水を飲みます。**\n"
            "   *Watashi wa mizu o nomimasu.*\n"
            "   → I (Watashi wa) + water (mizu o) + drink (nomimasu).\n\n"
            "2. **私はご飯を食べます。**\n"
            "   *Watashi wa gohan o tabemasu.*\n"
            "   → I + meal + eat.\n\n"
            "3. **私は日本語を勉強します。**\n"
            "   *Watashi wa Nihongo o benkyou shimasu.*\n"
            "   → I + Japanese + study.\n\n"
            "🎉 **You now know the core foundation of the Japanese language!**\n"
            "From here, you can speak or type any word or phrase, and I will translate it, teach pronunciation, and practice daily conversations with you!\n\n"
            "👉 **Final Drill:** Say: *'Watashi wa Nihongo o benkyou shimasu'* (I study Japanese!)."
        ),
        "suggested_replies": [
            "How to say 'Delicious' in Japanese?",
            "How to say 'Friend' in Japanese?",
            "Review Lesson 1: Essential Greetings"
        ]
    }
}

class IntelligentTutorEngine:
    """
    Intelligent built-in conversational tutor engine.
    Supports English Speaking Coaching, Hindi Tutoring, and Japanese Tutoring with word translations,
    pronunciation guides, grammar notes, and daily spoken practice.
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
        learning_target = preferences.get("learning_target", "english")

        # Check if user is in Japanese Tutor mode OR explicitly asking for Japanese translation / basics
        is_japanese_mode = (learning_target == "japanese") or any(w in lower_text for w in [
            "in japanese", "to japanese", "into japanese", "translate in japanese", "translate to japanese",
            "japanese meaning", "japanese tutor", "learn japanese", "how to say in japanese",
            "nihongo", "in nihongo", "japanese basics"
        ])

        # --- JAPANESE TUTOR MODE HANDLER ---
        if is_japanese_mode:
            # Check if user wants to learn from basics or asks for a specific lesson
            basics_triggers = [
                "basic", "basics", "from basics", "learn from basics", "teach me from basics",
                "learn me from basics", "start from basics", "learn japanese from basics",
                "teach japanese from basics", "beginner", "start from beginning", "first lesson",
                "start learning from basics", "alphabet", "hiragana", "katakana"
            ]
            is_asking_basics = any(trig in lower_text for trig in basics_triggers)

            lesson_num = None
            if "lesson 1" in lower_text or "first lesson" in lower_text:
                lesson_num = 1
            elif "lesson 2" in lower_text or "second lesson" in lower_text or "introduce myself" in lower_text or "self introduction" in lower_text:
                lesson_num = 2
            elif "lesson 3" in lower_text or "third lesson" in lower_text or "numbers" in lower_text or "counting" in lower_text:
                lesson_num = 3
            elif "lesson 4" in lower_text or "fourth lesson" in lower_text or "kudasai" in lower_text or "survival words" in lower_text or "please give me" in lower_text:
                lesson_num = 4
            elif "lesson 5" in lower_text or "fifth lesson" in lower_text or "questions" in lower_text or "kore wa nan" in lower_text:
                lesson_num = 5
            elif "lesson 6" in lower_text or "sixth lesson" in lower_text or "sentence structure" in lower_text or "sov" in lower_text or "sentence order" in lower_text:
                lesson_num = 6
            elif is_asking_basics:
                lesson_num = 1

            if lesson_num and lesson_num in JAPANESE_BASICS_LESSONS:
                lesson = JAPANESE_BASICS_LESSONS[lesson_num]
                intro_prefix = ""
                if is_asking_basics and lesson_num == 1:
                    intro_prefix = (
                        f"🌸 **Welcome to Japanese from Basics! (日本語の基礎)**\n"
                        f"I'm {self.tutor_name}, your AI Japanese Sensei. I will guide you step-by-step from zero!\n\n"
                        f"**Here is your Japanese Beginner Roadmap:**\n"
                        f"• **Lesson 1:** How Japanese Works & Essential Greetings 🔰\n"
                        f"• **Lesson 2:** Self-Introduction (Hajimemashite)\n"
                        f"• **Lesson 3:** Numbers 1 to 10 & Counting (Sūji)\n"
                        f"• **Lesson 4:** Daily Survival Words & Asking 'Please' (Kudasai)\n"
                        f"• **Lesson 5:** Essential Questions with 'ka'\n"
                        f"• **Lesson 6:** Japanese Sentence Structure (SOV Order)\n\n"
                        f"---\n\n"
                    )

                return {
                    "reply": intro_prefix + lesson["content"],
                    "correction": None,
                    "suggested_replies": lesson["suggested_replies"],
                    "intent": "japanese_basics_lesson"
                }

            cleaned_target = re.sub(
                r"\b(how to say|what is|meaning of|translate|in japanese|to japanese|into japanese|japanese meaning|in nihongo|nihongo|please|tell me|can you)\b",
                "",
                lower_text
            ).strip().strip("?'\".,")

            # Check greetings in Japanese mode
            if lower_text in ["hi", "hello", "hey", "konnichiwa", "ohayou", "konbanwa", "hajimemashite", "good morning", "good evening"]:
                return {
                    "reply": (
                        f"こんにちは！ (Konnichiwa!) 私は {self.tutor_name} です。 FluentUpの AI 日本語チューター (Japanese Tutor) です！\n\n"
                        "Speak or type any word or sentence in English — I will translate it into Japanese (Kanji/Kana + Romaji), "
                        "teach you pronunciation, and guide your daily conversational speaking!\n\n"
                        "💡 *Tip: If you're a beginner, tap **'Start Lesson 1: Japanese Basics'** to learn step-by-step from zero!*\n\n"
                        "👉 What word or sentence would you like to translate into Japanese today?"
                    ),
                    "correction": None,
                    "suggested_replies": [
                        "Start Lesson 1: Japanese Basics",
                        "How to say 'Water' in Japanese?",
                        "How to say 'Thank you' in Japanese?"
                    ],
                    "intent": "japanese_tutor_greeting"
                }

            # Check matching word in our comprehensive Japanese dictionary
            matched_entry = None
            matched_word = None
            if cleaned_target in JAPANESE_TUTOR_DICTIONARY:
                matched_entry = JAPANESE_TUTOR_DICTIONARY[cleaned_target]
                matched_word = cleaned_target
            else:
                for k, v in JAPANESE_TUTOR_DICTIONARY.items():
                    if k in lower_text:
                        matched_entry = v
                        matched_word = k
                        break

            if matched_entry and matched_word:
                kanji = matched_entry["kanji"]
                kana = matched_entry["kana"]
                rom = matched_entry["rom"]
                tip = matched_entry["tip"]
                ex1 = matched_entry["ex1"]
                ex2 = matched_entry["ex2"]
                practice = matched_entry["practice"]

                reply = (
                    f"**{matched_word.title()}** in Japanese is **{kanji} ({kana} / {rom})**!\n\n"
                    f"🇯🇵 **Japanese Translation:** {kanji} *({kana} / {rom})*\n"
                    f"🗣️ **Nuance & Grammar:** {tip}\n\n"
                    f"💬 **Daily Spoken Sentences:**\n"
                    f"1. {ex1[0]} *({ex1[1]})* — {ex1[2]}\n"
                    f"2. {ex2[0]} *({ex2[1]})* — {ex2[2]}\n\n"
                    f"👉 **Try saying it out loud:** *'{practice}'*!\n\n"
                    f"Would you like to learn another Japanese word or sentence?"
                )
                return {
                    "reply": reply,
                    "correction": None,
                    "suggested_replies": [
                        "Teach me words for food and tea in Japanese.",
                        "How to say 'Where are you going?' in Japanese.",
                        "How to say 'Thank you' in Japanese?"
                    ],
                    "intent": "japanese_word_lesson"
                }

            # If not in dictionary, provide a rich, encouraging Japanese tutoring response
            return {
                "reply": (
                    f"In Japanese, to express **'{text}'**:\n\n"
                    f"🇯🇵 **Spoken Tip:** In Japanese sentences, the verb always comes at the end (Subject + Object + Verb).\n\n"
                    f"For example, to politely request something, say: **'{text} をください' ({text} o kudasai - Please give me {text})**.\n"
                    f"To ask politely, say: **'これは {text} ですか？' (Kore wa {text} desu ka?)**.\n\n"
                    f"👉 Repeat this once: *'{text} o kudasai'*. What other word would you like to translate?"
                ),
                "correction": None,
                "suggested_replies": [
                    "How to say 'Water' in Japanese?",
                    "How to say 'Food' in Japanese?",
                    "How to say 'Thank you' in Japanese?"
                ],
                "intent": "japanese_tutoring_general"
            }

        # Check if user is in Hindi Tutor mode OR explicitly asking for Hindi translation
        is_hindi_mode = (learning_target == "hindi") or any(w in lower_text for w in [
            "in hindi", "to hindi", "into hindi", "translate in hindi", "translate to hindi",
            "hindi me", "hindi mein", "hindi me batao", "hindi meaning", "hindi tutor",
            "learn hindi", "how to say in hindi"
        ])

        # --- HINDI TUTOR MODE HANDLER ---
        if is_hindi_mode:
            # Clean trigger words to find the target word to teach/translate
            cleaned_target = re.sub(
                r"\b(how to say|what is|meaning of|translate|in hindi|to hindi|into hindi|hindi me|hindi mein|hindi meaning|please|tell me|can you)\b",
                "",
                lower_text
            ).strip().strip("?'\".,")

            # Check greetings in Hindi mode
            if lower_text in ["hi", "hello", "hey", "namaste", "good morning", "good evening", "good afternoon", "hi there", "namaskar"]:
                return {
                    "reply": (
                        f"नमस्ते! (Namaste!) मैं {self.tutor_name} हूँ, आपकी AI हिंदी ट्यूटर (Hindi Tutor)!\n\n"
                        "आप English या Telugu में कोई भी शब्द या वाक्य बोलें या लिखें — मैं आपको उसका हिंदी अनुवाद, "
                        "सही उच्चारण (Pronunciation), और रोज़मर्रा की बातचीत में इस्तेमाल करना सिखाऊँगी!\n\n"
                        "👉 What word or sentence would you like to translate into Hindi today?"
                    ),
                    "correction": None,
                    "suggested_replies": [
                        "How to say 'Water' in Hindi?",
                        "How to say 'Thank you' in Hindi?",
                        "Teach me daily greetings in Hindi."
                    ],
                    "intent": "hindi_tutor_greeting"
                }

            # Check matching word in our comprehensive dictionary
            matched_entry = None
            matched_word = None
            if cleaned_target in HINDI_TUTOR_DICTIONARY:
                matched_entry = HINDI_TUTOR_DICTIONARY[cleaned_target]
                matched_word = cleaned_target
            else:
                for k, v in HINDI_TUTOR_DICTIONARY.items():
                    if k in lower_text:
                        matched_entry = v
                        matched_word = k
                        break

            if matched_entry and matched_word:
                dev = matched_entry["dev"]
                rom = matched_entry["rom"]
                gender = matched_entry["gender"]
                tip = matched_entry["tip"]
                ex1 = matched_entry["ex1"]
                ex2 = matched_entry["ex2"]
                practice = matched_entry["practice"]

                reply = (
                    f"**{matched_word.title()}** in Hindi is **{dev} ({rom})**!\n\n"
                    f"🇮🇳 **Hindi Translation:** {dev} *({rom})*\n"
                    f"🗣️ **Gender & Grammar:** {gender}. {tip}\n\n"
                    f"💬 **Daily Spoken Sentences:**\n"
                    f"1. {ex1[0]} *({ex1[1]})* — {ex1[2]}\n"
                    f"2. {ex2[0]} *({ex2[1]})* — {ex2[2]}\n\n"
                    f"👉 **Try saying it out loud:** *'{practice}'*!\n\n"
                    f"Would you like to learn another Hindi word or sentence?"
                )
                return {
                    "reply": reply,
                    "correction": None,
                    "suggested_replies": [
                        "Teach me words for food and tea in Hindi.",
                        "How to say 'Where are you going?' in Hindi.",
                        "How to say 'Thank you' in Hindi?"
                    ],
                    "intent": "hindi_word_lesson"
                }

            # If not in dictionary, provide a rich, encouraging Hindi tutoring response
            return {
                "reply": (
                    f"In Hindi, to express **'{text}'**:\n\n"
                    f"🇮🇳 **Spoken Tip:** In conversational Hindi, keep your sentence simple with Subject + Object + Verb.\n\n"
                    f"For example, to say *'I want {text}'*, say: **'मुझे {text} चाहिए' (Mujhe {text} chahiye)**.\n"
                    f"To ask politely, say: **'क्या आपके पास {text} है?' (Kya aapke paas {text} hai?)**.\n\n"
                    f"👉 Repeat this once: *'Mujhe {text} chahiye'*. What other word would you like to translate?"
                ),
                "correction": None,
                "suggested_replies": [
                    "How to say 'Water' in Hindi?",
                    "How to say 'Food' in Hindi?",
                    "How to say 'Friend' in Hindi?"
                ],
                "intent": "hindi_tutoring_general"
            }

        # --- STANDARD ENGLISH TUTOR MODE ---
        # 1. Check for grammar correction opportunities
        correction = analyze_grammar(text, pref_lang=pref_lang)

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

        # Hindi translation request in English mode
        if any(w in lower_text for w in ["in hindi", "hindi me", "hindi mein", "hindi me batao", "hindi meaning", "translate to hindi"]):
            return {
                "reply": "Bilkul! (Sure!) Main Hindi mein samjhane ke liye taiyar hoon.\n\nJab bhi aap koi naya sentence seekhein, uske idea ko apni bhasha se connect karein, fir English me naturally bolein.\n\nAap kya poochna chahte hain? (What would you like me to translate or explain?)",
                "correction": correction,
                "suggested_replies": [
                    "How to say 'Main kal aunga' in English?",
                    "Teach me everyday office phrases in Hindi + English.",
                    "Explain the difference between 'since' and 'for'."
                ],
                "intent": "hindi_support"
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
            speaker_type = "Hindi speakers" if pref_lang == "en_hi" else ("learners" if pref_lang == "en_only" else "Telugu speakers")
            reply = f"I understand completely. Many {speaker_type} feel hesitant or worry about making mistakes in English. But remember: communication is about expressing your idea, not perfection!\n\nEvery mistake you make here is a step towards speaking fluently. Let's start with a simple fun question: What is one movie or hobby you really enjoy?"
            if pref_lang == "en_hi":
                reply += "\n\n(Galtiyon se darna band kijiye. Main aapki madad ke liye hoon!)"
            elif pref_lang == "en_te":
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
