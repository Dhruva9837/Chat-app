'use client'

import React, { useState, useEffect } from 'react';
import { Search, Check, CheckCheck, MoreVertical, Pin, Loader2, MessageSquare, User, UserPlus, X, UserMinus } from 'lucide-react';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { getAvatarUrl } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

export const CleanChatList = () => {
  const { user } = useAuthStore();
  const { 
    chats, 
    activeChat, 
    setActiveChat, 
    typingUsers,
    pinnedChats,
    togglePinChat,
    setIsAddFriendModalOpen,
    onlineUsers,
    chatListTab,
    setChatListTab,
    friendRequests,
    friends,
    fetchFriends,
    fetchRequests,
    startPrivateChat
  } = useChatStore();
  
  const [search, setSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{profiles: any[], messages: any[]}>({ profiles: [], messages: [] });

  useEffect(() => {
    if (user) {
      fetchFriends(user.id);
      fetchRequests(user.id);
    }
  }, [user]);

  const handleRequestAction = async (requestId: string, action: 'accept' | 'reject') => {
    if (!user) return;
    try {
      if (action === 'accept') {
         const { data: request } = await supabase.from('friend_requests').select('*').eq('id', requestId).single();
         if (request) {
           await supabase.from('friend_requests').update({ status: 'accepted' }).eq('id', requestId);
           await supabase.from('friends').insert([
             { user_id: request.sender_id, friend_id: request.receiver_id },
             { user_id: request.receiver_id, friend_id: request.sender_id }
           ]);
         }
      } else {
         await supabase.from('friend_requests').update({ status: 'rejected' }).eq('id', requestId);
      }
      
      fetchRequests(user.id);
      if (action === 'accept') fetchFriends(user.id);
    } catch (err) {
      console.error(err);
    }
  };

  // Debounced global search
  useEffect(() => {
    if (!search || search.length < 2) {
      setSearchResults({ profiles: [], messages: [] });
      setIsSearching(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: search, userId: user?.id })
        });
        const data = await res.json();
        setSearchResults({ profiles: data.profiles || [], messages: data.messages || [] });
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [search, user?.id]);

  const filteredChats = chats.filter((chat: any) => {
    if (!search) return true;
    const isGroup = chat.type === 'group';
    const allParticipants = chat.chat_participants || [];
    const otherParticipant = allParticipants.find((p: any) => p.user_id !== user?.id) || allParticipants[0];
    const participantProfile = otherParticipant?.profiles;
    const nameToSearch = isGroup ? (chat.name || '') : (participantProfile?.name || '');
    return nameToSearch.toLowerCase().includes(search.toLowerCase());
  }).sort((a: any, b: any) => {
    const aPinned = pinnedChats.includes(a.id);
    const bPinned = pinnedChats.includes(b.id);
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    
    const timeA = new Date(a.last_message?.created_at || a.created_at).getTime();
    const timeB = new Date(b.last_message?.created_at || b.created_at).getTime();
    return timeB - timeA;
  });

  return (
    <div className="w-full h-full noir-sidebar-mid flex flex-col z-20 shrink-0 select-none">
      <div className="px-6 pt-10 pb-6 flex items-center gap-3">
        <div className="relative group flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-white" />
          <input 
            type="text" 
            placeholder="Search..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-10 py-3 bg-surface-high rounded-2xl text-[13px] border-none outline-none text-white"
          />
        </div>
        <button onClick={() => setIsAddFriendModalOpen(true)} className="w-12 h-12 bg-noir-accent rounded-2xl flex items-center justify-center text-white"><UserPlus size={20} /></button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-6 relative">
        <AnimatePresence>
          {friends.length > 0 && !search && (
            <div className="px-6 mb-8 mt-2 relative z-50">
               <h4 className="text-[10px] font-black uppercase text-text-muted tracking-widest mb-4 flex justify-between items-center">
                 <span>My Friends</span>
                 <span className="text-noir-accent">{friends.length}</span>
               </h4>
               <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                 {friends.map((f: any) => {
                   const profile = f.friend_profile;
                   if (!profile) return null;
                   const isOnline = onlineUsers[profile.id]?.status === 'online';
                   
                   return (
                      <div 
                        key={f.id} 
                        style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('FRIEND CLICKED:', profile.id);
                          startPrivateChat(profile.id);
                        }}
                        className="flex flex-col items-center gap-2 shrink-0 group"
                      >
                        <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-outline-variant relative">
                          <img src={getAvatarUrl(profile)} alt="" className="w-full h-full object-cover" />
                        </div>
                        <span className="text-[10px] font-bold text-text-muted">{profile.name.split(' ')[0]}</span>
                      </div>
                   );
                 })}
               </div>
            </div>
          )}

          {/* Messages */}
          <div className="pt-2">
            {!search && <h4 className="px-6 text-[10px] font-black uppercase text-text-muted tracking-widest mb-4">Messages</h4>}
            {filteredChats.map((chat: any) => {
              const isActive = activeChat?.id === chat.id;
              const allParticipants = chat.chat_participants || [];
              const otherParticipant = allParticipants.find((p: any) => p.user_id !== user?.id) || allParticipants[0];
              const participantProfile = otherParticipant?.profiles;
              
              return (
                <div 
                  key={chat.id}
                  onClick={() => setActiveChat(chat)}
                  className={`mx-2 px-4 py-3.5 flex items-center gap-4 cursor-pointer rounded-[1.8rem] mb-1 ${isActive ? 'bg-surface-high' : 'hover:bg-[#1E1E20]'}`}
                >
                  <div className="w-14 h-14 rounded-[1.6rem] overflow-hidden bg-surface-bubble shrink-0">
                    <img src={getAvatarUrl(participantProfile)} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[14px] font-black text-white truncate">{participantProfile?.name || 'User'}</h3>
                    <p className="text-[12px] text-text-muted truncate">{chat.last_message?.content || 'Start chatting...'}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </AnimatePresence>
      </div>
    </div>
  );
};
