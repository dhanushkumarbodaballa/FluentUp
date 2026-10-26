import React, { useState, useEffect } from 'react';
import { Settings, X, Globe, Gauge, Volume2, ShieldCheck, Check, Sparkles, Key } from 'lucide-react';
import { UserSettings } from '../types';
import { updateSettings, fetchStatus } from '../services/api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings | null;
  onUpdate: (newSettings: UserSettings) => void;
  voices: SpeechSynthesisVoice[];
  femaleVoice: SpeechSynthesisVoice | null;
  onSelectVoice: (voice: SpeechSynthesisVoice) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdate,
  voices,
  femaleVoice,
  onSelectVoice,
}) => {
  const [prefLang, setPrefLang] = useState<'en_te' | 'en_hi' | 'en_only'>(settings?.preferred_language || 'en_te');
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>(settings?.english_level || 'beginner');
  const [learningTarget, setLearningTarget] = useState<'english' | 'hindi' | 'japanese'>(settings?.learning_target || 'english');
  const [speed, setSpeed] = useState<number>(settings?.voice_speed || 1.0);
  const [autoSpeak, setAutoSpeak] = useState<boolean>(settings?.auto_speak === 1);
  const [isSaving, setIsSaving] = useState(false);
  const [statusInfo, setStatusInfo] = useState<{ active_mode: string; is_demo_mode: boolean; setup_instruction: string } | null>(null);

  useEffect(() => {
    if (settings) {
      setPrefLang(settings.preferred_language);
      setLevel(settings.english_level);
      setLearningTarget(settings.learning_target || 'english');
      setSpeed(settings.voice_speed);
      setAutoSpeak(settings.auto_speak === 1);
    }
  }, [settings]);

  useEffect(() => {
    if (isOpen) {
      fetchStatus().then(setStatusInfo).catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = await updateSettings({
        preferred_language: prefLang,
        english_level: level,
        learning_target: learningTarget,
        voice_speed: speed,
        auto_speak: autoSpeak ? 1 : 0,
      });
      onUpdate(updated);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="w-full max-w-lg max-h-[85vh] rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-100 dark:bg-brand-950/70 flex items-center justify-center text-brand-600 dark:text-brand-300">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Settings & Preferences</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Personalize your learning tutor</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          {/* Primary Learning Target / Tutor Mode */}
          <div className="space-y-2">
            <label className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-brand-500" />
              <span>Learning Goal / Tutor Mode</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setLearningTarget('english')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  learningTarget === 'english'
                    ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/40 text-brand-900 dark:text-brand-200 font-medium ring-1 ring-brand-500'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="font-bold flex items-center gap-1.5 text-slate-900 dark:text-white">
                  <span>🎓 Learn English</span>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  English speaking coach with grammar tips.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setLearningTarget('hindi')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  learningTarget === 'hindi'
                    ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-medium ring-1 ring-amber-500'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="font-bold flex items-center gap-1.5 text-slate-900 dark:text-white">
                  <span>🇮🇳 Learn Hindi</span>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Hindi tutor with Devanagari, Romaji & sentences.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setLearningTarget('japanese')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  learningTarget === 'japanese'
                    ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 font-medium ring-1 ring-rose-500'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="font-bold flex items-center gap-1.5 text-slate-900 dark:text-white">
                  <span>🇯🇵 Learn Japanese</span>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Japanese tutor with Kanji/Kana, Romaji & daily dialogues.
                </div>
              </button>
            </div>
          </div>

          {/* Explanation Language */}
          <div className="space-y-2">
            <label className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-brand-500" />
              <span>Explanation Language</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPrefLang('en_te')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  prefLang === 'en_te'
                    ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/40 text-brand-900 dark:text-brand-200 font-medium ring-1 ring-brand-500'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="font-bold flex items-center gap-1.5">
                  <span>Telugu + English</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  తెలుగు వివరణలతో నేర్చుకోండి (Telugu transliteration & tips)
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPrefLang('en_hi')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  prefLang === 'en_hi'
                    ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/40 text-brand-900 dark:text-brand-200 font-medium ring-1 ring-brand-500'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="font-bold flex items-center gap-1.5">
                  <span>Hindi + English</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  हिंदी में समझें (Hindi & Hinglish explanations & examples)
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPrefLang('en_only')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  prefLang === 'en_only'
                    ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/40 text-brand-900 dark:text-brand-200 font-medium ring-1 ring-brand-500'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="font-bold flex items-center gap-1.5">
                  <span>English Only</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  100% full English immersion without regional translations
                </div>
              </button>
            </div>
          </div>

          {/* English Level */}
          <div className="space-y-2">
            <label className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-emerald-500" />
              <span>Current English Level</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['beginner', 'intermediate', 'advanced'] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setLevel(lvl)}
                  className={`p-2.5 rounded-xl border capitalize text-center transition-all ${
                    level === lvl
                      ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300 font-bold'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Voice Settings */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-purple-500" />
              <span>Tutor Voice & Speech Speed</span>
            </label>

            {/* Speed slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>Speed: {speed}x</span>
                <span>{speed < 1 ? 'Slower (Easy to follow)' : speed === 1 ? 'Normal' : 'Faster'}</span>
              </div>
              <input
                type="range"
                min="0.7"
                max="1.4"
                step="0.05"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="w-full accent-brand-600"
              />
            </div>

            {/* Voice dropdown */}
            {voices.length > 0 && (
              <div className="space-y-1">
                <span className="text-[11px] text-slate-500">Selected Natural Female Voice:</span>
                <select
                  value={femaleVoice?.name || ''}
                  onChange={(e) => {
                    const chosen = voices.find((v) => v.name === e.target.value);
                    if (chosen) onSelectVoice(chosen);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  {voices
                    .filter((v) => v.lang.startsWith('en'))
                    .map((v) => (
                      <option key={v.name} value={v.name}>
                        {v.name} ({v.lang})
                      </option>
                    ))}
                </select>
              </div>
            )}

            {/* Auto speak toggle */}
            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={autoSpeak}
                onChange={(e) => setAutoSpeak(e.target.checked)}
                className="rounded accent-brand-600"
              />
              <span className="text-slate-700 dark:text-slate-300">
                Automatically read tutor's responses aloud in voice mode
              </span>
            </label>
          </div>

          {/* AI Provider & Backend Credentials Status */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                <Key className="w-3.5 h-3.5 text-brand-500" />
                <span>AI Backend Connection</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  statusInfo?.is_demo_mode
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                    : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                }`}
              >
                {statusInfo?.active_mode || 'Connecting...'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              {statusInfo?.setup_instruction ||
                'To connect live OpenAI (GPT-4o) or Google Gemini, add your key to backend/.env'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2 text-xs font-semibold rounded-xl bg-brand-600 hover:bg-brand-700 text-white shadow-xs"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};
