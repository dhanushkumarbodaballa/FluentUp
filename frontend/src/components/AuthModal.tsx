import React, { useState } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  Sparkles,
  Eye,
  EyeOff,
  Languages,
  CheckCircle2,
  ArrowRight,
  Zap,
  GraduationCap
} from 'lucide-react';
import { AuthUser } from '../types';
import { loginUser, registerUser } from '../services/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: AuthUser) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [englishLevel, setEnglishLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [preferredLanguage, setPreferredLanguage] = useState<'en_te' | 'en_only'>('en_te');

  if (!isOpen) return null;

  const resetForm = () => {
    setError(null);
    setEmail('');
    setPassword('');
    setName('');
  };

  const handleTabSwitch = (newTab: 'signin' | 'signup') => {
    setTab(newTab);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (tab === 'signin') {
        if (!email.trim() || !password) {
          throw new Error('Please fill in both email and password');
        }
        const res = await loginUser(email.trim(), password);
        onLoginSuccess(res.user);
        onClose();
      } else {
        if (!name.trim() || !email.trim() || !password) {
          throw new Error('Please fill in all required fields');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }
        const res = await registerUser({
          name: name.trim(),
          email: email.trim(),
          password,
          english_level: englishLevel,
          preferred_language: preferredLanguage,
        });
        onLoginSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const res = await loginUser('dhanush@fluentup.ai', 'password123');
      onLoginSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Glow backdrop decorative effect */}
        <div className="absolute -top-24 -left-24 w-60 h-60 bg-brand-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="pt-7 px-6 pb-4 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white shadow-lg shadow-brand-500/25 mb-3">
            <Sparkles className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            {tab === 'signin' ? 'Welcome back to FluentUp!' : 'Start your English Journey'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
            {tab === 'signin'
              ? 'Log in to sync your conversation history, vocabulary bank, and streak.'
              : 'Create your free account to practice speaking with Maya, your personal AI tutor.'}
          </p>
          <div className="mt-2 text-[11px] font-medium text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/50 py-1 px-3 rounded-full inline-block border border-brand-200 dark:border-brand-900/60">
            🇮🇳 తెలుగు వివరణలతో సులభంగా మాట్లాడండి!
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="px-6">
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
            <button
              type="button"
              onClick={() => handleTabSwitch('signin')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                tab === 'signin'
                  ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Sign In (లాగిన్)
            </button>
            <button
              type="button"
              onClick={() => handleTabSwitch('signup')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                tab === 'signup'
                  ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Create Account (ఖాతా తెరవండి)
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-3.5 max-h-[60vh] overflow-y-auto">
          {error && (
            <div className="p-3 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl">
              {error}
            </div>
          )}

          {tab === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dhanush Kumar"
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 dark:focus:ring-brand-400 text-slate-900 dark:text-white placeholder-slate-400"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 dark:focus:ring-brand-400 text-slate-900 dark:text-white placeholder-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 dark:focus:ring-brand-400 text-slate-900 dark:text-white placeholder-slate-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {tab === 'signup' && (
            <>
              {/* English Level Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Current English Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: 'beginner', label: 'Beginner', desc: 'Basic words & Telugu tips' },
                      { id: 'intermediate', label: 'Intermediate', desc: 'Daily speaking & fluency' },
                      { id: 'advanced', label: 'Advanced', desc: 'Interviews & professional' },
                    ] as const
                  ).map((lvl) => (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => setEnglishLevel(lvl.id)}
                      className={`p-2 rounded-xl text-left border transition-all ${
                        englishLevel === lvl.id
                          ? 'border-brand-500 bg-brand-50/70 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300 ring-1 ring-brand-500'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-[11px] font-bold">{lvl.label}</div>
                      <div className="text-[9px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                        {lvl.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Language Preference */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tutor Teaching Language
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPreferredLanguage('en_te')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      preferredLanguage === 'en_te'
                        ? 'border-brand-500 bg-brand-50/70 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300 ring-1 ring-brand-500'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold">
                      <Languages className="w-3.5 h-3.5 text-brand-600" />
                      <span>Telugu + English</span>
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Recommended for clear grammar rules
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreferredLanguage('en_only')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      preferredLanguage === 'en_only'
                        ? 'border-brand-500 bg-brand-50/70 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300 ring-1 ring-brand-500'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold">
                      <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                      <span>English Only</span>
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Full immersion English experience
                    </div>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white font-semibold text-xs shadow-md shadow-brand-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>{tab === 'signin' ? 'Sign In to FluentUp' : 'Create My Account'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>

          {/* 1-Click Quick Demo Login Button */}
          {tab === 'signin' && (
            <div className="pt-2">
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
                <span className="flex-shrink mx-3 text-[10px] text-slate-400 uppercase tracking-wider">
                  Quick Access
                </span>
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
              </div>

              <button
                type="button"
                onClick={handleQuickDemo}
                disabled={isLoading}
                className="w-full mt-2 py-2 px-3 rounded-xl border border-dashed border-brand-300 dark:border-brand-800 hover:border-brand-500 bg-brand-50/40 dark:bg-brand-950/20 text-brand-700 dark:text-brand-300 text-xs font-medium transition-all flex items-center justify-center gap-2 group"
              >
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500 group-hover:scale-110 transition-transform" />
                <span>1-Click Demo Login (Dhanush Kumar)</span>
              </button>
            </div>
          )}

          {/* Continue as Guest option */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-medium transition-colors"
            >
              Continue exploring as Guest →
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
