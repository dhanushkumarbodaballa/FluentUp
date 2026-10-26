import sqlite3
import json
import os
import uuid
import hashlib
import secrets
from datetime import datetime
from typing import List, Dict, Any, Optional

DB_PATH = os.path.join(os.path.dirname(__file__), "fluentup.db")

def get_connection():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def ensure_column(cursor, table_name: str, column_name: str, column_def: str):
    """Ensures a column exists in a SQLite table without throwing errors."""
    try:
        cursor.execute(f"PRAGMA table_info({table_name})")
        columns = [row["name"] for row in cursor.fetchall()]
        if column_name not in columns:
            cursor.execute(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_def}")
    except Exception as e:
        print(f"Migration note for {table_name}.{column_name}: {e}")

# --- Password hashing helpers (Standard Library: PBKDF2-HMAC-SHA256) ---
def hash_password(password: str, salt: Optional[str] = None) -> tuple[str, str]:
    if not salt:
        salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
    return key.hex(), salt

def verify_password(stored_hash: str, salt: str, password_attempt: str) -> bool:
    key = hashlib.pbkdf2_hmac('sha256', password_attempt.encode('utf-8'), salt.encode('utf-8'), 100000)
    return secrets.compare_digest(key.hex(), stored_hash)

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    # Users table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        password_salt TEXT NOT NULL,
        english_level TEXT DEFAULT 'beginner',
        preferred_language TEXT DEFAULT 'en_te',
        avatar TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # User Sessions table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS user_sessions (
        token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
    """)

    # Conversations table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        user_id TEXT DEFAULT 'guest',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Messages table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        sender TEXT NOT NULL, -- 'user' or 'assistant'
        text TEXT NOT NULL,
        correction_json TEXT, -- JSON string for grammar correction
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
    )
    """)

    # Saved Vocabulary table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS vocabulary (
        id TEXT PRIMARY KEY,
        word TEXT NOT NULL,
        definition TEXT NOT NULL,
        telugu_meaning TEXT,
        example_sentence TEXT,
        mastered INTEGER DEFAULT 0,
        user_id TEXT DEFAULT 'guest',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Saved Corrections table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS saved_corrections (
        id TEXT PRIMARY KEY,
        original_sentence TEXT NOT NULL,
        improved_sentence TEXT NOT NULL,
        explanation_en TEXT NOT NULL,
        explanation_te TEXT,
        practice_sentence TEXT,
        user_id TEXT DEFAULT 'guest',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # User Settings table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        preferred_language TEXT DEFAULT 'en_te', -- 'en_te' or 'en_only'
        english_level TEXT DEFAULT 'beginner', -- 'beginner', 'intermediate', 'advanced'
        voice_speed REAL DEFAULT 1.0,
        female_voice_name TEXT DEFAULT 'default',
        auto_speak INTEGER DEFAULT 1,
        tutor_name TEXT DEFAULT 'Maya'
    )
    """)

    # Learning Stats table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS learning_stats (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        total_messages INTEGER DEFAULT 0,
        total_corrections INTEGER DEFAULT 0,
        minutes_spoken REAL DEFAULT 0.0,
        streak_days INTEGER DEFAULT 1,
        last_active_date TEXT
    )
    """)

    # Ensure schema migrations if tables pre-existed
    ensure_column(cursor, "conversations", "user_id", "TEXT DEFAULT 'guest'")
    ensure_column(cursor, "vocabulary", "user_id", "TEXT DEFAULT 'guest'")
    ensure_column(cursor, "saved_corrections", "user_id", "TEXT DEFAULT 'guest'")

    # Seed default settings and stats if not present
    cursor.execute("SELECT id FROM settings WHERE id = 1")
    if not cursor.fetchone():
        cursor.execute("""
        INSERT INTO settings (id, preferred_language, english_level, voice_speed, female_voice_name, auto_speak, tutor_name)
        VALUES (1, 'en_te', 'beginner', 1.0, 'default', 1, 'Maya')
        """)

    cursor.execute("SELECT id FROM learning_stats WHERE id = 1")
    if not cursor.fetchone():
        today_str = datetime.now().strftime("%Y-%m-%d")
        cursor.execute("""
        INSERT INTO learning_stats (id, total_messages, total_corrections, minutes_spoken, streak_days, last_active_date)
        VALUES (1, 0, 0, 0.0, 1, ?)
        """, (today_str,))

    # Seed demo user (Dhanush Kumar)
    cursor.execute("SELECT id FROM users WHERE email = 'dhanush@fluentup.ai'")
    if not cursor.fetchone():
        demo_id = str(uuid.uuid4())
        pw_hash, pw_salt = hash_password("password123")
        cursor.execute("""
        INSERT INTO users (id, name, email, password_hash, password_salt, english_level, preferred_language)
        VALUES (?, 'Dhanush Kumar', 'dhanush@fluentup.ai', ?, ?, 'intermediate', 'en_te')
        """, (demo_id, pw_hash, pw_salt))

    conn.commit()
    conn.close()

