export interface GrammarCorrection {
  original: string;
  improved: string;
  explanation_en: string;
  explanation_te?: string;
  explanation_hi?: string;
  explanation_native?: string;
  practice?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender: 'user' | 'assistant';
  text: string;
  correction?: GrammarCorrection | null;
  created_at: string;
  audio_url?: string;
  isStreaming?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count?: number;
  last_message?: string;
}

export interface VocabularyWord {
  id: string;
  word: string;
  definition: string;
  telugu_meaning?: string;
  hindi_meaning?: string;
  example_sentence?: string;
  mastered?: number;
  created_at?: string;
}

export interface SavedCorrection {
  id: string;
  original_sentence: string;
  improved_sentence: string;
  explanation_en: string;
  explanation_te?: string;
  explanation_hi?: string;
  explanation_native?: string;
  practice_sentence?: string;
  created_at?: string;
}

export interface UserSettings {
  preferred_language: 'en_te' | 'en_hi' | 'en_only';
  english_level: 'beginner' | 'intermediate' | 'advanced';
  voice_speed: number;
  female_voice_name: string;
  auto_speak: number;
  tutor_name: string;
}

export interface LearningStats {
  total_messages: number;
  total_corrections: number;
  minutes_spoken: number;
  streak_days: number;
  last_active_date: string;
  saved_vocabulary_count: number;
  saved_corrections_count: number;
  total_conversations: number;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  english_level: 'beginner' | 'intermediate' | 'advanced';
  preferred_language: 'en_te' | 'en_hi' | 'en_only';
  avatar?: string;
}
