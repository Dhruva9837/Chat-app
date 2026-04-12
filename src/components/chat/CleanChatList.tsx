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
      {/* Search Bar & Action Integration */}
      <div className="px-6 pt-10 pb-6 flex items-center gap-3">
        <div className="relative group flex-1">
          <Search 
            size={18} 
            className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-white transition-colors" 
          />
          <input 
            type="text" 
            placeholder="Search..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-10 py-3 bg-surface-high rounded-2xl text-[13px] border-none focus:ring-0 transition-all outline-none text-white placeholder:text-text-muted font-medium"
          />
          {isSearching && (
             <div className="absolute right-4 top-1/2 -translate-y-1/2 text-noir-accent">
                <Loader2 size={16} className="animate-spin" />
             </div>
          )}
        </div>
        <button 
           onClick={() => setIsAddFriendModalOpen(true)}
           className="w-12 h-12 bg-noir-accent shrink-0 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-noir-accent/20 hover:scale-105 transition-all"
        >
           <UserPlus size={20} />
        </button>
      </div>

      {/* Unified Friends & Chat View */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-6">
        <AnimatePresence>
          {/* Snapchat-style Friends Carousel */}
          {friends.length > 0 && !search && (
            <motion.div 
               initial={{ opacity: 0, y: -20 }}
               animate={{ opacity: 1, y: 0 }}
               className="px-6 mb-8 mt-2"
            >
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
                      <button 
                        key={f.id} 
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('Carousel Clicked for:', profile.name, profile.id);
                          startPrivateChat(profile.id);
                        }}
                        className="flex flex-col items-center gap-2 group cursor-pointer shrink-0 active:scale-90 transition-all relative z-50 border-none outline-none bg-transparent p-0"
                      >
                       <div className="relative pointer-events-none">
                         <div className={`w-14 h-14 rounded-2xl overflow-hidden border-2 transition-all p-0.5 ${isOnline ? 'border-noir-accent shadow-lg shadow-noir-accent/20' : 'border-outline-variant grayscale opacity-60'}`}>
                           <img 
                             src={getAvatarUrl(profile)} 
                             alt="" 
                             className="w-full h-full object-cover rounded-[0.8rem]" 
                           />
                         </div>
                         {isOnline && (
                           <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-surface-lowest rounded-full shadow-lg"></div>
                         )}
                       </div>
                       <span className="text-[10px] font-bold text-text-muted group-hover:text-white transition-colors truncate max-w-[56px] pointer-events-none">
                         {profile.name.split(' ')[0]}
                       </span>
                      </button>
                   );
                 })}
               </div>
            </motion.div>
          )}

          {/* Pending Requests Section (Small & Clean) */}
          {friendRequests.filter(r => r.status === 'pending' && r.receiver_id === user?.id).length > 0 && !search && (
            <div className="px-6 mb-8">
              <h4 className="text-[10px] font-black uppercase text-rose-500 tracking-widest mb-4">Friend Requests</h4>
              <div className="space-y-3">
                {friendRequests.filter(r => r.status === 'pending' && r.receiver_id === user?.id).map(req => (
                  <div key={req.id} className="flex items-center gap-3 p-3 bg-surface-high/50 border border-outline-variant/30 rounded-[1.4rem]">
                    <img src={getAvatarUrl(req.sender_profile)} alt="" className="w-10 h-10 rounded-xl shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h5 className="text-[12px] font-black text-white truncate">{req.sender_profile.name}</h5>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button onClick={() => handleRequestAction(req.id, 'accept')} className="w-8 h-8 rounded-lg bg-noir-accent/20 text-noir-accent hover:bg-noir-accent hover:text-white transition-all"><Check size={14}/></button>
                      <button onClick={() => handleRequestAction(req.id, 'reject')} className="w-8 h-8 rounded-lg bg-surface-highest text-text-muted hover:text-rose-500 transition-all"><X size={14}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search Results */}
          {search.length >= 2 && (searchResults.profiles.length > 0 || searchResults.messages.length > 0) && (
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="px-6 pb-4 mb-4"
            >
               <h4 className="text-[10px] font-black uppercase text-noir-accent tracking-widest mb-3">Find Friends</h4>
               {searchResults.profiles.map(p => (
                 <button 
                  key={p.id} 
                  onClick={() => startPrivateChat(p.id)} 
                  className="w-full flex items-center gap-3 p-3 hover:bg-surface-high rounded-2xl cursor-pointer group transition-all mb-2 text-left border-none bg-transparent"
                 >
                    <img src={getAvatarUrl(p)} alt="" className="w-10 h-10 rounded-xl" />
                    <span className="text-sm font-bold text-white group-hover:text-noir-accent">{p.name}</span>
                 </button>
               ))}
            </motion.div>
          )}

          {/* Active Conversations slice */}
          <div className="pt-2">
            {!search && <h4 className="px-6 text-[10px] font-black uppercase text-text-muted tracking-widest mb-4">Messages</h4>}
            {filteredChats.map((chat: any) => {
              const isActive = activeChat?.id === chat.id;
              const isGroup = chat.type === 'group';
              const isPinned = pinnedChats.includes(chat.id);
              const allParticipants = chat.chat_participants || [];
              const otherParticipant = allParticipants.find((p: any) => p.user_id !== user?.id) || allParticipants[0];
              const participantProfile = otherParticipant?.profiles;
              
              const chatName = isGroup ? (chat.name || 'Office chat') : (participantProfile?.name || 'User');
              
              const lastMsg = chat.last_message;
              const unreadCount = chat.unread_count || 0;
              const isTyping = typingUsers[otherParticipant?.user_id || ''];
              
              const timeRaw = lastMsg ? new Date(lastMsg.created_at) : new Date(chat.created_at);
              const time = lastMsg ? timeRaw.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase() : 'now';

              return (
                <motion.div 
                  key={chat.id}
                  onClick={() => setActiveChat(chat)}
                  layout
                  className={`
                    mx-2 px-4 py-3.5 flex items-center gap-4 cursor-pointer transition-all rounded-[1.8rem] group relative mb-1
                    ${isActive ? 'bg-surface-high shadow-lg' : 'hover:bg-[#1E1E20]'}
                  `}
                >
                  <div className="relative shrink-0">
                    <div className="w-14 h-14 rounded-[1.6rem] overflow-hidden border-2 border-[#202022] group-hover:border-[#303032] transition-colors bg-surface-bubble">
                      <img 
                        src={getAvatarUrl(isGroup ? chat : participantProfile)} 
                        alt={chatName} 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    {!isGroup && otherParticipant && onlineUsers[otherParticipant.user_id]?.status === 'online' && (
                       <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-surface-lowest rounded-full"></div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <h3 className="text-[14px] font-display font-black text-white truncate tracking-tight flex items-center gap-2">
                        {chatName}
                        {isPinned && <Pin size={10} className="fill-noir-accent text-noir-accent opacity-80 shrink-0" />}
                      </h3>
                      <span className="text-[10px] text-text-muted font-bold whitespace-nowrap">
                        {time.replace(':00', '')}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <p className={`text-[12px] truncate ${
                        isTyping ? 'text-noir-accent font-bold italic' : 'text-text-muted'
                      }`}>
                        {isTyping ? 'Typing...' : (lastMsg?.content || 'Start chatting...')}
                      </p>
                      
                      {unreadCount > 0 && (
                        <div className="ml-2 w-5 h-5 bg-noir-accent text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-lg shadow-noir-accent/20">
                          {unreadCount}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
      </div>
    </div>
  );
};
