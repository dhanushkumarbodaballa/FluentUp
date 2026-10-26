import React from 'react';
import {
  Sparkles,
  MessageCircle,
  Mic,
  HelpCircle,
  Briefcase,
  HeartHandshake,
  Languages,
  BookOpen,
  Coffee,
  Compass,
  GraduationCap,
  ChevronRight,
  Theater
} from 'lucide-react';

interface WelcomeScreenProps {
  onSelectPrompt: (prompt: string) => void;
  onStartLiveVoice: () => void;
  onOpenRoleplay?: () => void;
  tutorName?: string;
  userName?: string;
  onOpenAuth?: () => void;
  learningTarget?: 'english' | 'hindi' | 'japanese';
  onToggleLearningTarget?: (target: 'english' | 'hindi' | 'japanese') => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onSelectPrompt,
  onStartLiveVoice,
  onOpenRoleplay,
  tutorName = "Maya",
  userName,
  onOpenAuth,
  learningTarget = 'english',
  onToggleLearningTarget,
}) => {
  const isHindi = learningTarget === 'hindi';
  const isJapanese = learningTarget === 'japanese';

  const englishPrompts = [
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

  const hindiPrompts = [
    {
      text: "How do I say 'Water' in Hindi?",
      icon: Sparkles,
      description: "Translate words with Devanagari, pronunciation & examples"
    },
    {
      text: "Teach me daily greetings in Hindi.",
      icon: MessageCircle,
      description: "Namaste, Shubh Prabhaat, Aap kaise hain & respect levels"
    },
    {
      text: "How to say 'Thank you' in Hindi?",
      icon: HeartHandshake,
      description: "Dhanyavaad, Shukriya & polite conversational etiquette"
    },
    {
      text: "Translate 'Where are you going?' to Hindi.",
      icon: Compass,
      description: "Learn natural spoken Hindi questions and sentence structure"
    },
    {
      text: "How to order tea and food in Hindi?",
      icon: Coffee,
      description: "Everyday cafe, restaurant, and market phrases"
    },
    {
      text: "Teach me 5 useful spoken Hindi words.",
      icon: BookOpen,
      description: "Build your Hindi vocabulary with everyday words"
    }
  ];

  const japanesePrompts = [
    {
      text: "Teach me Japanese from the basics (Lesson 1)",
      icon: GraduationCap,
      description: "Start from zero: 5 pure vowel sounds & the 6 golden greetings"
    },
    {
      text: "How do I introduce myself in Japanese? (Lesson 2)",
      icon: MessageCircle,
      description: "Hajimemashite, Watashi wa [Name] desu & etiquette"
    },
    {
      text: "How do I say 'Water' in Japanese?",
      icon: Sparkles,
      description: "Kanji (水), Hiragana (みず), Romaji (Mizu) & polite usage"
    },
    {
      text: "Teach me numbers 1 to 10 in Japanese (Lesson 3)",
      icon: BookOpen,
      description: "Ichi, Ni, San, Yon, Go & modular counting tricks"
    },
    {
      text: "How to say 'Thank you' in Japanese?",
      icon: HeartHandshake,
      description: "Arigatou gozaimasu (ありがとうございます) & casual 'Doumo'"
    },
    {
      text: "Translate 'Where are you going?' to Japanese.",
      icon: Compass,
      description: "Doko e ikimasu ka (どこへ行きますか) & grammar breakdown"
    }
  ];

  const suggestedPrompts = isJapanese ? japanesePrompts : isHindi ? hindiPrompts : englishPrompts;

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-2xl mx-auto text-center animate-fadeIn">
      {/* Mode Switcher Toggle Pill (English / Hindi / Japanese) */}
      {onToggleLearningTarget && (
        <div className="mb-5 inline-flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-xs flex-wrap justify-center gap-1">
          <button
            onClick={() => onToggleLearningTarget('english')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              !isHindi && !isJapanese
                ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>🎓 English</span>
          </button>
          <button
            onClick={() => onToggleLearningTarget('hindi')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              isHindi
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>🇮🇳 Hindi (हिंदी)</span>
          </button>
          <button
            onClick={() => onToggleLearningTarget('japanese')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              isJapanese
                ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>🇯🇵 Japanese (日本語)</span>
          </button>
        </div>
      )}

      {/* Small Elegant AI Tutor Avatar / Animated Voice Indicator */}
      <div className="relative mb-4">
        <div
          className={`w-16 h-16 rounded-full p-0.5 shadow-lg flex items-center justify-center ${
            isJapanese
              ? 'bg-gradient-to-tr from-rose-500 via-red-500 to-pink-500 shadow-rose-500/30'
              : isHindi
              ? 'bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 shadow-amber-500/30'
              : 'bg-gradient-to-tr from-brand-600 via-indigo-500 to-purple-400 shadow-brand-500/30'
          }`}
        >
          <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden">
            <span
              className={`text-2xl font-bold bg-clip-text text-transparent ${
                isJapanese
                  ? 'bg-gradient-to-tr from-rose-500 to-red-600'
                  : isHindi
                  ? 'bg-gradient-to-tr from-amber-500 to-rose-500'
                  : 'bg-gradient-to-tr from-brand-600 to-indigo-500'
              }`}
            >
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
        {isJapanese
          ? userName
            ? `こんにちは、${userName}! Let's learn Japanese.`
            : "こんにちは! I'm Maya, your Japanese Tutor."
          : isHindi
          ? userName
            ? `नमस्ते, ${userName}! Let's learn Hindi.`
            : "नमस्ते! I'm Maya, your Hindi Tutor."
          : userName
          ? `Hi, ${userName}! Let's practice English.`
          : "Hi! I'm your English buddy."}
      </h1>

      {/* Subtitle & Supportive Message */}
      <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-lg leading-relaxed mb-4">
        {isJapanese
          ? "Speak or type any word or sentence in English. I'll translate it into Japanese (Kanji, Hiragana & Romaji), guide your pronunciation, and help you speak Japanese naturally!"
          : isHindi
          ? "Speak or type any word or sentence in English or Telugu. I'll translate it to Hindi, guide your pronunciation, and help you speak Hindi fluently!"
          : "Let's improve your English together. We can talk about anything, practise speaking, or fix your sentences. Don't worry about mistakes — I'll help you."}
      </p>

      {/* Guest Login Suggestion Pill */}
      {!userName && onOpenAuth && (
        <button
          onClick={onOpenAuth}
          className="mb-5 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50 hover:bg-amber-100 transition-colors shadow-xs"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span><b>Sign In / Register</b> to save your conversations & vocabulary bank</span>
        </button>
      )}

      {/* Interactive Modes Banner Grid */}
      <div className="w-full mb-5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
        {/* Live Voice Banner */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-brand-500/10 via-purple-500/10 to-indigo-500/10 border border-brand-200/80 dark:border-brand-900/60 flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-md shadow-brand-600/30 shrink-0">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">Live Voice Call</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Natural audio conversation</div>
            </div>
          </div>
          <button
            onClick={onStartLiveVoice}
            className="px-3 py-1.5 text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-xs transition-all whitespace-nowrap cursor-pointer"
          >
            Start Voice
          </button>
        </div>

        {/* Real-World Roleplay Banner */}
        {onOpenRoleplay && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-rose-500/10 border border-purple-200/80 dark:border-purple-900/60 flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-600 text-white flex items-center justify-center shadow-md shadow-purple-600/30 shrink-0">
                <Theater className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">Roleplay Rooms</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Cafe, Job, Hotel & Travel</div>
              </div>
            </div>
            <button
              onClick={onOpenRoleplay}
              className="px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl shadow-xs transition-all whitespace-nowrap cursor-pointer"
            >
              Explore Rooms
            </button>
          </div>
        )}
      </div>

      {/* Japanese Basics Roadmap Card */}
      {isJapanese && (
        <div className="w-full mb-5 p-4 rounded-2xl bg-gradient-to-br from-rose-500/10 via-pink-500/10 to-amber-500/10 border border-rose-200 dark:border-rose-900/60 text-left shadow-xs">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-red-500 text-white flex items-center justify-center shadow-md shadow-rose-600/30">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>Japanese From Basics</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                    Beginner Course
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Step-by-step lessons with Romaji phonetics & daily speaking drills
                </div>
              </div>
            </div>
            <button
              onClick={() => onSelectPrompt("Teach me Japanese from the basics (Lesson 1)")}
              className="px-3 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition-all flex items-center gap-1 whitespace-nowrap"
            >
              <span>Start Lesson 1</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick 6 Lesson Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-1">
            {[
              { num: "1", title: "Greetings & Vowels", prompt: "Start Lesson 1: Japanese Basics & Greetings" },
              { num: "2", title: "Self-Introduction", prompt: "Start Lesson 2: Self-Introduction in Japanese" },
              { num: "3", title: "Numbers 1 to 10", prompt: "Start Lesson 3: Japanese Numbers 1 to 10" },
              { num: "4", title: "Survival & 'Please'", prompt: "Start Lesson 4: Daily Survival Words & Kudasai" },
              { num: "5", title: "Questions with 'ka'", prompt: "Start Lesson 5: Essential Questions with 'ka'" },
              { num: "6", title: "Sentence Order (SOV)", prompt: "Start Lesson 6: Sentence Structure SOV" }
            ].map((lesson) => (
              <button
                key={lesson.num}
                onClick={() => onSelectPrompt(lesson.prompt)}
                className="flex items-center gap-1.5 p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-900 border border-rose-200/70 dark:border-rose-900/40 text-left hover:border-rose-400 dark:hover:border-rose-700 transition-all group"
              >
                <span className="w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[10px] font-bold flex items-center justify-center shrink-0 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                  {lesson.num}
                </span>
                <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 group-hover:text-rose-600 dark:group-hover:text-rose-400 truncate">
                  {lesson.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

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
                <Icon className={`w-4 h-4 group-hover:scale-110 transition-transform ${isHindi ? 'text-amber-500' : 'text-brand-500'}`} />
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
