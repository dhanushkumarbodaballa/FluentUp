import React, { useState, useEffect } from 'react';
import { Wrench, CheckCircle2, Languages, Flame, Briefcase, X, Sparkles, ArrowRight, Lightbulb } from 'lucide-react';
import { checkGrammar, translateText, getDailyChallenge } from '../services/api';

interface ToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartInterview: (topic: string) => void;
  onStartChallenge: (challengeText: string) => void;
}

export const ToolsModal: React.FC<ToolsModalProps> = ({
  isOpen,
  onClose,
  onStartInterview,
  onStartChallenge,
}) => {
  const [activeTab, setActiveTab] = useState<'grammar' | 'translate' | 'challenge' | 'interview'>('grammar');

  // Grammar Checker state
  const [grammarInput, setGrammarInput] = useState('');
  const [grammarResult, setGrammarResult] = useState<any>(null);
  const [isCheckingGrammar, setIsCheckingGrammar] = useState(false);

  // Translator state
  const [transInput, setTransInput] = useState('');
  const [transTarget, setTransTarget] = useState<'te' | 'en'>('te');
  const [transResult, setTransResult] = useState<any>(null);
  const [isTranslating, setIsTranslating] = useState(false);

  // Daily Challenge state
  const [dailyChallenge, setDailyChallenge] = useState<any>(null);

  useEffect(() => {
    if (isOpen && !dailyChallenge) {
      getDailyChallenge().then(setDailyChallenge).catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCheckGrammar = async () => {
    if (!grammarInput.trim()) return;
    setIsCheckingGrammar(true);
    try {
      const res = await checkGrammar(grammarInput.trim());
      setGrammarResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsCheckingGrammar(false);
    }
  };

  const handleTranslate = async () => {
    if (!transInput.trim()) return;
    setIsTranslating(true);
    try {
      const res = await translateText(transInput.trim(), transTarget);
      setTransResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsTranslating(false);
    }
  };

  const interviewRoles = [
    {
      title: 'HR Introduction & Background',
      prompt: "Let's do a mock HR interview. Can you ask me 'Tell me about yourself' and give me feedback on my answers?",
    },
    {
      title: 'Strengths & Weaknesses',
      prompt: "Can we practice answering the question 'What are your greatest strengths and weaknesses?' in simple, confident English?",
    },
    {
      title: 'Why Should We Hire You?',
      prompt: "I'd like to practice answering 'Why should we hire you?'. Please act as the hiring manager.",
    },
    {
      title: 'Handling a Difficult Project',
      prompt: "Let's practice behavioral interview questions. Ask me about a time I faced a challenge and how I handled it.",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="w-full max-w-xl max-h-[85vh] rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-100 dark:bg-cyan-950/70 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">AI English Power Tools</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Integrated learning utilities</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 px-4 pt-2 gap-1 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('grammar')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'grammar'
                ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Grammar Checker</span>
          </button>

          <button
            onClick={() => setActiveTab('translate')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'translate'
                ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Languages className="w-3.5 h-3.5" />
            <span>English ↔ Telugu</span>
          </button>

          <button
            onClick={() => setActiveTab('challenge')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'challenge'
                ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>Daily Challenge</span>
          </button>

          <button
            onClick={() => setActiveTab('interview')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'interview'
                ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
            <span>Interview Practice</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 overflow-y-auto flex-1">
          {/* TAB 1: Grammar Checker */}
          {activeTab === 'grammar' && (
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Type or paste a sentence to check:
              </label>
              <textarea
                rows={3}
                value={grammarInput}
                onChange={(e) => setGrammarInput(e.target.value)}
                placeholder="e.g. Yesterday I go to college and met my friends."
                className="w-full p-3 text-xs rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              <div className="flex justify-end">
                <button
                  onClick={handleCheckGrammar}
                  disabled={isCheckingGrammar || !grammarInput.trim()}
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-xs"
                >
                  {isCheckingGrammar ? 'Checking...' : 'Check Sentence'}
                </button>
              </div>

              {grammarResult && (
                <div className="mt-4 p-4 rounded-2xl border border-brand-200 dark:border-brand-900 bg-brand-50/40 dark:bg-brand-950/30 text-xs space-y-2">
                  <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-brand-600" />
                    <span>{grammarResult.message}</span>
                  </div>

                  {grammarResult.correction && (
                    <div className="space-y-2 pt-2 border-t border-brand-100 dark:border-brand-900/50">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-rose-500">Original: </span>
                        <span className="line-through text-slate-500">{grammarResult.correction.original}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase text-emerald-600">Improved: </span>
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                          {grammarResult.correction.improved}
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-white/70 dark:bg-slate-800/50 text-[11px] text-slate-700 dark:text-slate-300">
                        <strong>Rule: </strong>
                        {grammarResult.correction.explanation_en}
                      </div>
                      {grammarResult.correction.explanation_te && (
                        <div className="p-2 rounded-xl bg-brand-100/50 dark:bg-brand-950/60 text-[11px] text-brand-900 dark:text-brand-200">
                          <strong>Telugu Insight: </strong>
                          {grammarResult.correction.explanation_te}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Translator */}
          {activeTab === 'translate' && (
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Enter text in Telugu or English:
              </label>
              <textarea
                rows={3}
                value={transInput}
                onChange={(e) => setTransInput(e.target.value)}
                placeholder="e.g. Nenu repu vasthanu / I have a lot of work today"
                className="w-full p-3 text-xs rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              <div className="flex justify-end">
                <button
                  onClick={handleTranslate}
                  disabled={isTranslating || !transInput.trim()}
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-xs"
                >
                  {isTranslating ? 'Translating...' : 'Translate & Explain'}
                </button>
              </div>

              {transResult && (
                <div className="mt-4 p-4 rounded-2xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/30 text-xs space-y-2">
                  <div className="text-slate-500 dark:text-slate-400">Translated Expression:</div>
                  <div className="text-sm font-bold text-indigo-900 dark:text-indigo-200">
                    "{transResult.translated}"
                  </div>
                  {transResult.note && (
                    <div className="text-[11px] text-slate-600 dark:text-slate-300 pt-1 border-t border-indigo-100 dark:border-indigo-900/50">
                      <strong>Usage Note: </strong>
                      {transResult.note}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Daily Challenge */}
          {activeTab === 'challenge' && dailyChallenge && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 border border-amber-200 dark:border-amber-900/60">
                <div className="flex items-center gap-2 mb-2">
                  <Flame className="w-5 h-5 text-amber-500" />
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {dailyChallenge.title}
                  </h3>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
                  {dailyChallenge.instruction}
                </p>
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-400 italic mb-3">
                  <strong>Starter Idea: </strong>"{dailyChallenge.sample_start}"
                </div>
                <button
                  onClick={() => {
                    onStartChallenge(
                      `Let's do today's challenge: ${dailyChallenge.title}. Instruction: ${dailyChallenge.instruction}`
                    );
                    onClose();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs shadow-xs"
                >
                  <span>Practice with Maya in Chat</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: Interview Practice */}
          {activeTab === 'interview' && (
            <div className="space-y-2.5">
              <div className="text-xs text-slate-500 mb-2">
                Select an interview topic to launch an interactive mock interview with Maya:
              </div>
              {interviewRoles.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    onStartInterview(item.prompt);
                    onClose();
                  }}
                  className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-brand-500 dark:hover:border-brand-500 bg-white dark:bg-slate-900 cursor-pointer group transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-xs text-slate-800 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-brand-400">
                      {item.title}
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-500 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{item.prompt}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
