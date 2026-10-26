import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Mic,
  MicOff,
  Headphones,
  StopCircle,
  Sparkles,
  Languages,
  Check,
  X
} from 'lucide-react';

interface ComposerProps {
  onSendMessage: (text: string, durationSeconds?: number) => void;
  onStartLiveVoice: () => void;
  isLoading: boolean;
  suggestedReplies: string[];
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  durationSeconds: number;
  speechError: string | null;
  onStartListening: () => void;
  onStopListening: () => void;
  onResetTranscript: () => void;
  languageMode: 'en_te' | 'en_hi' | 'en_only';
  onToggleLanguageMode: () => void;
  learningTarget?: 'english' | 'hindi';
  onToggleLearningTarget?: () => void;
}

export const Composer: React.FC<ComposerProps> = ({
  onSendMessage,
  onStartLiveVoice,
  isLoading,
  suggestedReplies,
  isListening,
  transcript,
  interimTranscript,
  durationSeconds,
  speechError,
  onStartListening,
  onStopListening,
  onResetTranscript,
  languageMode,
  onToggleLanguageMode,
  learningTarget = 'english',
  onToggleLearningTarget,
}) => {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea as user types
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  }, [text]);

  const handleSend = () => {
    if (!text.trim() || isLoading) return;
    onSendMessage(text.trim());
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  // If user recorded speech, send the confirmed transcript
  const handleConfirmVoiceMessage = () => {
    const finalVoiceText = (transcript + ' ' + interimTranscript).trim();
    if (finalVoiceText) {
      onSendMessage(finalVoiceText, durationSeconds);
    }
    onStopListening();
    onResetTranscript();
  };

  const handleCancelVoiceMessage = () => {
    onStopListening();
    onResetTranscript();
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-4 pt-1">
      {/* Quick Suggested Reply Pills */}
      {suggestedReplies && suggestedReplies.length > 0 && !isListening && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none mb-1">
          <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold shrink-0">
            Suggested:
          </span>
          {suggestedReplies.map((reply, idx) => (
            <button
              key={idx}
              onClick={() => onSendMessage(reply)}
              className="shrink-0 text-xs px-3 py-1 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-brand-500 dark:hover:border-brand-500 text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 transition-all shadow-xs"
            >
              {reply}
            </button>
          ))}
        </div>
      )}

      {/* Speech Recognition Error Banner */}
      {speechError && (
        <div className="mb-2 p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-700 dark:text-amber-300 flex items-center justify-between">
          <span>{speechError}</span>
          <button onClick={onResetTranscript} className="text-xs font-semibold underline ml-2">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Composer Box */}
      <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md shadow-slate-200/50 dark:shadow-none focus-within:border-brand-500 dark:focus-within:border-brand-500 transition-all">
        {/* Voice Recording Mode Overlay */}
        {isListening ? (
          <div className="p-3.5 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                </span>
                <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                  Listening... ({formatDuration(durationSeconds)})
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleCancelVoiceMessage}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Cancel recording"
                >
                  <X className="w-4 h-4" />
                </button>
                <button
                  onClick={handleConfirmVoiceMessage}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-medium shadow-sm"
                  title="Send spoken message"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </div>
            </div>

            {/* Live voice transcript display */}
            <div className="min-h-[44px] max-h-32 overflow-y-auto px-2 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-800 dark:text-slate-200 italic">
              {transcript || interimTranscript ? (
                <>
                  <span>{transcript}</span>
                  <span className="text-slate-400 dark:text-slate-500"> {interimTranscript}</span>
                </>
              ) : (
                <span className="text-slate-400">
                  {learningTarget === 'hindi'
                    ? "Speak now in English or Hindi... Maya will translate & teach you Hindi!"
                    : "Speak now in English... Maya is listening."}
                </span>
              )}
            </div>
          </div>
        ) : (
          /* Normal Text Mode */
          <div className="flex flex-col">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                learningTarget === 'hindi'
                  ? "Speak or type any word to translate & learn in Hindi... (e.g. 'Water', 'How are you?')"
                  : "Ask anything, say something in English, or talk with Maya..."
              }
              rows={1}
              disabled={isLoading}
              className="w-full resize-none bg-transparent px-4 pt-3.5 pb-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none disabled:opacity-60"
            />

            {/* Bottom Actions Row */}
            <div className="flex items-center justify-between px-3 pb-2.5 pt-1">
              {/* Left helpers */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Tutor Goal Mode Switcher Pill */}
                {onToggleLearningTarget && (
                  <button
                    onClick={onToggleLearningTarget}
                    title="Toggle Tutor Mode: English Tutor ↔ Hindi Tutor"
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all shadow-2xs ${
                      learningTarget === 'hindi'
                        ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800'
                        : 'bg-brand-50 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-900'
                    }`}
                  >
                    <span>{learningTarget === 'hindi' ? '🇮🇳 Hindi Tutor' : '🎓 English Tutor'}</span>
                  </button>
                )}

                {/* Language explanation mode toggle */}
                <button
                  onClick={onToggleLanguageMode}
                  title="Switch explanation language (Telugu / Hindi / English)"
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-medium transition-colors ${
                    languageMode === 'en_te'
                      ? 'bg-brand-50/60 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-900'
                      : languageMode === 'en_hi'
                      ? 'bg-indigo-50/60 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Languages className="w-3 h-3" />
                  <span>
                    {languageMode === 'en_te'
                      ? 'Telugu'
                      : languageMode === 'en_hi'
                      ? 'Hindi'
                      : 'Eng Only'}
                  </span>
                </button>

                {/* Live Voice Room CTA */}
                <button
                  onClick={onStartLiveVoice}
                  title="Open Live Voice Conversation Room"
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-500/10 to-brand-500/10 border border-purple-200 dark:border-purple-900 text-purple-700 dark:text-purple-300 hover:bg-purple-100/50 dark:hover:bg-purple-950/50 transition-colors"
                >
                  <Headphones className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span className="hidden sm:inline">Live Voice</span>
                </button>
              </div>

              {/* Right: Mic & Send Buttons */}
              <div className="flex items-center gap-1.5">
                {/* Microphone Button */}
                <button
                  onClick={onStartListening}
                  title="Speak using microphone"
                  disabled={isLoading}
                  className="p-2 rounded-xl text-slate-500 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <Mic className="w-5 h-5" />
                </button>

                {/* Send Button */}
                <button
                  onClick={handleSend}
                  disabled={!text.trim() || isLoading}
                  title="Send message"
                  className={`p-2 rounded-xl transition-all ${
                    text.trim() && !isLoading
                      ? 'bg-brand-600 hover:bg-brand-700 text-white shadow-sm shadow-brand-600/30'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between mt-1.5 px-2 text-[11px] text-slate-400 dark:text-slate-500">
        <span className="flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-brand-500" />
          FluentUp AI responds gently & teaches through natural conversation
        </span>
        <span className="hidden sm:inline">Shift + Enter for new line</span>
      </div>
    </div>
  );
};
