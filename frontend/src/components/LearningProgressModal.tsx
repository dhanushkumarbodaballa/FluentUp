import React from 'react';
import { TrendingUp, Flame, MessageSquare, Mic, BookOpen, CheckCircle2, Award, X, Sparkles } from 'lucide-react';
import { LearningStats, UserSettings } from '../types';

interface LearningProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: LearningStats | null;
  settings: UserSettings | null;
}

export const LearningProgressModal: React.FC<LearningProgressModalProps> = ({
  isOpen,
  onClose,
  stats,
  settings,
}) => {
  if (!isOpen) return null;

  const minutesSpoken = stats ? Math.round(stats.minutes_spoken * 10) / 10 : 0;
  const level = settings?.english_level || 'beginner';

  // Level assessment guidance
  const levelDescriptions = {
    beginner: {
      badge: 'A1 - A2 (Foundation)',
      summary: 'Building daily conversational confidence, simple verb tenses, and overcoming hesitation.',
      nextStep: 'Practice everyday small talk and try forming past tense sentences.'
    },
    intermediate: {
      badge: 'B1 - B2 (Independent)',
      summary: 'Expressing ideas clearly in work and college, using connecting phrases and natural idioms.',
      nextStep: 'Practice job interviews and complex reasoning conversations.'
    },
    advanced: {
      badge: 'C1 (Fluent Professional)',
      summary: 'Polished pronunciation, nuance, executive presence, and spontaneous debate.',
      nextStep: 'Focus on advanced vocabulary and rapid impromptu speaking.'
    }
  };

  const currentLevelInfo = levelDescriptions[level as keyof typeof levelDescriptions] || levelDescriptions.beginner;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="w-full max-w-lg max-h-[85vh] rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Learning Progress</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Your spoken English journey</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Daily Streak Highlight Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 border border-amber-200/80 dark:border-amber-900/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md shadow-amber-500/30">
                <Flame className="w-6 h-6 fill-current" />
              </div>
              <div>
                <div className="text-xl font-bold text-slate-900 dark:text-white">
                  {stats?.streak_days || 1} Day Streak
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Consistency is the secret to natural fluency!
                </div>
              </div>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs mb-1">
                <Mic className="w-4 h-4 text-purple-500" />
                <span>Spoken Time</span>
              </div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">
                {minutesSpoken} <span className="text-xs font-normal text-slate-400">min</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs mb-1">
                <MessageSquare className="w-4 h-4 text-brand-500" />
                <span>Messages Sent</span>
              </div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">
                {stats?.total_messages || 0}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Corrections Fixed</span>
              </div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">
                {stats?.total_corrections || 0}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs mb-1">
                <BookOpen className="w-4 h-4 text-cyan-500" />
                <span>Saved Vocab</span>
              </div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">
                {stats?.saved_vocabulary_count || 0}
              </div>
            </div>
          </div>

          {/* Current Proficiency Assessment */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Proficiency Level
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-50 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300">
                {currentLevelInfo.badge}
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {currentLevelInfo.summary}
            </p>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-brand-700 dark:text-brand-400">
              <strong>Recommended Practice: </strong>
              {currentLevelInfo.nextStep}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
