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

class IntelligentTutorEngine:
    """
    Intelligent built-in conversational tutor engine.
    Supports English Speaking Coaching AND Hindi Tutoring with word translations,
    pronunciation guides, gender/grammar notes, and daily spoken practice.
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
