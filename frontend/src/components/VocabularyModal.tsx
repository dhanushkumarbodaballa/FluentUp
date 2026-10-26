import React, { useState } from 'react';
import { BookOpen, Plus, Trash2, X, Search, Sparkles, Languages, Volume2 } from 'lucide-react';
import { VocabularyWord } from '../types';
import { saveVocabulary, deleteVocabulary } from '../services/api';

interface VocabularyModalProps {
  isOpen: boolean;
  onClose: () => void;
  words: VocabularyWord[];
  onRefresh: () => void;
  onSpeak: (text: string) => void;
}

export const VocabularyModal: React.FC<VocabularyModalProps> = ({
  isOpen,
  onClose,
  words,
  onRefresh,
  onSpeak,
}) => {
  const [search, setSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newWord, setNewWord] = useState('');
  const [newDef, setNewDef] = useState('');
  const [newTe, setNewTe] = useState('');
  const [newEx, setNewEx] = useState('');

  if (!isOpen) return null;

  const filteredWords = words.filter(
    (w) =>
      w.word.toLowerCase().includes(search.toLowerCase()) ||
      w.definition.toLowerCase().includes(search.toLowerCase()) ||
      (w.telugu_meaning && w.telugu_meaning.toLowerCase().includes(search.toLowerCase()))
  );

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord.trim() || !newDef.trim()) return;

    try {
      await saveVocabulary({
        word: newWord.trim(),
        definition: newDef.trim(),
        telugu_meaning: newTe.trim(),
        example_sentence: newEx.trim(),
      });
      setNewWord('');
      setNewDef('');
      setNewTe('');
      setNewEx('');
      setIsAdding(false);
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this saved word?')) {
      try {
        await deleteVocabulary(id);
        onRefresh();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="w-full max-w-xl max-h-[85vh] rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-100 dark:bg-brand-950/70 flex items-center justify-center text-brand-600 dark:text-brand-300">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">My Vocabulary Bank</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {words.length} {words.length === 1 ? 'word' : 'words'} saved for practice
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAdding((prev) => !prev)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-medium shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Word</span>
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Add Word Form */}
        {isAdding && (
          <form onSubmit={handleAdd} className="p-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Word (e.g. Hesitate)"
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                required
                className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              <input
                type="text"
                placeholder="Telugu Meaning (e.g. సంకోచించు / Sankochinchu)"
                value={newTe}
                onChange={(e) => setNewTe(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <input
              type="text"
              placeholder="Definition (e.g. Pause before saying or doing something)"
              value={newDef}
              onChange={(e) => setNewDef(e.target.value)}
              required
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <input
              type="text"
              placeholder="Example Sentence (e.g. Don't hesitate to speak in English.)"
              value={newEx}
              onChange={(e) => setNewEx(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 py-1 text-xs text-slate-500 hover:text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1 text-xs font-medium rounded-xl bg-brand-600 text-white"
              >
                Save Word
              </button>
            </div>
          </form>
        )}

        {/* Search */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-800">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search saved vocabulary..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-500 text-slate-800 dark:text-slate-200"
            />
          </div>
        </div>

        {/* Words List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filteredWords.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              {words.length === 0
                ? "You haven't saved any words yet. Save new words while chatting with Maya!"
                : "No matching words found."}
            </div>
          ) : (
            filteredWords.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-brand-300 dark:hover:border-brand-900 transition-colors flex items-start justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-white capitalize">
                      {item.word}
                    </span>
                    <button
                      onClick={() => onSpeak(item.word)}
                      title="Pronounce word"
                      className="p-1 rounded-full text-slate-400 hover:text-brand-600 dark:hover:text-brand-400"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                    {item.telugu_meaning && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-medium">
                        {item.telugu_meaning}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">{item.definition}</p>
                  {item.example_sentence && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                      "{item.example_sentence}"
                    </p>
                  )}
                </div>

                <button
                  onClick={() => handleDelete(item.id)}
                  title="Delete word"
                  className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
