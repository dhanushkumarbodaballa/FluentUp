import React, { useState } from 'react';
import {
  Theater,
  Coffee,
  Briefcase,
  Plane,
  HeartPulse,
  ShoppingBag,
  Users,
  X,
  Sparkles,
  ArrowRight,
  Languages
} from 'lucide-react';

interface RoleplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartScenario: (title: string, prompt: string) => void;
  learningTarget?: 'english' | 'hindi' | 'japanese';
}

export const RoleplayModal: React.FC<RoleplayModalProps> = ({
  isOpen,
  onClose,
  onStartScenario,
  learningTarget = 'english',
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  if (!isOpen) return null;

  const scenarios = [
    {
      id: 'cafe',
      category: 'daily',
      icon: Coffee,
      color: 'from-amber-500 to-orange-500',
      title: 'Cafe & Restaurant Order',
      description: 'Order your favorite coffee, tea, and food. Practice customizing orders and asking for the bill.',
      prompts: {
        english: "Let's roleplay! You are a barista at a cozy modern coffee shop in New York. I just walked in. Greet me and ask for my order in natural, conversational English.",
        hindi: "चलो एक रोलप्ले (Roleplay) करते हैं! आप एक कैफ़े के बरिस्ता हैं और मैं ग्राहक। मुझसे हिंदी में पूछिए कि मैं क्या लेना पसंद करूँगा। (Let's roleplay ordering in Hindi!)",
        japanese: "カフェのロールプレイをしましょう！ (Let's roleplay ordering at a Tokyo cafe!) You are a friendly barista in Shibuya. Greet me in polite Japanese and ask for my order."
      }
    },
    {
      id: 'interview',
      category: 'career',
      icon: Briefcase,
      color: 'from-blue-600 to-indigo-600',
      title: 'Mock Job Interview',
      description: 'Practice answering HR and behavioral questions with confidence. Get immediate gentle feedback.',
      prompts: {
        english: "Let's do a mock job interview. You are a senior hiring manager. Please welcome me to the interview and ask me the opening question: 'Tell me about yourself and your background.'",
        hindi: "नौकरी के इंटरव्यू का अभ्यास करते हैं। आप हायरिंग मैनेजर की भूमिका में मुझसे सरल हिंदी और इंग्लिश में सवाल पूछिए।",
        japanese: "面接（めんせつ）の練習をしましょう！ (Let's practice a job interview in Japanese!) You are an interviewer. Ask me to introduce myself politely in Japanese."
      }
    },
    {
      id: 'travel',
      category: 'travel',
      icon: Plane,
      color: 'from-emerald-500 to-teal-600',
      title: 'Airport & Hotel Check-in',
      description: 'Navigate passport control, luggage drops, boarding gates, and hotel room check-in smoothly.',
      prompts: {
        english: "Let's roleplay an airport check-in counter. You are the airline check-in agent. Greet me, ask for my passport and destination, and ask if I have any baggage to check.",
        hindi: "होटल चेक-इन का रोलप्ले करते हैं। आप रिसेप्शनिस्ट हैं और मैं नया गेस्ट। कमरे और नाश्ते के बारे में बातचीत करते हैं।",
        japanese: "ホテルのチェックインのロールプレイをしましょう！ (Let's roleplay checking into a hotel in Japan!) Greet me as the front desk clerk in polite Japanese."
      }
    },
    {
      id: 'directions',
      category: 'daily',
      icon: HeartPulse,
      color: 'from-rose-500 to-pink-600',
      title: 'Directions & Pharmacy Help',
      description: 'Ask locals for directions to the train station, pharmacy, or get assistance when you are lost.',
      prompts: {
        english: "Let's roleplay: I am lost in a busy city looking for the nearest train station and pharmacy. You are a friendly local walking by. Please respond warmly when I ask for help.",
        hindi: "रास्ता पूछने का रोलप्ले: मैं शहर में नया हूँ और मेट्रो स्टेशन ढूंढ रहा हूँ। आप एक मददगार राहगीर की भूमिका निभाएं।",
        japanese: "道案内のロールプレイをしましょう！ (Let's roleplay asking for directions in Tokyo!) I am lost and asking: '駅はどこですか？' (Where is the station?). Guide me politely."
      }
    },
    {
      id: 'shopping',
      category: 'daily',
      icon: ShoppingBag,
      color: 'from-purple-500 to-indigo-600',
      title: 'Shopping & Asking Prices',
      description: 'Inquire about prices, sizes, colors, and ask for recommendations or discounts politely.',
      prompts: {
        english: "Let's roleplay: I'm shopping for clothes and souvenirs at a boutique store. You are the shop assistant. Greet me and ask how you can help me find what I'm looking for.",
        hindi: "बाज़ार में ख़रीदारी का रोलप्ले: आप दुकानदार हैं। मैं चीज़ों के दाम और डिस्काउंट के बारे में पूछ रहा हूँ।",
        japanese: "買い物のロールプレイをしましょう！ (Let's roleplay shopping in Akihabara or Ginza!) Greet me with 'いらっしゃいませ' (Irasshaimase) and ask how to assist me."
      }
    },
    {
      id: 'social',
      category: 'social',
      icon: Users,
      color: 'from-amber-500 to-rose-500',
      title: 'Casual Small Talk & Party',
      description: 'Break the ice effortlessly at social events. Talk about movies, cricket, travel, and hobbies.',
      prompts: {
        english: "Let's roleplay meeting at a friend's weekend house party. You just walked over to say hi. Introduce yourself casually and ask about what movies or music I like.",
        hindi: "दोस्तों की पार्टी में बातचीत का रोलप्ले: हम पहली बार मिल रहे हैं। आइए शौक और पसंदीदा फिल्मों पर दोस्ताना बातचीत करें।",
        japanese: "友だちとの日常会話ロールプレイをしましょう！ (Let's practice casual small talk with a friend!) Say hello casually and ask about my hobbies."
      }
    }
  ];

  const filtered = selectedCategory === 'all'
    ? scenarios
    : scenarios.filter(s => s.category === selectedCategory);

  const handleLaunch = (scenario: typeof scenarios[0]) => {
    const prompt = scenario.prompts[learningTarget] || scenario.prompts.english;
    onStartScenario(`🎭 ${scenario.title}`, prompt);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="w-full max-w-2xl max-h-[88vh] rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md shadow-brand-500/25">
              <Theater className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Real-World Roleplay Rooms</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-900">
                  {learningTarget === 'japanese' ? '🇯🇵 Japanese' : learningTarget === 'hindi' ? '🇮🇳 Hindi' : '🎓 English'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Practice speaking in realistic scenarios with Maya roleplaying characters
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 px-5 py-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/40 overflow-x-auto scrollbar-none">
          {[
            { id: 'all', label: 'All Scenarios' },
            { id: 'daily', label: '☕ Everyday & Cafe' },
            { id: 'career', label: '💼 Job Interview' },
            { id: 'travel', label: '✈️ Airport & Hotel' },
            { id: 'social', label: '🤝 Small Talk' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-300'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Scenarios Grid */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {filtered.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-brand-500/80 dark:hover:border-brand-500/80 hover:shadow-lg hover:shadow-brand-500/5 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${item.color} text-white flex items-center justify-center shadow-md`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Interactive
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    Earn +20 XP
                  </span>
                  <button
                    onClick={() => handleLaunch(item)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-brand-600 hover:text-white text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all group-hover:bg-brand-600 group-hover:text-white"
                  >
                    <span>Start Roleplay</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
          💡 Maya will stay in character and guide you with natural dialogue, corrections, and audio pronunciation!
        </div>
      </div>
    </div>
  );
};
