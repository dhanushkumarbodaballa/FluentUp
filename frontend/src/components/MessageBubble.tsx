import React, { useState } from 'react';
import { Volume2, VolumeX, Copy, Check, Sparkles, User, RefreshCw, Languages, HelpCircle } from 'lucide-react';
import { Message } from '../types';
import { GrammarCorrectionCard } from './GrammarCorrectionCard';

interface MessageBubbleProps {
  message: Message;
  isSpeakingThis: boolean;
  onSpeak: (text: string, rate: number) => void;
  onStopSpeak: () => void;
  onAskExplainInTelugu?: (text: string) => void;
  onAskSimplify?: (text: string) => void;
  onCorrectionSaved?: () => void;
  languageMode?: 'en_te' | 'en_hi' | 'en_only';
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isSpeakingThis,
  onSpeak,
  onStopSpeak,
  onAskExplainInTelugu,
  onAskSimplify,
  onCorrectionSaved,
  languageMode = 'en_te',
}) => {
  const isUser = message.sender === 'user';
  const [copied, setCopied] = useState(false);
  const [speechRate, setSpeechRate] = useState<number>(1.0);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleSpeech = () => {
    if (isSpeakingThis) {
      onStopSpeak();
    } else {
      onSpeak(message.text, speechRate);
    }
  };

  const cycleRate = () => {
    const nextRate = speechRate === 1.0 ? 0.85 : speechRate === 0.85 ? 1.2 : 1.0;
    setSpeechRate(nextRate);
    if (isSpeakingThis) {
      onSpeak(message.text, nextRate);
    }
  };

  return (
    <div
      className={`flex gap-3 my-4 group ${
        isUser ? 'flex-row-reverse justify-start' : 'flex-row justify-start'
      }`}
    >
      {/* Avatar */}
      <div className="shrink-0 mt-0.5">
        {isUser ? (
          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300">
            <User className="w-4 h-4" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-sm shadow-brand-500/30">
            <Sparkles className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Bubble Container */}
      <div className={`max-w-[85%] sm:max-w-[75%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed transition-all shadow-sm ${
            isUser
              ? 'bg-brand-600 text-white rounded-br-xs'
              : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-xs'
          }`}
        >
          {/* Main message text */}
          <div className="whitespace-pre-wrap font-normal">
            {message.text}
          </div>

          {/* Grammar correction card (only rendered when there is a real correction) */}
          {!isUser && message.correction && message.correction.original?.trim() && message.correction.improved?.trim() && message.correction.original.trim().toLowerCase() !== message.correction.improved.trim().toLowerCase() && message.correction.original.trim().toLowerCase() !== 'null' && (
            <GrammarCorrectionCard
              correction={message.correction}
              onSaved={onCorrectionSaved}
              onSpeakImproved={(text) => onSpeak(text, 0.9)}
            />
          )}
        </div>

        {/* Message Actions / Controls */}
        {!isUser && (
          <div className="flex items-center gap-1 mt-1.5 px-1 text-slate-400 dark:text-slate-500">
            {/* Audio Playback button */}
            <button
              onClick={toggleSpeech}
              title={isSpeakingThis ? 'Stop speaking' : 'Listen with natural female voice'}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium transition-colors ${
                isSpeakingThis
                  ? 'bg-brand-100 dark:bg-brand-950/70 text-brand-700 dark:text-brand-300'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {isSpeakingThis ? (
                <>
                  <VolumeX className="w-3.5 h-3.5 animate-pulse text-brand-600" />
                  <span>Stop</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Listen</span>
                </>
              )}
            </button>

            {/* Speech rate toggle */}
            <button
              onClick={cycleRate}
              title="Change speaking speed"
              className="px-1.5 py-0.5 rounded text-[11px] font-medium hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300"
            >
              {speechRate}x
            </button>

            {/* Copy button */}
            <button
              onClick={handleCopy}
              title="Copy message"
              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            {/* Explain in Telugu / Hindi quick helper */}
            {onAskExplainInTelugu && languageMode !== 'en_only' && (
              <button
                onClick={() => onAskExplainInTelugu(message.text)}
                title={languageMode === 'en_hi' ? 'Explain this in Hindi' : 'Explain this in Telugu'}
                className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-brand-600 dark:hover:text-brand-400"
              >
                <Languages className="w-3 h-3" />
                <span>{languageMode === 'en_hi' ? 'Explain in Hindi' : 'Explain in Telugu'}</span>
              </button>
            )}

            {/* Simplify */}
            {onAskSimplify && (
              <button
                onClick={() => onAskSimplify(message.text)}
                title="Simplify this sentence"
                className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300"
              >
                <HelpCircle className="w-3 h-3" />
                <span>Simplify</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
