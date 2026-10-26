import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Trash2,
  X,
  Search,
  Sparkles,
  Volume2,
  CheckCircle2,
  RotateCw,
  Layers,
  ChevronLeft,
  ChevronRight,
  Award
} from 'lucide-react';
import { VocabularyWord } from '../types';
import { saveVocabulary, deleteVocabulary, toggleMasterVocabulary } from '../services/api';

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
  const [viewMode, setViewMode] = useState<'list' | 'flashcard'>('list');
  const [search, setSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newWord, setNewWord] = useState('');
  const [newDef, setNewDef] = useState('');
  const [newTe, setNewTe] = useState('');
  const [newEx, setNewEx] = useState('');

  // Flashcard states
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  if (!isOpen) return null;

  const filteredWords = words.filter(
    (w) =>
      w.word.toLowerCase().includes(search.toLowerCase()) ||
      w.definition.toLowerCase().includes(search.toLowerCase()) ||
      (w.telugu_meaning && w.telugu_meaning.toLowerCase().includes(search.toLowerCase())) ||
      (w.hindi_meaning && w.hindi_meaning.toLowerCase().includes(search.toLowerCase()))
  );

  const masteredCount = words.filter(w => w.mastered === 1).length;
  const currentCard = filteredWords[cardIndex] || filteredWords[0];

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

  const handleToggleMaster = async (id: string) => {
    try {
      await toggleMasterVocabulary(id);
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextCard = () => {
    setIsFlipped(false);
    setCardIndex((prev) => (prev + 1) % filteredWords.length);
  };

  const handlePrevCard = () => {
    setIsFlipped(false);
    setCardIndex((prev) => (prev - 1 + filteredWords.length) % filteredWords.length);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="w-full max-w-xl max-h-[88vh] rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-100 dark:bg-brand-950/70 flex items-center justify-center text-brand-600 dark:text-brand-300 shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Vocabulary Bank</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                  <Award className="w-3 h-3" />
                  {masteredCount} Mastered
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {words.length} {words.length === 1 ? 'word' : 'words'} saved for practice
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs">
              <button
                onClick={() => setViewMode('list')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                List
              </button>
              <button
                onClick={() => setViewMode('flashcard')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  viewMode === 'flashcard'
                    ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <Layers className="w-3 h-3" />
                <span>Flashcards</span>
              </button>
            </div>

            <button
              onClick={() => setIsAdding((prev) => !prev)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add</span>
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Add Word Form */}
        {isAdding && (
          <form onSubmit={handleAdd} className="p-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 space-y-2.5 animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Word (e.g. Delicious / Oishii)"
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                required
                className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              <input
                type="text"
                placeholder="Meaning (e.g. स्वादिष्ट / రుచికరమైన)"
                value={newTe}
                onChange={(e) => setNewTe(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <input
              type="text"
              placeholder="Definition (e.g. Highly pleasant to the taste)"
              value={newDef}
              onChange={(e) => setNewDef(e.target.value)}
              required
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <input
              type="text"
              placeholder="Example Sentence (e.g. This food is very delicious!)"
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
                className="px-4 py-1 text-xs font-semibold rounded-xl bg-brand-600 text-white"
              >
                Save Word
              </button>
            </div>
          </form>
        )}

        {/* --- FLASHCARD MODE --- */}
        {viewMode === 'flashcard' ? (
          <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
            {filteredWords.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No words available for flashcard review. Save or add words first!
              </div>
            ) : (
              <div className="w-full max-w-md flex flex-col items-center space-y-4">
                {/* Progress pill */}
                <div className="flex items-center justify-between w-full text-xs font-semibold text-slate-500 dark:text-slate-400 px-2">
                  <span>Card {cardIndex + 1} of {filteredWords.length}</span>
                  <span className="flex items-center gap-1 text-amber-500">
                    <Sparkles className="w-3.5 h-3.5" />
                    +15 XP per card
                  </span>
                </div>

                {/* Flippable 3D Card */}
                <div
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="w-full min-h-[220px] p-6 rounded-3xl bg-gradient-to-br from-white via-slate-50 to-brand-50/40 dark:from-slate-800 dark:via-slate-850 dark:to-brand-950/30 border-2 border-brand-200 dark:border-brand-900 shadow-xl flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:scale-[1.02] relative group select-none"
                >
                  <div className="absolute top-3.5 right-3.5 flex items-center gap-1 text-[11px] font-semibold text-slate-400 group-hover:text-brand-600 transition-colors">
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Flip</span>
                  </div>

                  {!isFlipped ? (
                    /* Front side */
                    <div className="space-y-3">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 bg-brand-100 dark:bg-brand-950 px-2.5 py-0.5 rounded-full">
                        Word
                      </span>
                      <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white capitalize">
                        {currentCard.word}
                      </h3>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSpeak(currentCard.word);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium hover:bg-brand-100 hover:text-brand-600 transition-colors"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Listen Audio</span>
                      </button>
                      <p className="text-xs text-slate-400 dark:text-slate-500 pt-2">
                        Tap card to reveal definition & meaning
                      </p>
                    </div>
                  ) : (
                    /* Back side */
                    <div className="space-y-2.5 animate-fadeIn">
                      {(currentCard.hindi_meaning || currentCard.telugu_meaning) && (
                        <div className="text-sm font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950 px-3 py-1 rounded-xl inline-block">
                          {currentCard.hindi_meaning || currentCard.telugu_meaning}
                        </div>
                      )}
                      <p className="text-sm text-slate-800 dark:text-slate-200 font-medium">
                        {currentCard.definition}
                      </p>
                      {currentCard.example_sentence && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 italic bg-white/60 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                          "{currentCard.example_sentence}"
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Controls */}
                <div className="flex items-center justify-between w-full pt-2">
                  <button
                    onClick={handlePrevCard}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-1 text-xs font-semibold"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Prev</span>
                  </button>

                  <button
                    onClick={() => handleToggleMaster(currentCard.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      currentCard.mastered === 1
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{currentCard.mastered === 1 ? 'Mastered!' : 'Mark as Mastered'}</span>
                  </button>

                  <button
                    onClick={handleNextCard}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-1 text-xs font-semibold"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* --- LIST VIEW MODE --- */
          <>
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
                    className={`p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                      item.mastered === 1
                        ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-brand-300 dark:hover:border-brand-900'
                    }`}
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
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
                        {(item.hindi_meaning || item.telugu_meaning) && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-medium">
                            {item.hindi_meaning || item.telugu_meaning}
                          </span>
                        )}
                        {item.mastered === 1 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5" /> Mastered
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

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleToggleMaster(item.id)}
                        title={item.mastered === 1 ? 'Mark as unmastered' : 'Mark as mastered'}
                        className={`p-1.5 rounded-lg transition-colors ${
                          item.mastered === 1
                            ? 'text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-950'
                            : 'text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        title="Delete word"
                        className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
