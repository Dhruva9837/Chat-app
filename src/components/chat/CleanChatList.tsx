'use client'

import React, { useState, useEffect } from 'react';
import { Search, Check, CheckCheck, MoreVertical, Pin, Loader2, MessageSquare, User, UserPlus } from 'lucide-react';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { getAvatarUrl } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

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
    onlineUsers
  } = useChatStore();
  
  const [search, setSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{profiles: any[], messages: any[]}>({ profiles: [], messages: [] });

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
    <div className="w-[340px] h-full noir-sidebar-mid flex flex-col z-20 shrink-0 select-none">
      {/* Search Bar & Action Integration */}
      <div className="px-6 pt-10 pb-6 flex items-center gap-3">
        <div className="relative group flex-1">
          <Search 
            size={18} 
            className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-white transition-colors" 
          />
          <input 
            type="text" 
            placeholder="Search Protocol..." 
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

      {/* Chat Scroll Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-6 space-y-1">
        <AnimatePresence>
          {/* Display Global Search Results if searching */}
          {search.length >= 2 && (searchResults.profiles.length > 0 || searchResults.messages.length > 0) && (
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="px-6 pb-4 mb-4 border-b border-outline-variant"
            >
               <h4 className="text-[10px] font-black uppercase text-noir-accent tracking-widest mb-3">Global Discovery</h4>
               
               {searchResults.profiles.length > 0 && (
                 <div className="mb-4">
                    <span className="text-[10px] text-text-muted font-bold block mb-2">ENTITIES</span>
                    {searchResults.profiles.map(p => (
                       <div key={p.id} onClick={() => setIsAddFriendModalOpen(true)} className="flex items-center gap-3 p-2 hover:bg-[#1E1E20] rounded-[1rem] cursor-pointer group transition-all">
                          <User size={14} className="text-text-muted group-hover:text-white" />
                          <span className="text-sm font-bold text-white group-hover:text-noir-accent">{p.name}</span>
                       </div>
                    ))}
                 </div>
               )}

               {searchResults.messages.length > 0 && (
                 <div>
                    <span className="text-[10px] text-text-muted font-bold block mb-2">TRANSMISSIONS</span>
                    {searchResults.messages.map(m => {
                       const relatedChat = chats.find(c => c.id === m.chat_id);
                       return (
                         <div 
                           key={m.id} 
                           onClick={() => { if(relatedChat) setActiveChat(relatedChat); }}
                           className="flex flex-col gap-1 p-3 hover:bg-[#1E1E20] rounded-[1rem] cursor-pointer group transition-all"
                         >
                            <div className="flex items-center gap-2">
                               <MessageSquare size={12} className="text-text-muted group-hover:text-noir-accent" />
                               <span className="text-[11px] font-black text-white">{m.sender?.name || 'User'}</span>
                            </div>
                            <span className="text-[12px] text-text-muted line-clamp-1 italic">"{m.content}"</span>
                         </div>
                       )
                    })}
                 </div>
               )}
            </motion.div>
          )}

          {/* Standard Chat List */}
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
            const time = lastMsg ? timeRaw.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase() : '4 m';

            return (
              <motion.div 
                key={chat.id}
                onClick={() => setActiveChat(chat)}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`
                  mx-2 px-4 py-4 flex items-center gap-4 cursor-pointer transition-all rounded-[1.8rem] group relative
                  ${isActive ? 'bg-surface-high' : 'hover:bg-[#1E1E20]'}
                `}
              >
                {/* Avatar with specialized radius */}
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
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-[15px] font-display font-black text-white truncate tracking-tight flex items-center gap-2">
                      {chatName}
                      {isPinned && <Pin size={10} className="fill-noir-accent text-noir-accent opacity-80 shrink-0" />}
                    </h3>
                    <div className="flex items-center gap-1.5 shrink-0">
                       {lastMsg?.sender_id === user?.id && (
                         <div className="text-text-muted">
                            {lastMsg.is_read ? <CheckCheck size={14} className="text-noir-accent" /> : <Check size={14} />}
                         </div>
                       )}
                       <span className="text-[11px] text-text-muted font-bold whitespace-nowrap">
                         {time.replace(':00', '')}
                       </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <p className={`text-[13px] truncate ${
                      isTyping ? 'text-noir-accent font-bold italic' : 'text-text-muted'
                    }`}>
                      {isTyping ? 'Typing...' : (lastMsg?.content || 'Initiated connection...')}
                    </p>
                    
                    {unreadCount > 0 && (
                      <div className="ml-2 px-2 py-0.5 bg-noir-accent text-white text-[10px] font-black rounded-full min-w-[20px] flex items-center justify-center shadow-lg shadow-noir-accent/20">
                        {unreadCount}
                      </div>
                    )}
                    
                    {!unreadCount && (
                        <button 
                           onClick={(e) => { e.stopPropagation(); togglePinChat(chat.id); }}
                           className={`ml-2 p-1 rounded-md transition-all ${isPinned ? 'opacity-100 text-noir-accent' : 'opacity-0 group-hover:opacity-100 text-text-muted hover:text-white'}`}
                        >
                           <Pin size={14} className={isPinned ? 'fill-noir-accent' : ''} />
                        </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};
