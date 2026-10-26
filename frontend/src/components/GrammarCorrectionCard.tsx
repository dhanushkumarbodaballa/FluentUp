import React, { useState } from 'react';
import {
  CheckCircle2,
  Bookmark,
  BookmarkCheck,
  ArrowRight,
  Lightbulb,
  Languages,
  Sparkles,
  Volume2,
  Copy,
  Check,
  CheckCheck
} from 'lucide-react';
import { GrammarCorrection } from '../types';
import { saveCorrection } from '../services/api';

interface GrammarCorrectionCardProps {
  correction: GrammarCorrection;
  onSaved?: () => void;
  onSpeakImproved?: (text: string) => void;
  onPracticeSentence?: (text: string) => void;
}

export const GrammarCorrectionCard: React.FC<GrammarCorrectionCardProps> = ({
  correction,
  onSaved,
  onSpeakImproved,
  onPracticeSentence,
}) => {
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedImproved, setCopiedImproved] = useState(false);
  const [copiedPractice, setCopiedPractice] = useState(false);

  // Strict validation: never render card if original or improved is empty/null/identical
  if (!correction || !correction.original || !correction.improved) {
    return null;
  }

  const orig = correction.original.trim();
  const imp = correction.improved.trim();

  if (!orig || !imp || orig.toLowerCase() === imp.toLowerCase() || orig.toLowerCase() === 'null') {
    return null;
  }

  const handleSave = async () => {
    if (isSaved || isSaving) return;
    try {
      setIsSaving(true);
      await saveCorrection({
        original_sentence: orig,
        improved_sentence: imp,
        explanation_en: correction.explanation_en || 'Natural phrasing improvement',
        explanation_te: correction.explanation_te || '',
        practice_sentence: correction.practice || '',
      });
      setIsSaved(true);
      if (onSaved) onSaved();
    } catch (e) {
      console.error('Failed to save correction:', e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyImproved = () => {
    navigator.clipboard.writeText(imp);
    setCopiedImproved(true);
    setTimeout(() => setCopiedImproved(false), 2000);
  };

  const handleCopyPractice = (practiceText: string) => {
    navigator.clipboard.writeText(practiceText);
    setCopiedPractice(true);
    setTimeout(() => setCopiedPractice(false), 2000);
    if (onPracticeSentence) {
      onPracticeSentence(practiceText);
    }
  };

  const handleSpeak = () => {
    if (onSpeakImproved) {
      onSpeakImproved(imp);
    } else if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(imp);
      u.rate = 0.9;
      window.speechSynthesis.speak(u);
    }
  };

  return (
    <div className="mt-3.5 rounded-2xl border border-indigo-200/90 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/25 dark:from-slate-900/95 dark:via-slate-900/80 dark:to-indigo-950/30 p-4 shadow-sm text-left animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-indigo-100/70 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <span>Gentle English Correction & Insight</span>
            </div>
            <div className="text-[10px] text-brand-600 dark:text-brand-400 font-medium">
              Spoken Fluency Tip
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaved || isSaving}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer ${
            isSaved
              ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-brand-500 hover:text-brand-600'
          }`}
        >
          {isSaved ? (
            <>
              <BookmarkCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Saved to Review</span>
            </>
          ) : (
            <>
              <Bookmark className="w-3.5 h-3.5 text-slate-400" />
              <span>{isSaving ? 'Saving...' : 'Save to Review'}</span>
            </>
          )}
        </button>
      </div>

      {/* Before / Better Comparison Box */}
      <div className="space-y-2 mb-3.5">
        {/* Original (Before) */}
        <div className="p-2.5 rounded-xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40 flex items-start gap-2.5">
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-200/80 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 uppercase shrink-0 mt-0.5 tracking-wider">
            Before
          </span>
          <span className="text-xs text-rose-900/80 dark:text-rose-300/90 font-medium line-through">
            "{orig}"
          </span>
        </div>

        {/* Improved (Better) */}
        <div className="p-3 rounded-xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200/90 dark:border-emerald-800/60 flex flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2.5">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-200 dark:bg-emerald-900/80 text-emerald-900 dark:text-emerald-100 uppercase shrink-0 mt-0.5 tracking-wider">
                Better
              </span>
              <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 leading-relaxed">
                "{imp}"
              </span>
            </div>

            {/* Quick action buttons on improved sentence */}
            <div className="flex items-center gap-1 shrink-0 ml-1">
              {/* Listen to pronunciation */}
              <button
                type="button"
                onClick={handleSpeak}
                title="Listen to native pronunciation"
                className="p-1.5 rounded-lg text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200/60 dark:hover:bg-emerald-900/60 transition-colors"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>

              {/* Copy sentence */}
              <button
                type="button"
                onClick={handleCopyImproved}
                title="Copy natural sentence"
                className="p-1.5 rounded-lg text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200/60 dark:hover:bg-emerald-900/60 transition-colors"
              >
                {copiedImproved ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Explanations & Telugu Insights */}
      <div className="space-y-2 text-xs">
        {/* English Why Rule */}
        {correction.explanation_en && (
          <div className="flex items-start gap-2.5 bg-white/80 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
            <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0 leading-relaxed">
              <span className="font-bold text-slate-900 dark:text-white mr-1">Rule Insight:</span>
              <span className="text-slate-700 dark:text-slate-300">{correction.explanation_en}</span>
            </div>
          </div>
        )}

        {/* Telugu Tip */}
        {correction.explanation_te && (
          <div className="flex items-start gap-2.5 bg-brand-50/70 dark:bg-brand-950/30 p-2.5 rounded-xl border border-brand-200/70 dark:border-brand-900/50">
            <Languages className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0 leading-relaxed">
              <span className="font-bold text-brand-800 dark:text-brand-300 mr-1.5">
                🇮🇳 తెలుగు వివరణ:
              </span>
              <span className="text-slate-800 dark:text-slate-200 font-medium">
                {correction.explanation_te}
              </span>
            </div>
          </div>
        )}

        {/* Practice sentence with interactive copy/repeat button */}
        {correction.practice && (
          <div className="flex items-center justify-between gap-2 bg-emerald-50/60 dark:bg-emerald-950/20 p-2.5 rounded-xl border border-emerald-200/50 dark:border-emerald-900/30">
            <div className="flex items-start gap-2.5 min-w-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-bold text-emerald-800 dark:text-emerald-300 mr-1">Practice:</span>
                <span className="text-slate-800 dark:text-slate-200 font-medium italic">
                  "{correction.practice}"
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleCopyPractice(correction.practice || '')}
              className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 shrink-0 transition-all flex items-center gap-1 cursor-pointer"
            >
              {copiedPractice ? (
                <>
                  <CheckCheck className="w-3 h-3 text-emerald-600" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Try this</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
