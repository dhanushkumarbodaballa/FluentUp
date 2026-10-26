import React from 'react';
import { Sparkles, MessageCircle, Mic, HelpCircle, Briefcase, HeartHandshake, Languages } from 'lucide-react';

interface WelcomeScreenProps {
  onSelectPrompt: (prompt: string) => void;
  onStartLiveVoice: () => void;
  tutorName?: string;
  userName?: string;
  onOpenAuth?: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onSelectPrompt,
  onStartLiveVoice,
  tutorName = "Maya",
  userName,
  onOpenAuth,
}) => {
  const suggestedPrompts = [
    {
      text: "Let's talk in English.",
      icon: MessageCircle,
      description: "Start a casual, everyday conversation"
    },
    {
      text: "Teach me everyday English.",
      icon: Sparkles,
      description: "Learn practical phrases for daily life"
    },
    {
      text: "Correct my English.",
      icon: HelpCircle,
      description: "Check your sentences and fix grammar gently"
    },
    {
      text: "Practise with me in Hindi / Telugu + English.",
      icon: Languages,
      description: "Learn with Hindi or Telugu explanations whenever stuck"
    },
    {
      text: "Help me speak confidently.",
      icon: HeartHandshake,
      description: "Overcome fear and hesitation while speaking"
    },
    {
      text: "Practise a job interview.",
      icon: Briefcase,
      description: "Mock HR and technical interview practice"
    }
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-2xl mx-auto text-center animate-fadeIn">
      {/* Small Elegant AI Tutor Avatar / Animated Voice Indicator */}
      <div className="relative mb-5">
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-brand-600 via-indigo-500 to-purple-400 p-0.5 shadow-lg shadow-brand-500/30 flex items-center justify-center">
          <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden">
            <span className="text-2xl font-bold bg-gradient-to-tr from-brand-600 to-indigo-500 bg-clip-text text-transparent">
              M
            </span>
          </div>
        </div>
        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full flex items-center justify-center">
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
        </div>
      </div>

      {/* Greeting Title */}
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">
        {userName ? `Hi, ${userName}! Let's practice English.` : "Hi! I'm your English buddy."}
      </h1>

      {/* Subtitle & Supportive Message */}
      <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-lg leading-relaxed mb-4">
        Let's improve your English together. We can talk about anything, practise speaking, or fix your sentences. Don't worry about mistakes — I'll help you.
      </p>

      {/* Guest Login Suggestion Pill */}
      {!userName && onOpenAuth && (
        <button
          onClick={onOpenAuth}
          className="mb-6 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50 hover:bg-amber-100 transition-colors shadow-xs"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span><b>Sign In / Register</b> to save your conversations & vocabulary bank</span>
        </button>
      )}

      {/* Live Voice Room CTA Banner */}
      <div className="w-full mb-6 p-3.5 rounded-2xl bg-gradient-to-r from-brand-500/10 via-purple-500/10 to-indigo-500/10 border border-brand-200 dark:border-brand-900/60 flex items-center justify-between gap-3 text-left">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-md shadow-brand-600/30">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-900 dark:text-white">Live Voice Conversation</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Speak fluently with real-time natural audio turn-taking</div>
          </div>
        </div>
        <button
          onClick={onStartLiveVoice}
          className="px-3.5 py-1.5 text-xs font-medium bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-sm transition-all whitespace-nowrap"
        >
          Start Voice
        </button>
      </div>

      {/* Suggested Prompts Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full text-left">
        {suggestedPrompts.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              onClick={() => onSelectPrompt(item.text)}
              className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-brand-500 dark:hover:border-brand-500 hover:shadow-sm hover:shadow-brand-500/10 transition-all text-left group"
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-4 h-4 text-brand-500 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-brand-400">
                  {item.text}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                {item.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
