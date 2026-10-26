import React, { useState } from 'react';
import { CheckCircle2, Trash2, X, Search, Lightbulb, Languages, Check, Sparkles } from 'lucide-react';
import { SavedCorrection } from '../types';
import { deleteSavedCorrection } from '../services/api';

interface SavedCorrectionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  corrections: SavedCorrection[];
  onRefresh: () => void;
}

export const SavedCorrectionsModal: React.FC<SavedCorrectionsModalProps> = ({
  isOpen,
  onClose,
  corrections,
  onRefresh,
}) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filtered = corrections.filter(
    (c) =>
      c.original_sentence.toLowerCase().includes(search.toLowerCase()) ||
      c.improved_sentence.toLowerCase().includes(search.toLowerCase()) ||
      c.explanation_en.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (confirm('Delete this saved correction?')) {
      try {
        await deleteSavedCorrection(id);
        onRefresh();
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="w-full max-w-xl max-h-[85vh] rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/70 flex items-center justify-center text-brand-600 dark:text-brand-300">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Saved Corrections</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Review your common mistakes to build lasting fluency
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-800">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search your saved corrections..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-500 text-slate-800 dark:text-slate-200"
            />
          </div>
        </div>

        {/* Corrections List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              {corrections.length === 0
                ? "No corrections saved yet. Click 'Save to Review' on any correction in chat!"
                : 'No matching corrections found.'}
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-brand-300 dark:hover:border-brand-900 transition-colors space-y-2.5 relative group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-start gap-2 text-xs">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 uppercase shrink-0">
                        Mistake
                      </span>
                      <span className="text-slate-500 line-through">"{item.original_sentence}"</span>
                    </div>

                    <div className="flex items-start gap-2 text-xs">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 uppercase shrink-0">
                        Correct
                      </span>
                      <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                        "{item.improved_sentence}"
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(item.id)}
                    title="Delete saved correction"
                    className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {item.explanation_en && (
                  <div className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-slate-800/80 p-2 rounded-xl">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <span>{item.explanation_en}</span>
                  </div>
                )}

                {(item.explanation_hi || item.explanation_te || item.explanation_native) && (() => {
                  const native = item.explanation_hi || item.explanation_native || item.explanation_te || '';
                  if (!native.trim()) return null;
                  const isHindi = Boolean(
                    item.explanation_hi ||
                    (/[\u0900-\u097F]/.test(native)) ||
                    (/\b(hai|hain|karein|kijiye|hoga|raha|rahe|hoti|seekhein|baat|samjhein)\b/i.test(native))
                  );
                  return (
                    <div className="flex items-start gap-2 text-xs text-brand-800 dark:text-brand-300 bg-brand-50/60 dark:bg-brand-950/30 p-2 rounded-xl border border-brand-100/50 dark:border-brand-900/30">
                      <Languages className="w-3.5 h-3.5 text-brand-600 shrink-0 mt-0.5" />
                      <span><strong>{isHindi ? 'Hindi Tip:' : 'Telugu Tip:'}</strong> {native}</span>
                    </div>
                  );
                })()}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
