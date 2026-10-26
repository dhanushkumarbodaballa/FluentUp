import React, { useState } from 'react';
import {
  MessageSquarePlus,
  Search,
  BookOpen,
  CheckCircle2,
  TrendingUp,
  Settings,
  Wrench,
  Trash2,
  Edit2,
  Check,
  X,
  Sparkles,
  Moon,
  Sun,
  Flame,
  User,
  LogIn,
  LogOut,
  Theater
} from 'lucide-react';
import { Conversation, LearningStats, UserSettings, AuthUser } from '../types';

interface SidebarProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onOpenVocabulary: () => void;
  onOpenCorrections: () => void;
  onOpenProgress: () => void;
  onOpenRoleplay: () => void;
  onOpenSettings: () => void;
  onOpenTools: () => void;
  stats: LearningStats | null;
  settings: UserSettings | null;
  user: AuthUser | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onRenameConversation,
  onOpenVocabulary,
  onOpenCorrections,
  onOpenProgress,
  onOpenRoleplay,
  onOpenSettings,
  onOpenTools,
  stats,
  settings,
  user,
  onOpenAuth,
  onLogout,
  isDarkMode,
  onToggleDarkMode,
  isMobileOpen,
  onCloseMobile,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startEditing = (e: React.MouseEvent, c: Conversation) => {
    e.stopPropagation();
    setEditingId(c.id);
    setEditTitle(c.title);
  };

  const saveEdit = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const cancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Delete this conversation?')) {
      onDeleteConversation(id);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 flex flex-col w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-transform duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top Header & Logo */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-brand-500/25">
              <Sparkles className="w-5 h-5 animate-pulse-subtle" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">FluentUp</span>
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-brand-100 dark:bg-brand-950/70 text-brand-700 dark:text-brand-300 font-semibold uppercase tracking-wider">AI</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Personal English Tutor</p>
            </div>
          </div>

          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action: New Chat */}
        <div className="p-3">
          <button
            onClick={() => {
              onNewChat();
              onCloseMobile();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-brand-600 hover:bg-brand-700 active:scale-[0.98] text-white rounded-xl font-medium shadow-sm shadow-brand-600/30 transition-all duration-150"
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Search Conversations */}
        <div className="px-3 pb-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-100 dark:bg-slate-800/80 text-xs rounded-lg text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors"
            />
          </div>
        </div>

        {/* Navigation Quick Links */}
        <div className="px-3 py-1.5 space-y-0.5 border-b border-slate-100 dark:border-slate-800/80">
          <button
            onClick={onOpenProgress}
            className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              <span>Learning Progress</span>
            </div>
            {stats && (
              <span className="flex items-center gap-0.5 text-[10px] text-amber-600 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded-full">
                <Flame className="w-3 h-3 fill-current text-amber-500" />
                {stats.streak_days}d
              </span>
            )}
          </button>

          <button
            onClick={onOpenVocabulary}
            className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5 text-brand-500" />
              <span>My Vocabulary</span>
            </div>
            {stats && (
              <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full">
                {stats.saved_vocabulary_count}
              </span>
            )}
          </button>

          <button
            onClick={onOpenCorrections}
            className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
              <span>Saved Corrections</span>
            </div>
            {stats && (
              <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full">
                {stats.saved_corrections_count}
              </span>
            )}
          </button>

          <button
            onClick={onOpenRoleplay}
            className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-50/70 dark:bg-purple-950/30 hover:bg-purple-100 dark:hover:bg-purple-900/40 rounded-lg transition-colors border border-purple-200/50 dark:border-purple-800/40"
          >
            <div className="flex items-center gap-2">
              <Theater className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>Roleplay Rooms</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 bg-white dark:bg-slate-900 px-1.5 py-0.2 rounded-md shadow-2xs">
              New
            </span>
          </button>

          <button
            onClick={onOpenTools}
            className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-2">
              <Wrench className="w-3.5 h-3.5 text-cyan-500" />
              <span>AI English Tools</span>
            </div>
          </button>
        </div>

        {/* Recent Conversations List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 px-2 py-1 uppercase tracking-wider">
            Recent Conversations
          </div>

          {filteredConversations.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-slate-400">
              No conversations found
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isActive = conv.id === currentConversationId;
              const isEditing = conv.id === editingId;

              return (
                <div
                  key={conv.id}
                  onClick={() => {
                    onSelectConversation(conv.id);
                    onCloseMobile();
                  }}
                  className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-all ${
                    isActive
                      ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-medium'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  {isEditing ? (
                    <div className="flex items-center gap-1 w-full" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="flex-1 px-1.5 py-0.5 text-xs bg-white dark:bg-slate-800 border border-brand-400 rounded focus:outline-none"
                        autoFocus
                      />
                      <button
                        onClick={(e) => saveEdit(e, conv.id)}
                        className="p-1 text-emerald-600 hover:text-emerald-700"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={cancelEdit} className="p-1 text-rose-500 hover:text-rose-600">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 truncate pr-2">
                        <div className="truncate font-medium">{conv.title}</div>
                        {conv.last_message && (
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                            {conv.last_message}
                          </div>
                        )}
                      </div>

                      {/* Hover action buttons */}
                      <div className="hidden group-hover:flex items-center gap-1">
                        <button
                          onClick={(e) => startEditing(e, conv)}
                          title="Rename"
                          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, conv.id)}
                          title="Delete"
                          className="p-1 text-slate-400 hover:text-rose-500"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer: Settings, Dark Mode, User Profile */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <button
              onClick={onOpenSettings}
              className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Settings</span>
            </button>

            <button
              onClick={onToggleDarkMode}
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

          {/* User Profile Card */}
          {user ? (
            <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-xs">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {user.name}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <span className="capitalize">{user.english_level || settings?.english_level || 'Beginner'}</span>
                  <span>•</span>
                  <span className="text-brand-600 dark:text-brand-400 font-medium truncate">
                    {user.email}
                  </span>
                </div>
              </div>
              <button
                onClick={onLogout}
                title="Log Out"
                className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-gradient-to-r from-brand-50 to-indigo-50/70 dark:from-brand-950/40 dark:to-indigo-950/30 border border-brand-200/70 dark:border-brand-900/50 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-[11px] font-bold">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">Guest Learner</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Save progress & vocabulary</div>
                </div>
              </div>
              <button
                onClick={onOpenAuth}
                className="w-full py-1.5 px-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-medium transition-all shadow-xs flex items-center justify-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Log In / Sign Up</span>
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
