'use client'

import React, { useState } from 'react';
import { Search, Plus, ChevronLeft, ChevronDown, Settings as SettingsIcon, MoreHorizontal } from 'lucide-react';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { getAvatarUrl } from '@/lib/utils';

export const CleanChatList = () => {
  const { user } = useAuthStore();
  const { 
    chats, 
    activeChat, 
    setActiveChat, 
    sidebarTab,
    setSidebarTab,
    typingUsers,
    setNewGroupModalOpen
  } = useChatStore();
  const { profile } = useAuthStore();
  const [search, setSearch] = useState('');

  const filteredChats = chats.filter((chat: any) => {
    if (!search) return true;
    const isGroup = chat.type === 'group';
    const allParticipants = chat.chat_participants || [];
    const otherParticipant = allParticipants.find((p: any) => p.user_id !== user?.id) || allParticipants[0];
    const participantProfile = otherParticipant?.profiles;
    const nameToSearch = isGroup ? (chat.name || '') : (participantProfile?.name || '');
    return nameToSearch.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="w-80 h-full bg-surface-lowest flex flex-col border-r border-outline-variant clean-sidebar-shadow z-[5] shrink-0 transition-all duration-300">
      {/* Top Navigation */}
      <div className="p-6 pb-2 flex justify-between items-center text-text-muted">
        <button className="w-8 h-8 rounded-full hover:bg-surface-low flex items-center justify-center transition-colors">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-lg font-bold text-text-main">Chat</h1>
        <button className="w-8 h-8 rounded-full hover:bg-surface-low flex items-center justify-center transition-colors">
          <SettingsIcon size={18} />
        </button>
      </div>

      {/* Profile Section */}
      <div className="px-6 py-4 flex flex-col items-center">
        <div className="relative mb-3">
          <div className="w-24 h-24 rounded-full border-4 border-surface-lowest shadow-xl overflow-hidden ring-4 ring-mint-500/10">
            <img 
              src={getAvatarUrl(profile)} 
              alt={profile?.name || 'User'} 
              className="w-full h-full object-cover"
            />
          </div>
          <div className={`absolute bottom-1 right-2 w-4 h-4 border-2 border-surface-lowest rounded-full shadow-sm ${
            profile?.status === 'online' ? 'bg-presence-online' : 'bg-presence-offline'
          }`}></div>
        </div>
        <h2 className="text-lg font-bold text-text-main mb-2">{profile?.name || 'Anonymous'}</h2>
        <button className="flex items-center gap-2 px-4 py-1.5 bg-mint-500/10 text-mint-500 rounded-xl text-xs font-bold hover:bg-mint-500/20 transition-colors">
          {profile?.status || 'available'} <ChevronDown size={14} />
        </button>
      </div>

      {/* Search */}
      <div className="px-6 py-4">
        <div className="relative group">
          <Search 
            size={18} 
            className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-mint-500 transition-colors" 
          />
          <input 
            type="text" 
            placeholder="Search" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-10 py-3 bg-surface-low rounded-2xl text-sm border-none focus:ring-2 focus:ring-mint-500/20 transition-all outline-none text-text-main font-medium"
          />
        </div>
      </div>

      <div className="px-6 py-2 flex justify-between items-center">
        <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Last chats</span>
        <div className="flex gap-2">
           <button 
             onClick={() => setNewGroupModalOpen(true)}
             className="p-1 rounded-lg bg-mint-500/10 text-mint-500 hover:bg-mint-500/20 transition-all"
           >
             <Plus size={16} />
           </button>
           <button className="p-1 text-text-muted hover:text-text-main">
             <MoreHorizontal size={16} />
           </button>
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-6">
        {filteredChats.map((chat: any) => {
          const isActive = activeChat?.id === chat.id;
          const isGroup = chat.type === 'group';
          const allParticipants = chat.chat_participants || [];
          const otherParticipant = allParticipants.find((p: any) => p.user_id !== user?.id) || allParticipants[0];
          const participantProfile = otherParticipant?.profiles;
          const chatName = isGroup ? (chat.name || 'Group') : (participantProfile?.name || 'User');
          const lastMsg = chat.last_message;
          const isTyping = typingUsers[otherParticipant?.user_id || ''];
          const time = lastMsg ? new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

          return (
            <div 
              key={chat.id}
              onClick={() => setActiveChat(chat)}
              className={`px-6 py-4 flex items-center gap-4 cursor-pointer transition-all hover:bg-surface-low group border-l-4 ${
                isActive ? 'bg-mint-500/5 border-mint-500 shadow-sm' : 'border-transparent'
              }`}
            >
              <div className="relative shrink-0">
                <div className={`w-12 h-12 rounded-2xl overflow-hidden shadow-sm transition-all duration-300 border border-outline-variant ${isActive ? 'scale-110' : ''}`}>
                  <img src={getAvatarUrl(isGroup ? chat : participantProfile)} alt={chatName} className="w-full h-full object-cover" />
                </div>
                {!isGroup && (
                  <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-presence-online border-2 border-surface-lowest rounded-full"></div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-0.5">
                  <h3 className={`text-sm font-bold truncate ${
                    isActive ? 'text-text-main' : 'text-text-main opacity-90'
                  }`}>
                    {chatName}
                  </h3>
                  <span className="text-[10px] text-text-muted font-bold">{time}</span>
                </div>
                <p className={`text-[12px] truncate ${
                  isTyping ? 'text-mint-500 font-bold italic' : (isActive ? 'text-text-main opacity-80' : 'text-text-muted')
                }`}>
                  {isTyping ? 'Typing...' : (lastMsg?.content || 'No messages yet')}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
