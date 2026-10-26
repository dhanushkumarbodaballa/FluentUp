import React, { useState, useRef } from 'react';
import {
  Volume2,
  VolumeX,
  Copy,
  Check,
  Sparkles,
  User,
  Languages,
  HelpCircle,
  Mic,
  MicOff,
  BookmarkPlus,
  RotateCcw,
  CheckCircle2,
  Award
} from 'lucide-react';
import { Message } from '../types';
import { GrammarCorrectionCard } from './GrammarCorrectionCard';
import { saveVocabulary } from '../services/api';

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
  const [isSavedVocab, setIsSavedVocab] = useState(false);

  // Pronunciation Practice Drill States
  const [showPractice, setShowPractice] = useState(false);
  const [isPracticing, setIsPracticing] = useState(false);
  const [practiceTranscript, setPracticeTranscript] = useState('');
  const [practiceScore, setPracticeScore] = useState<number | null>(null);
  const recognitionRef = useRef<any>(null);

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

  const handleQuickSaveVocab = async () => {
    try {
      // Extract first bolded term or first phrase
      const boldMatch = message.text.match(/\*\*([^*]+)\*\*/);
      const wordToSave = boldMatch ? boldMatch[1] : message.text.slice(0, 30);
      await saveVocabulary({
        word: wordToSave,
        definition: message.text.slice(0, 100),
        telugu_meaning: languageMode === 'en_te' ? 'సంభాషణ పదం' : '',
        example_sentence: message.text.slice(0, 120),
      });
      setIsSavedVocab(true);
      setTimeout(() => setIsSavedVocab(false), 3000);
      if (onCorrectionSaved) onCorrectionSaved();
    } catch (e) {
      console.error(e);
    }
  };

  // Pronunciation drill audio evaluation
  const handleStartPractice = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Google Chrome or Edge.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsPracticing(true);
        setPracticeTranscript('');
        setPracticeScore(null);
      };

      recognition.onresult = (event: any) => {
        let text = '';
        for (let i = 0; i < event.results.length; i++) {
          text += event.results[i][0].transcript;
        }
        setPracticeTranscript(text);
      };

      recognition.onend = () => {
        setIsPracticing(false);
      };

      recognition.onerror = () => {
        setIsPracticing(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error(err);
      setIsPracticing(false);
    }
  };

  const handleStopPractice = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsPracticing(false);

    // Calculate match score
    if (practiceTranscript.trim()) {
      const targetWords = message.text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/);
      const spokenWords = practiceTranscript.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/);
      let matches = 0;
      spokenWords.forEach(w => {
        if (targetWords.includes(w)) matches++;
      });
      const ratio = Math.min(100, Math.round((matches / Math.max(1, targetWords.length)) * 100 + 40));
      setPracticeScore(Math.min(98, Math.max(50, ratio)));
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
          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-xs">
            <User className="w-4 h-4" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-sm shadow-brand-500/30">
            <Sparkles className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Bubble Container */}
      <div className={`max-w-[85%] sm:max-w-[78%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
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

          {/* Grammar correction card */}
          {!isUser && message.correction && message.correction.original?.trim() && message.correction.improved?.trim() && message.correction.original.trim().toLowerCase() !== message.correction.improved.trim().toLowerCase() && message.correction.original.trim().toLowerCase() !== 'null' && (
            <GrammarCorrectionCard
              correction={message.correction}
              onSaved={onCorrectionSaved}
              onSpeakImproved={(text) => onSpeak(text, 0.9)}
            />
          )}

          {/* Interactive Pronunciation Practice Studio Box */}
          {showPractice && !isUser && (
            <div className="mt-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-brand-200 dark:border-brand-900/60 text-left animate-fadeIn space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-brand-600 dark:text-brand-400 flex items-center gap-1">
                  <Mic className="w-3.5 h-3.5" />
                  Pronunciation Practice Studio
                </span>
                <button
                  onClick={() => setShowPractice(false)}
                  className="text-[10px] text-slate-400 hover:text-slate-600 font-semibold"
                >
                  Close
                </button>
              </div>

              <div className="text-xs text-slate-600 dark:text-slate-300">
                Tap the mic below and read the phrase out loud:
              </div>

              {/* Spoken transcription preview */}
              {practiceTranscript && (
                <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs italic text-slate-800 dark:text-slate-200">
                  You said: "{practiceTranscript}"
                </div>
              )}

              {/* Feedback Score */}
              {practiceScore !== null && (
                <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 font-semibold animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>
                    {practiceScore >= 80
                      ? `🌟 Outstanding Pronunciation! ${practiceScore}% Match (+20 XP)`
                      : `👍 Good attempt! ${practiceScore}% Match. Keep practicing!`}
                  </span>
                </div>
              )}

              {/* Controls */}
              <div className="flex items-center gap-2 pt-1">
                {!isPracticing ? (
                  <button
                    onClick={handleStartPractice}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-xs transition-all"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>Record My Voice</span>
                  </button>
                ) : (
                  <button
                    onClick={handleStopPractice}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs animate-pulse"
                  >
                    <MicOff className="w-3.5 h-3.5" />
                    <span>Done Speaking</span>
                  </button>
                )}

                <button
                  onClick={() => onSpeak(message.text, 0.85)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-50 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Slow Audio</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Message Actions / Controls */}
        {!isUser && (
          <div className="flex items-center gap-1 mt-1.5 px-1 text-slate-400 dark:text-slate-500 flex-wrap">
            {/* Audio Playback button */}
            <button
              onClick={toggleSpeech}
              title={isSpeakingThis ? 'Stop speaking' : 'Listen with natural voice'}
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

            {/* Practice Saying Drill toggle */}
            <button
              onClick={() => setShowPractice(!showPractice)}
              title="Practice speaking this sentence"
              className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium hover:bg-brand-50 dark:hover:bg-brand-950/60 text-brand-600 dark:text-brand-400 transition-colors"
            >
              <Mic className="w-3 h-3" />
              <span>Practice Saying</span>
            </button>

            {/* Save word to Vocabulary */}
            <button
              onClick={handleQuickSaveVocab}
              title="Save to Vocabulary Bank"
              className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            >
              {isSavedVocab ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-500 font-semibold">Saved!</span>
                </>
              ) : (
                <>
                  <BookmarkPlus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Save</span>
                </>
              )}
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
                <span>{languageMode === 'en_hi' ? 'Hindi' : 'Telugu'}</span>
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
