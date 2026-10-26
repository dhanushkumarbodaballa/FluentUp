# FluentUp AI — A Complete AI English Tutor Agent

**FluentUp AI** is an AI-first, conversational English learning web application designed to act as a personal AI companion specializing in teaching spoken English to Indian learners, with bilingual Telugu + English support.

---

## 🌟 Key Features

### 1. AI-First Conversation Interface (Home Screen)
- **Minimal, ChatGPT-style chat screen** as the main home experience.
- Centered welcome screen featuring **Maya**, your personal AI English buddy:
  - *"Hi! I'm your English buddy. Let's improve your English together. We can talk about anything, practise speaking, or fix your sentences. Don't worry about mistakes — I'll help you."*
  - Quick-start prompt cards: *Let's talk in English*, *Teach me everyday English*, *Correct my English*, *Practise in Telugu + English*, *Help me speak confidently*, *Practise a job interview*.

### 2. Intelligent Bilingual English & Telugu Tutoring
- **Gentle Inline Grammar Corrections**:
  - 🔴 Original sentence
  - 🟢 Natural improved sentence
  - 💡 English rule explanation
  - 🇮🇳 Clear Telugu explanation (e.g. *"Yesterday ante past time. Kabatti 'go' badhulu 'went' use cheyyali."*)
  - ✍️ Practice sentence
  - 💾 One-click "Save to Review"
- **Conversation Flow**: Responds to the learner's idea first, asks one clear question at a time to keep speaking, and explains concepts without aggressive lectures.

### 3. Real Voice Conversation
- **Mode A: Voice Messages**: Tap the microphone, speak naturally, review live speech-to-text transcript, send, and hear Maya speak back.
- **Mode B: Live Voice Companion Room**:
  - Full-screen interactive voice companion with animated audio wave orb.
  - Clear states: *Listening*, *Thinking*, *Speaking*, and *Idle*.
  - Real-time turn-taking with natural pause detection.
  - Interactive controls: *Interrupt/Stop AI speech*, *Replay last response*, *Mute/Unmute microphone*, *Live session transcript drawer*.
  - Natural female TTS voice with speech speed control (0.8x, 1.0x, 1.2x).

### 4. Conversation Memory & Persistence (SQLite Database)
- Multi-session chat history: Create new chats, rename, switch, and delete conversations.
- **My Vocabulary Bank**: Save words with definitions, Telugu meanings, pronunciation audio, and example sentences.
- **Saved Corrections**: Review your past mistakes to reinforce correct habits.
- **Learning Progress Dashboard**: Track your spoken minutes, messages sent, corrections fixed, daily streak, and CEFR level assessment (A1, A2, B1, B2).

### 5. Integrated AI Power Tools
- **Grammar Checker**: Instant analysis of paragraphs with Telugu tips.
- **English ↔ Telugu Translator**: Context-aware spoken phrase translation.
- **Daily Speaking Challenge**: Timed impromptu speaking scenarios with starter cues.
- **Mock Job Interview Simulator**: Roleplay HR questions, behavioral scenarios, and elevator pitches.

---

## 🚀 Quick Start

### Option 1: One-Click Run (Recommended)
Double-click `run.bat` or run:
```bash
python run.py
```
This automatically builds the frontend (if not already built), starts the backend server on `http://127.0.0.1:8000`, and opens your default browser.

### Option 2: Development Mode (Hot Reload)

1. **Start Backend (FastAPI)**:
   ```bash
   cd backend
   python -m uvicorn app:app --reload --port 8000
   ```

2. **Start Frontend (Vite + React + Tailwind)**:
   ```bash
   cd frontend
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

---

## ⚙️ AI Backend Configuration

FluentUp AI works out of the box with its built-in **Intelligent Local Tutor Engine** (no API key required).

To connect live cloud language models (GPT-4o or Google Gemini), configure `backend/.env`:
```ini
# Optional: OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini

# Optional: Google Gemini
GEMINI_API_KEY=AIza...
GEMINI_MODEL=gemini-1.5-flash
```
*API keys remain 100% server-side and are never exposed to browser client code.*

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Web Speech API.
- **Backend**: Python 3, FastAPI, Uvicorn, SQLite3, Pydantic v2.