# --- Auth Operations ---
def register_user(name: str, email: str, password: str, english_level: str = "beginner", preferred_language: str = "en_te") -> Dict[str, Any]:
    email = email.strip().lower()
    name = name.strip()
    if not name or not email or not password:
        raise ValueError("Name, email, and password are required")
    if len(password) < 6:
        raise ValueError("Password must be at least 6 characters")

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
    if cursor.fetchone():
        conn.close()
        raise ValueError("An account with this email already exists")

    user_id = str(uuid.uuid4())
    pw_hash, pw_salt = hash_password(password)

    cursor.execute("""
        INSERT INTO users (id, name, email, password_hash, password_salt, english_level, preferred_language)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (user_id, name, email, pw_hash, pw_salt, english_level, preferred_language))

    token = secrets.token_hex(32)
    cursor.execute("INSERT INTO user_sessions (token, user_id) VALUES (?, ?)", (token, user_id))

    conn.commit()
    conn.close()

    return {
        "user": {
            "id": user_id,
            "name": name,
            "email": email,
            "english_level": english_level,
            "preferred_language": preferred_language,
            "avatar": ""
        },
        "token": token
    }

def login_user(email: str, password: str) -> Dict[str, Any]:
    email = email.strip().lower()
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, email, password_hash, password_salt, english_level, preferred_language, avatar FROM users WHERE email = ?", (email,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise ValueError("Invalid email or password")

    user = dict(row)
    if not verify_password(user["password_hash"], user["password_salt"], password):
        conn.close()
        raise ValueError("Invalid email or password")

    token = secrets.token_hex(32)
    cursor.execute("INSERT INTO user_sessions (token, user_id) VALUES (?, ?)", (token, user["id"]))
    conn.commit()
    conn.close()

    return {
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "english_level": user["english_level"],
            "preferred_language": user["preferred_language"],
            "avatar": user.get("avatar", "")
        },
        "token": token
    }

def get_user_from_token(token: str) -> Optional[Dict[str, Any]]:
    if not token:
        return None
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT u.id, u.name, u.email, u.english_level, u.preferred_language, u.avatar
        FROM user_sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.token = ?
    """, (token,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def delete_user_session(token: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM user_sessions WHERE token = ?", (token,))
    conn.commit()
    conn.close()

# --- Conversation operations ---
def list_conversations(user_id: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    if user_id and user_id != 'guest':
        cursor.execute("""
            SELECT c.id, c.title, c.created_at, c.updated_at,
                   (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id) as message_count,
                   (SELECT text FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message
            FROM conversations c
            WHERE c.user_id = ?
            ORDER BY c.updated_at DESC
        """, (user_id,))
    else:
        cursor.execute("""
            SELECT c.id, c.title, c.created_at, c.updated_at,
                   (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id) as message_count,
                   (SELECT text FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message
            FROM conversations c
            WHERE c.user_id = 'guest' OR c.user_id IS NULL
            ORDER BY c.updated_at DESC
        """)
    rows = cursor.fetchall()
    results = [dict(row) for row in rows]
    conn.close()
    return results

def get_conversation_messages(conversation_id: str) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, conversation_id, sender, text, correction_json, created_at
        FROM messages
        WHERE conversation_id = ?
        ORDER BY created_at ASC
    """, (conversation_id,))
    rows = cursor.fetchall()
    messages = []
    for r in rows:
        item = dict(r)
        if item.get("correction_json"):
            try:
                corr = json.loads(item["correction_json"])
                if isinstance(corr, dict):
                    orig = str(corr.get("original") or "").strip()
                    imp = str(corr.get("improved") or "").strip()
                    if orig and imp and orig.lower() != imp.lower() and orig.lower() not in ["null", '""', "''"]:
                        item["correction"] = {
                            "original": orig,
                            "improved": imp,
                            "explanation_en": str(corr.get("explanation_en") or "").strip(),
                            "explanation_te": str(corr.get("explanation_te") or "").strip(),
                            "practice": str(corr.get("practice") or "").strip()
                        }
                    else:
                        item["correction"] = None
                else:
                    item["correction"] = None
            except Exception:
                item["correction"] = None
        else:
            item["correction"] = None
        messages.append(item)
    conn.close()
    return messages

def create_conversation(conversation_id: str, title: str = "New Conversation", user_id: str = "guest") -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO conversations (id, title, user_id, created_at, updated_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    """, (conversation_id, title, user_id or "guest"))
    conn.commit()
    conn.close()
    return {"id": conversation_id, "title": title}

def update_conversation_title(conversation_id: str, title: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE conversations SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    """, (title, conversation_id))
    conn.commit()
    conn.close()

def delete_conversation(conversation_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM messages WHERE conversation_id = ?", (conversation_id,))
    cursor.execute("DELETE FROM conversations WHERE id = ?", (conversation_id,))
    conn.commit()
    conn.close()

def add_message(message_id: str, conversation_id: str, sender: str, text: str, correction: Optional[Dict[str, Any]] = None, user_id: str = "guest"):
    conn = get_connection()
    cursor = conn.cursor()

    # Ensure conversation exists
    cursor.execute("SELECT id FROM conversations WHERE id = ?", (conversation_id,))
    if not cursor.fetchone():
        title = text[:30] + "..." if len(text) > 30 else text
        cursor.execute("INSERT INTO conversations (id, title, user_id) VALUES (?, ?, ?)", (conversation_id, title, user_id or "guest"))

    # Sanitize correction before saving
    clean_correction = None
    if isinstance(correction, dict):
        orig = str(correction.get("original") or "").strip()
        imp = str(correction.get("improved") or "").strip()
        if orig and imp and orig.lower() != imp.lower() and orig.lower() not in ["null", '""', "''"]:
            clean_correction = {
                "original": orig,
                "improved": imp,
                "explanation_en": str(correction.get("explanation_en") or "").strip(),
                "explanation_te": str(correction.get("explanation_te") or "").strip(),
                "practice": str(correction.get("practice") or "").strip()
            }

    correction_json = json.dumps(clean_correction) if clean_correction else None

    cursor.execute("""
        INSERT INTO messages (id, conversation_id, sender, text, correction_json, created_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    """, (message_id, conversation_id, sender, text, correction_json))

    # Update conversation updated_at
    cursor.execute("UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?", (conversation_id,))

    # Update stats
    if sender == 'user':
        cursor.execute("UPDATE learning_stats SET total_messages = total_messages + 1 WHERE id = 1")
    if correction:
        cursor.execute("UPDATE learning_stats SET total_corrections = total_corrections + 1 WHERE id = 1")

    conn.commit()
    conn.close()

# --- Vocabulary operations ---
def list_vocabulary(user_id: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    if user_id and user_id != 'guest':
        cursor.execute("SELECT * FROM vocabulary WHERE user_id = ? ORDER BY created_at DESC", (user_id,))
    else:
        cursor.execute("SELECT * FROM vocabulary WHERE user_id = 'guest' OR user_id IS NULL ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def save_vocabulary(vocab_id: str, word: str, definition: str, telugu_meaning: str, example_sentence: str, user_id: str = "guest") -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    # Check if word exists for this user
    cursor.execute("SELECT id FROM vocabulary WHERE word = ? AND (user_id = ? OR (user_id IS NULL AND ? = 'guest'))", (word.strip(), user_id or "guest", user_id or "guest"))
    existing = cursor.fetchone()
    if existing:
        cursor.execute("""
            UPDATE vocabulary
            SET definition = ?, telugu_meaning = ?, example_sentence = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (definition, telugu_meaning, example_sentence, existing["id"]))
        conn.commit()
        conn.close()
        return {"id": existing["id"], "word": word, "definition": definition, "telugu_meaning": telugu_meaning, "example_sentence": example_sentence}

    cursor.execute("""
        INSERT INTO vocabulary (id, word, definition, telugu_meaning, example_sentence, user_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    """, (vocab_id, word.strip(), definition, telugu_meaning, example_sentence, user_id or "guest"))
    conn.commit()
    conn.close()
    return {"id": vocab_id, "word": word, "definition": definition, "telugu_meaning": telugu_meaning, "example_sentence": example_sentence}

def delete_vocabulary(vocab_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM vocabulary WHERE id = ?", (vocab_id,))
    conn.commit()
    conn.close()

# --- Saved Corrections operations ---
def list_saved_corrections(user_id: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    if user_id and user_id != 'guest':
        cursor.execute("SELECT * FROM saved_corrections WHERE user_id = ? ORDER BY created_at DESC", (user_id,))
    else:
        cursor.execute("SELECT * FROM saved_corrections WHERE user_id = 'guest' OR user_id IS NULL ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def save_correction(corr_id: str, original: str, improved: str, explanation_en: str, explanation_te: str, practice: str, user_id: str = "guest") -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT OR REPLACE INTO saved_corrections (id, original_sentence, improved_sentence, explanation_en, explanation_te, practice_sentence, user_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    """, (corr_id, original, improved, explanation_en, explanation_te, practice, user_id or "guest"))
    conn.commit()
    conn.close()
    return {
        "id": corr_id,
        "original_sentence": original,
        "improved_sentence": improved,
        "explanation_en": explanation_en,
        "explanation_te": explanation_te,
        "practice_sentence": practice
    }

def delete_saved_correction(corr_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM saved_corrections WHERE id = ?", (corr_id,))
    conn.commit()
    conn.close()

# --- Settings & Stats operations ---
def get_settings(user_id: Optional[str] = None) -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT preferred_language, english_level, voice_speed, female_voice_name, auto_speak, tutor_name FROM settings WHERE id = 1")
    row = cursor.fetchone()
    settings_dict = dict(row) if row else {
        "preferred_language": "en_te",
        "english_level": "beginner",
        "voice_speed": 1.0,
        "female_voice_name": "default",
        "auto_speak": 1,
        "tutor_name": "Maya"
    }

    # If user is logged in, inherit their chosen level and language preferences
    if user_id and user_id != "guest":
        cursor.execute("SELECT english_level, preferred_language FROM users WHERE id = ?", (user_id,))
        user_row = cursor.fetchone()
        if user_row:
            if user_row["english_level"]:
                settings_dict["english_level"] = user_row["english_level"]
            if user_row["preferred_language"]:
                settings_dict["preferred_language"] = user_row["preferred_language"]

    conn.close()
    return settings_dict

def update_settings(data: Dict[str, Any], user_id: Optional[str] = None) -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE settings
        SET preferred_language = COALESCE(?, preferred_language),
            english_level = COALESCE(?, english_level),
            voice_speed = COALESCE(?, voice_speed),
            female_voice_name = COALESCE(?, female_voice_name),
            auto_speak = COALESCE(?, auto_speak),
            tutor_name = COALESCE(?, tutor_name)
        WHERE id = 1
    """, (
        data.get("preferred_language"),
        data.get("english_level"),
        data.get("voice_speed"),
        data.get("female_voice_name"),
        data.get("auto_speak"),
        data.get("tutor_name")
    ))

    # Also update user record if user is logged in
    if user_id and user_id != "guest":
        if "english_level" in data and data["english_level"]:
            cursor.execute("UPDATE users SET english_level = ? WHERE id = ?", (data["english_level"], user_id))
        if "preferred_language" in data and data["preferred_language"]:
            cursor.execute("UPDATE users SET preferred_language = ? WHERE id = ?", (data["preferred_language"], user_id))

    conn.commit()
    conn.close()
    return get_settings(user_id)

def get_learning_stats(user_id: Optional[str] = None) -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT total_messages, total_corrections, minutes_spoken, streak_days, last_active_date FROM learning_stats WHERE id = 1")
    row = cursor.fetchone()

    # Get counts from tables
    if user_id and user_id != 'guest':
        cursor.execute("SELECT COUNT(*) FROM vocabulary WHERE user_id = ?", (user_id,))
        vocab_count = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM saved_corrections WHERE user_id = ?", (user_id,))
        corrections_count = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM conversations WHERE user_id = ?", (user_id,))
        conversations_count = cursor.fetchone()[0]
    else:
        cursor.execute("SELECT COUNT(*) FROM vocabulary WHERE user_id = 'guest' OR user_id IS NULL")
        vocab_count = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM saved_corrections WHERE user_id = 'guest' OR user_id IS NULL")
        corrections_count = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM conversations WHERE user_id = 'guest' OR user_id IS NULL")
        conversations_count = cursor.fetchone()[0]

    conn.close()
    stats = dict(row) if row else {
        "total_messages": 0,
        "total_corrections": 0,
        "minutes_spoken": 0.0,
        "streak_days": 1,
        "last_active_date": datetime.now().strftime("%Y-%m-%d")
    }
    stats["saved_vocabulary_count"] = vocab_count
    stats["saved_corrections_count"] = corrections_count
    stats["total_conversations"] = conversations_count
    return stats

def record_spoken_time(minutes: float):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE learning_stats SET minutes_spoken = minutes_spoken + ? WHERE id = 1", (minutes,))
    conn.commit()
    conn.close()
