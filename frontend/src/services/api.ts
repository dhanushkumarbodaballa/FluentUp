import { Conversation, Message, VocabularyWord, SavedCorrection, UserSettings, LearningStats, AuthUser } from '../types';

const BASE_URL = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('fluentup_token');
}

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem('fluentup_token', token);
  } else {
    localStorage.removeItem('fluentup_token');
  }
}

function getHeaders(contentType = true): HeadersInit {
  const headers: Record<string, string> = {};
  if (contentType) {
    headers['Content-Type'] = 'application/json';
  }
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// --- Auth API ---
export async function loginUser(email: string, password: string): Promise<{ user: AuthUser; token: string }> {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    let errorMsg = 'Login failed. Please check your credentials.';
    try {
      const errorData = await res.json();
      errorMsg = errorData.detail || errorData.message || errorMsg;
    } catch {
      const text = await res.text().catch(() => '');
      if (text && text.length < 200) errorMsg = text;
    }
    throw new Error(errorMsg);
  }
  const data = await res.json();
  setAuthToken(data.token);
  return data;
}

export async function registerUser(params: {
  name: string;
  email: string;
  password: string;
  english_level?: string;
  preferred_language?: string;
}): Promise<{ user: AuthUser; token: string }> {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    let errorMsg = 'Registration failed. Please try again.';
    try {
      const errorData = await res.json();
      errorMsg = errorData.detail || errorData.message || errorMsg;
    } catch {
      const text = await res.text().catch(() => '');
      if (text && text.length < 200) errorMsg = text;
    }
    throw new Error(errorMsg);
  }
  const data = await res.json();
  setAuthToken(data.token);
  return data;
}

export async function fetchCurrentUser(): Promise<{ user: AuthUser }> {
  const res = await fetch(`${BASE_URL}/auth/me`, {
    headers: getHeaders(false),
  });
  if (!res.ok) throw new Error('Not authenticated');
  return res.json();
}

export async function logoutUser(): Promise<void> {
  try {
    await fetch(`${BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: getHeaders(false),
    });
  } catch (e) {
    console.error('Logout error:', e);
  } finally {
    setAuthToken(null);
  }
}

// --- App Status ---
export async function fetchStatus(): Promise<{ status: string; active_mode: string; is_demo_mode: boolean; setup_instruction: string }> {
  const res = await fetch(`${BASE_URL}/status`);
  if (!res.ok) throw new Error('Failed to fetch status');
  return res.json();
}

// --- Conversations ---
export async function fetchConversations(): Promise<Conversation[]> {
  const res = await fetch(`${BASE_URL}/conversations`, {
    headers: getHeaders(false),
  });
  if (!res.ok) throw new Error('Failed to fetch conversations');
  return res.json();
}

export async function createConversation(title?: string): Promise<{ id: string; title: string }> {
  const res = await fetch(`${BASE_URL}/conversations`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ title: title || 'New Conversation' }),
  });
  if (!res.ok) throw new Error('Failed to create conversation');
  return res.json();
}

export async function fetchConversationHistory(conversationId: string): Promise<{ conversation_id: string; messages: Message[] }> {
  const res = await fetch(`${BASE_URL}/conversations/${conversationId}`, {
    headers: getHeaders(false),
  });
  if (!res.ok) throw new Error('Failed to fetch history');
  return res.json();
}

export async function deleteConversation(conversationId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/conversations/${conversationId}`, {
    method: 'DELETE',
    headers: getHeaders(false),
  });
  if (!res.ok) throw new Error('Failed to delete conversation');
}

export async function renameConversation(conversationId: string, title: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/conversations/${conversationId}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error('Failed to rename conversation');
}

export async function sendChatMessage(params: {
  conversation_id?: string;
  message: string;
  audio_duration_seconds?: number;
}): Promise<{
  conversation_id: string;
  message_id: string;
  reply: string;
  correction: any;
  suggested_replies: string[];
  provider: string;
  is_demo_mode: boolean;
  setup_hint?: string;
}> {
  const res = await fetch(`${BASE_URL}/chat`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error('Failed to send message');
  return res.json();
}

// --- Vocabulary ---
export async function fetchVocabulary(): Promise<VocabularyWord[]> {
  const res = await fetch(`${BASE_URL}/vocabulary`, {
    headers: getHeaders(false),
  });
  if (!res.ok) throw new Error('Failed to fetch vocabulary');
  return res.json();
}

export async function saveVocabulary(data: { word: string; definition: string; telugu_meaning?: string; example_sentence?: string }): Promise<VocabularyWord> {
  const res = await fetch(`${BASE_URL}/vocabulary`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to save vocabulary');
  return res.json();
}

export async function deleteVocabulary(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/vocabulary/${id}`, {
    method: 'DELETE',
    headers: getHeaders(false),
  });
  if (!res.ok) throw new Error('Failed to delete vocabulary');
}

// --- Saved Corrections ---
export async function fetchSavedCorrections(): Promise<SavedCorrection[]> {
  const res = await fetch(`${BASE_URL}/corrections`, {
    headers: getHeaders(false),
  });
  if (!res.ok) throw new Error('Failed to fetch corrections');
  return res.json();
}

export async function saveCorrection(data: {
  original_sentence: string;
  improved_sentence: string;
  explanation_en: string;
  explanation_te?: string;
  practice_sentence?: string;
}): Promise<SavedCorrection> {
  const res = await fetch(`${BASE_URL}/corrections`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to save correction');
  return res.json();
}

export async function deleteSavedCorrection(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/corrections/${id}`, {
    method: 'DELETE',
    headers: getHeaders(false),
  });
  if (!res.ok) throw new Error('Failed to delete correction');
}

// --- Settings & Stats ---
export async function fetchSettings(): Promise<UserSettings> {
  const res = await fetch(`${BASE_URL}/settings`, {
    headers: getHeaders(false),
  });
  if (!res.ok) throw new Error('Failed to fetch settings');
  return res.json();
}

export async function updateSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
  const res = await fetch(`${BASE_URL}/settings`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error('Failed to update settings');
  return res.json();
}

export async function fetchProgress(): Promise<LearningStats> {
  const res = await fetch(`${BASE_URL}/progress`, {
    headers: getHeaders(false),
  });
  if (!res.ok) throw new Error('Failed to fetch progress');
  return res.json();
}

export async function recordVoiceMinutes(minutes: number): Promise<void> {
  await fetch(`${BASE_URL}/progress/voice-time`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ minutes }),
  });
}

// --- AI Tools ---
export async function checkGrammar(text: string): Promise<{ has_error: boolean; correction: any; message: string }> {
  const res = await fetch(`${BASE_URL}/tools/grammar`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error('Failed to check grammar');
  return res.json();
}

export async function translateText(text: string, target_language = 'te'): Promise<{ original: string; translated: string; note: string }> {
  const res = await fetch(`${BASE_URL}/tools/translate`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ text, target_language }),
  });
  if (!res.ok) throw new Error('Failed to translate');
  return res.json();
}

export async function getDailyChallenge(): Promise<{ id: string; title: string; instruction: string; sample_start: string; target_time_seconds: number }> {
  const res = await fetch(`${BASE_URL}/tools/daily-challenge`, {
    headers: getHeaders(false),
  });
  if (!res.ok) throw new Error('Failed to fetch daily challenge');
  return res.json();
}
