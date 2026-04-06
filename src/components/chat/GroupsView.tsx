'use client'

import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  MoreHorizontal, 
  Globe, 
  Lock, 
  ArrowRight,
  Sparkles,
  MessageSquare
} from 'lucide-react';
import { useChatStore } from '@/store/chatStore';
import { getAvatarUrl } from '@/lib/utils';

export const GroupsView = () => {
  const { chats, setActiveChat, setActiveView, setNewGroupModalOpen } = useChatStore();
  const [search, setSearch] = useState('');

  const groups = chats.filter(chat => chat.type === 'group');

  return (
    <div className="flex-1 h-full bg-bg-base flex flex-col transition-colors duration-300 overflow-hidden">
      {/* Header */}
      <div className="px-10 py-12 flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-text-main mb-2">Explore Groups</h1>
            <p className="text-text-muted font-medium">Join communities and collaborate with your team</p>
          </div>
          <button 
            onClick={() => setNewGroupModalOpen(true)}
            className="flex items-center gap-3 px-6 py-3 bg-mint-500 text-white rounded-2xl font-bold shadow-lg shadow-mint-500/20 hover:bg-mint-600 hover:scale-105 transition-all"
          >
            <Plus size={20} />
            Create New Group
          </button>
        </div>

        {/* Filters/Search */}
        <div className="flex gap-4 items-center">
          <div className="flex-1 relative group">
            <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-mint-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search groups by name or topic..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-surface-lowest border border-outline-variant rounded-2xl text-text-main shadow-sm focus:ring-2 focus:ring-mint-500/20 transition-all outline-none"
            />
          </div>
          <div className="flex bg-surface-lowest p-1.5 rounded-2xl border border-outline-variant shadow-sm">
            <button className="px-6 py-2.5 text-xs font-bold rounded-xl bg-mint-500 text-white shadow-md">All</button>
            <button className="px-6 py-2.5 text-xs font-bold rounded-xl text-text-muted hover:text-text-main transition-all">Public</button>
            <button className="px-6 py-2.5 text-xs font-bold rounded-xl text-text-muted hover:text-text-main transition-all">Private</button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-10 pb-12 no-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Featured/Create Card */}
          <div 
            onClick={() => setNewGroupModalOpen(true)}
            className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-[2.5rem] p-8 text-white relative overflow-hidden group cursor-pointer shadow-xl flex flex-col justify-between min-h-[280px]"
          >
            <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
            <div>
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md">
                <Sparkles size={28} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Build a Space</h3>
              <p className="text-white/70 text-sm font-medium leading-relaxed">Create a sanctuary for your project team or a hub for your community interests.</p>
            </div>
            <button className="flex items-center gap-2 text-sm font-bold bg-white text-indigo-600 px-5 py-2.5 rounded-xl self-start hover:shadow-lg transition-all group-hover:translate-x-1">
              Start Now <ArrowRight size={16} />
            </button>
          </div>

          {/* Group Cards */}
          {groups.map((group: any) => (
            <div 
              key={group.id}
              onClick={() => {
                setActiveChat(group);
                setActiveView('chat');
              }}
              className="bg-surface-lowest border border-outline-variant rounded-[2.5rem] p-8 hover:shadow-2xl hover:shadow-mint-500/5 transition-all group cursor-pointer flex flex-col gap-6"
            >
              <div className="flex justify-between items-start">
                <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg border border-outline-variant">
                  <img src={getAvatarUrl(group)} alt={group.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex gap-2">
                   <div className="px-3 py-1 bg-surface-low rounded-lg text-[10px] font-bold text-text-muted flex items-center gap-1">
                     {group.is_private ? <Lock size={10} /> : <Globe size={10} />}
                     {group.is_private ? 'Private' : 'Public'}
                   </div>
                   <button className="text-text-muted hover:text-text-main transition-colors">
                     <MoreHorizontal size={20} />
                   </button>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-text-main group-hover:text-mint-500 transition-colors mb-2 truncate">
                  {group.name || 'Unnamed Group'}
                </h3>
                <p className="text-text-muted text-[13px] line-clamp-2 leading-relaxed">
                  {group.description || 'Dedicated workspace for collaboration and real-time communication.'}
                </p>
              </div>

              <div className="mt-auto pt-6 border-t border-outline-variant flex justify-between items-center">
                <div className="flex -space-x-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-9 h-9 rounded-full border-[3px] border-surface-lowest overflow-hidden shadow-sm">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${group.id}-${i}`} alt="" />
                    </div>
                  ))}
                  <div className="w-9 h-9 rounded-full border-[3px] border-surface-lowest bg-surface-low flex items-center justify-center text-[10px] font-bold text-text-muted shadow-sm">
                    +12
                  </div>
                </div>
                <button className="flex items-center gap-2 text-xs font-bold text-mint-500 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                  Join Chat <MessageSquare size={14} />
                </button>
              </div>
            </div>
          ))}

          {/* Empty State / Suggestions */}
          {groups.length === 0 && (
            <div className="col-span-1 lg:col-span-2 h-full flex flex-col items-center justify-center py-20 bg-surface-low/30 rounded-[2.5rem] border border-dashed border-outline-variant">
              <Users size={64} className="text-text-muted mb-6 opacity-20" />
              <h3 className="text-xl font-bold text-text-main mb-2">No groups yet</h3>
              <p className="text-text-muted text-sm max-w-[300px] text-center mb-8">You haven't joined any groups yet. Start by creating one for your team.</p>
              <button className="px-8 py-3 bg-surface-lowest border border-outline-variant rounded-2xl text-text-main font-bold shadow-sm hover:bg-surface-low transition-all">
                Browse Directory
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
