import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  Sparkles,
  Headphones,
  RotateCcw,
  Languages,
  CheckCircle2,
  AlertCircle,
  LogIn,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { Message, Conversation, UserSettings, LearningStats, AuthUser } from './types';
import {
  fetchConversations,
  fetchConversationHistory,
  createConversation,
  deleteConversation,
  renameConversation,
  sendChatMessage,
  fetchSettings,
  updateSettings,
  fetchProgress,
  fetchVocabulary,
  fetchSavedCorrections,
  fetchCurrentUser,
  logoutUser,
} from './services/api';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { useSpeechSynthesis } from './hooks/useSpeechSynthesis';

import { Sidebar } from './components/Sidebar';
import { WelcomeScreen } from './components/WelcomeScreen';
import { MessageBubble } from './components/MessageBubble';
import { Composer } from './components/Composer';
import { LiveVoiceModal } from './components/LiveVoiceModal';
import { VocabularyModal } from './components/VocabularyModal';
import { SavedCorrectionsModal } from './components/SavedCorrectionsModal';
import { LearningProgressModal } from './components/LearningProgressModal';
import { SettingsModal } from './components/SettingsModal';
import { ToolsModal } from './components/ToolsModal';
import { AuthModal } from './components/AuthModal';

export const App: React.FC = () => {
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('fluentup_theme') === 'dark';
  });

  // Mobile sidebar toggle
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // User Auth State
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Core chat states
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedReplies, setSuggestedReplies] = useState<string[]>([]);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

  // Settings & stats state
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [stats, setStats] = useState<LearningStats | null>(null);
  const [vocabulary, setVocabulary] = useState<any[]>([]);
  const [savedCorrections, setSavedCorrections] = useState<any[]>([]);

  // Modals state
  const [isLiveVoiceOpen, setIsLiveVoiceOpen] = useState(false);
  const [isVocabOpen, setIsVocabOpen] = useState(false);
  const [isCorrectionsOpen, setIsCorrectionsOpen] = useState(false);
  const [isProgressOpen, setIsProgressOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);

  // Speech Recognition hook
  const {
    isListening,
    transcript,
    interimTranscript,
    durationSeconds,
    error: speechError,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();

  // Speech Synthesis hook
  const {
    isSpeaking,
    voices,
    femaleVoice,
    setFemaleVoice,
    speak,
    stop: stopSpeaking,
  } = useSpeechSynthesis();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Dark mode class toggle
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('fluentup_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('fluentup_theme', 'light');
    }
  }, [isDarkMode]);

  // Initial load
  useEffect(() => {
    initAuthAndData();
  }, []);

  const initAuthAndData = async () => {
    // 1. Try to fetch currently logged-in user if token exists
    try {
      const authRes = await fetchCurrentUser();
      if (authRes?.user) {
        setUser(authRes.user);
      }
    } catch {
      setUser(null);
    }

    // 2. Load conversations, settings, stats
    loadData();
  };

  const loadData = async () => {
    try {
      const [convs, userSettings, userStats, vocab, corrs] = await Promise.all([
        fetchConversations(),
        fetchSettings(),
        fetchProgress(),
        fetchVocabulary(),
        fetchSavedCorrections(),
      ]);

      setConversations(convs);
      setSettings(userSettings);
      setStats(userStats);
      setVocabulary(vocab);
      setSavedCorrections(corrs);

      // If conversations exist, select the first one
      if (convs.length > 0) {
        selectConversation(convs[0].id);
      } else {
        handleNewChat();
      }
    } catch (e) {
      console.error('Error loading initial data:', e);
    }
  };

  const handleLoginSuccess = (authUser: AuthUser) => {
    setUser(authUser);
    loadData();
  };

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
    handleNewChat();
    loadData();
  };

  const selectConversation = async (convId: string) => {
    try {
      setCurrentConversationId(convId);
      const res = await fetchConversationHistory(convId);
      setMessages(res.messages);
      setSuggestedReplies([]);
      stopSpeaking();
    } catch (e) {
      console.error(e);
    }
  };

  const handleNewChat = () => {
    setCurrentConversationId(null);
    setMessages([]);
    setSuggestedReplies([]);
    stopSpeaking();
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      await deleteConversation(id);
      const updated = conversations.filter((c) => c.id !== id);
      setConversations(updated);
      if (currentConversationId === id) {
        if (updated.length > 0) {
          selectConversation(updated[0].id);
        } else {
          handleNewChat();
        }
      }
      refreshStats();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRenameConversation = async (id: string, newTitle: string) => {
    try {
      await renameConversation(id, newTitle);
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c))
      );
    } catch (e) {
      console.error(e);
    }
  };

  const refreshStats = async () => {
    try {
      const [userStats, vocab, corrs] = await Promise.all([
        fetchProgress(),
        fetchVocabulary(),
        fetchSavedCorrections(),
      ]);
      setStats(userStats);
      setVocabulary(vocab);
      setSavedCorrections(corrs);
    } catch (e) {
      console.error(e);
    }
  };

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (text: string, durationSec = 0) => {
    if (!text.trim() || isLoading) return;

    const tempUserMsgId = `temp-user-${Date.now()}`;
    const newUserMsg: Message = {
      id: tempUserMsgId,
      conversation_id: currentConversationId || '',
      sender: 'user',
      text: text.trim(),
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setIsLoading(true);
    setSuggestedReplies([]);

    try {
      const res = await sendChatMessage({
        conversation_id: currentConversationId || undefined,
        message: text.trim(),
        audio_duration_seconds: durationSec,
      });

      const newAsstMsg: Message = {
        id: res.message_id,
        conversation_id: res.conversation_id,
        sender: 'assistant',
        text: res.reply,
        correction: res.correction,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, newAsstMsg]);
      setCurrentConversationId(res.conversation_id);
      setSuggestedReplies(res.suggested_replies || []);

      // If user has auto-speak enabled and in audio mode, speak reply
      if (settings?.auto_speak === 1 && durationSec > 0) {
        setSpeakingMessageId(res.message_id);
        speak(res.reply, settings.voice_speed, () => setSpeakingMessageId(null));
      }

      // Refresh conversations list to update titles/timestamps
      const refreshedConvs = await fetchConversations();
      setConversations(refreshedConvs);
      refreshStats();
    } catch (e) {
      console.error(e);
      const errMsg: Message = {
        id: `err-${Date.now()}`,
        conversation_id: currentConversationId || '',
        sender: 'assistant',
        text: "I'm having trouble connecting to the tutor engine. Please check the backend service.",
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeak = (msgId: string, text: string, rate: number) => {
    setSpeakingMessageId(msgId);
    speak(text, rate, () => setSpeakingMessageId(null));
  };

  const handleStopSpeak = () => {
    stopSpeaking();
    setSpeakingMessageId(null);
  };

  const handleAskExplainInTelugu = (text: string) => {
    handleSendMessage(`Can you please explain this in Telugu? "${text}"`);
  };

  const handleAskSimplify = (text: string) => {
    handleSendMessage(`Can you simplify this sentence into easier English? "${text}"`);
  };

  const handleToggleLanguageMode = async () => {
    if (!settings) return;
    const nextMode: 'en_te' | 'en_only' = settings.preferred_language === 'en_te' ? 'en_only' : 'en_te';
    const updated: UserSettings = { ...settings, preferred_language: nextMode };
    setSettings(updated);
    updateSettings({ preferred_language: nextMode }).catch(console.error);
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={selectConversation}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        onOpenVocabulary={() => setIsVocabOpen(true)}
        onOpenCorrections={() => setIsCorrectionsOpen(true)}
        onOpenProgress={() => setIsProgressOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenTools={() => setIsToolsOpen(true)}
        stats={stats}
        settings={settings}
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode((prev) => !prev)}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* Main Conversation Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top Navbar */}
        <header className="h-14 border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-4 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="md:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* AI Tutor Info Header */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Maya</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    AI English Tutor
                  </span>
                </div>
                <div className="text-[10px] text-brand-600 dark:text-brand-400 font-medium flex items-center gap-1">
                  <Languages className="w-2.5 h-2.5" />
                  <span>
                    {settings?.preferred_language === 'en_te' ? 'Telugu + English' : 'English Immersion'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions & Auth */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsLiveVoiceOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-medium shadow-xs shadow-brand-600/30 transition-all"
            >
              <Headphones className="w-3.5 h-3.5" />
              <span>Live Voice</span>
            </button>

            {/* User Profile or Log In Button */}
            {user ? (
              <div className="flex items-center gap-1.5 pl-2 py-0.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 hidden sm:inline pr-1">
                  {user.name}
                </span>
                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-brand-200 dark:border-brand-800/80 bg-brand-50/70 hover:bg-brand-100 dark:bg-brand-950/40 dark:hover:bg-brand-900/40 text-brand-700 dark:text-brand-300 text-xs font-semibold shadow-xs transition-all"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Log In / Sign Up</span>
              </button>
            )}
          </div>
        </header>

        {/* Conversation Stream or Welcome Screen */}
        <div className="flex-1 overflow-y-auto px-4 py-2 flex flex-col">
          {messages.length === 0 ? (
            <WelcomeScreen
              onSelectPrompt={(prompt) => handleSendMessage(prompt)}
              onStartLiveVoice={() => setIsLiveVoiceOpen(true)}
              tutorName={settings?.tutor_name || 'Maya'}
              userName={user?.name}
              onOpenAuth={() => setIsAuthOpen(true)}
            />
          ) : (
            <div className="max-w-3xl w-full mx-auto flex-1">
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isSpeakingThis={speakingMessageId === msg.id && isSpeaking}
                  onSpeak={(text, rate) => handleSpeak(msg.id, text, rate)}
                  onStopSpeak={handleStopSpeak}
                  onAskExplainInTelugu={handleAskExplainInTelugu}
                  onAskSimplify={handleAskSimplify}
                  onCorrectionSaved={refreshStats}
                />
              ))}

              {/* Generating / Thinking indicator */}
              {isLoading && (
                <div className="flex items-center gap-3 my-4">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white">
                    <Sparkles className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
                    <span>Maya is thinking & preparing natural feedback...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Bottom Composer */}
        <Composer
          onSendMessage={handleSendMessage}
          onStartLiveVoice={() => setIsLiveVoiceOpen(true)}
          isLoading={isLoading}
          suggestedReplies={suggestedReplies}
          isListening={isListening}
          transcript={transcript}
          interimTranscript={interimTranscript}
          durationSeconds={durationSeconds}
          speechError={speechError}
          onStartListening={startListening}
          onStopListening={stopListening}
          onResetTranscript={resetTranscript}
          languageMode={settings?.preferred_language || 'en_te'}
          onToggleLanguageMode={handleToggleLanguageMode}
        />
      </main>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      <LiveVoiceModal
        isOpen={isLiveVoiceOpen}
        onClose={() => setIsLiveVoiceOpen(false)}
        conversationId={currentConversationId}
        settings={settings}
        onMessageSent={(reply, corr) => {
          refreshStats();
        }}
      />

      <VocabularyModal
        isOpen={isVocabOpen}
        onClose={() => setIsVocabOpen(false)}
        words={vocabulary}
        onRefresh={refreshStats}
        onSpeak={(text) => speak(text, settings?.voice_speed || 1.0)}
      />

      <SavedCorrectionsModal
        isOpen={isCorrectionsOpen}
        onClose={() => setIsCorrectionsOpen(false)}
        corrections={savedCorrections}
        onRefresh={refreshStats}
      />

      <LearningProgressModal
        isOpen={isProgressOpen}
        onClose={() => setIsProgressOpen(false)}
        stats={stats}
        settings={settings}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdate={(newSettings) => setSettings(newSettings)}
        voices={voices}
        femaleVoice={femaleVoice}
        onSelectVoice={setFemaleVoice}
      />

      <ToolsModal
        isOpen={isToolsOpen}
        onClose={() => setIsToolsOpen(false)}
        onStartInterview={(prompt) => handleSendMessage(prompt)}
        onStartChallenge={(challengeText) => handleSendMessage(challengeText)}
      />
    </div>
  );
};

export default App;
