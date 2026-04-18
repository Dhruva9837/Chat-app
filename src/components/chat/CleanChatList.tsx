'use client'

import React, { useState, useEffect } from 'react';
import { Search, Check, Pin, Loader2, MessageSquare, UserPlus, X } from 'lucide-react';
import { ChatListItem } from './ChatListItem';
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
    setIsAddFriendModalOpen,
    onlineUsers,
    friendRequests,
    friends,
    fetchFriends,
    fetchRequests,
    startPrivateChat
  } = useChatStore();
  
  const [search, setSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{profiles: any[], messages: any[]}>({ profiles: [], messages: [] });
  const [chatLoading, setChatLoading] = useState<string | null>(null);

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
      // Error handled silently
    }
  };

  // Handle clicking on a friend to start chat
  const handleFriendChat = async (friendId: string) => {
    setChatLoading(friendId);
    try {
      await startPrivateChat(friendId);
    } catch (err) {
      console.error('Failed to start chat:', err);
    } finally {
      setChatLoading(null);
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
        // Error handled silently
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

  // Find friends who DON'T have an existing chat yet
  const friendsWithoutChat = friends.filter((f: any) => {
    const profile = f.friend_profile;
    if (!profile) return false;
    // Check if this friend already exists in chats list
    // Use optional chaining and robust ID comparison
    return !chats.some(c => 
      c.type === 'private' && 
      c.chat_participants?.some((p: any) => p.user_id === profile.id)
    );
  });

  return (
    <div className="w-full h-full noir-sidebar-mid flex flex-col z-20 shrink-0 select-none">
      {/* Search Bar */}
      <div className="px-6 pt-10 pb-6 flex items-center gap-3">
        <div className="relative group flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-white transition-colors" />
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

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-6">

        {/* Pending Requests */}
        {friendRequests.filter(r => r.status === 'pending' && r.receiver_id === user?.id).length > 0 && !search && (
          <div className="px-6 mb-6">
            <h4 className="text-[10px] font-black uppercase text-rose-500 tracking-widest mb-3">Friend Requests</h4>
            <div className="space-y-2">
              {friendRequests.filter(r => r.status === 'pending' && r.receiver_id === user?.id).map(req => (
                <div key={req.id} className="flex items-center gap-3 p-3 bg-surface-high/50 border border-outline-variant/30 rounded-[1.4rem]">
                  <img src={getAvatarUrl(req.sender_profile)} alt="" className="w-10 h-10 rounded-xl shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h5 className="text-[12px] font-black text-white truncate">{req.sender_profile?.name || 'User'}</h5>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button onClick={() => handleRequestAction(req.id, 'accept')} className="w-8 h-8 rounded-lg bg-noir-accent/20 text-noir-accent hover:bg-noir-accent hover:text-white transition-all flex items-center justify-center"><Check size={14}/></button>
                    <button onClick={() => handleRequestAction(req.id, 'reject')} className="w-8 h-8 rounded-lg bg-surface-highest text-text-muted hover:text-rose-500 transition-all flex items-center justify-center"><X size={14}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search Results */}
        {search.length >= 2 && (searchResults.profiles.length > 0) && (
          <div className="px-6 pb-4 mb-4">
            <h4 className="text-[10px] font-black uppercase text-noir-accent tracking-widest mb-3">Search Results</h4>
            {searchResults.profiles.map(p => (
              <button 
                key={p.id} 
                onClick={() => handleFriendChat(p.id)} 
                className="w-full flex items-center gap-3 p-3 hover:bg-surface-high rounded-2xl cursor-pointer group transition-all mb-2 text-left border-none bg-transparent"
              >
                <img src={getAvatarUrl(p)} alt="" className="w-12 h-12 rounded-[1.4rem]" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-[14px] font-black text-white truncate">{p.name}</h3>
                  <p className="text-[11px] text-text-muted">Tap to chat</p>
                </div>
                <MessageSquare size={18} className="text-noir-accent opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        )}

        {/* === FRIENDS WITHOUT CHATS (WhatsApp style — show them in the list) === */}
        {friendsWithoutChat.length > 0 && !search && (
          <div className="mb-2">
            <h4 className="px-6 text-[10px] font-black uppercase text-text-muted tracking-widest mb-3">Friends</h4>
            {friendsWithoutChat.map((f: any) => {
              const profile = f.friend_profile;
              if (!profile) return null;
              const isOnline = onlineUsers[profile.id]?.status === 'online';
              const isLoading = chatLoading === profile.id;

              return (
                <button
                  key={f.id}
                  onClick={() => handleFriendChat(profile.id)}
                  disabled={isLoading}
                  className="w-full mx-2 px-4 py-3.5 flex items-center gap-4 cursor-pointer transition-all rounded-[1.8rem] group mb-1 hover:bg-[#1E1E20] text-left border-none bg-transparent disabled:opacity-50"
                  style={{ width: 'calc(100% - 16px)' }}
                >
                  <div className="relative shrink-0">
                    <div className="w-14 h-14 rounded-[1.6rem] overflow-hidden border-2 border-[#202022] group-hover:border-[#303032] transition-colors bg-surface-bubble">
                      <img src={getAvatarUrl(profile)} alt="" className="w-full h-full object-cover" />
                    </div>
                    {isOnline && (
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-surface-lowest rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[14px] font-display font-black text-white truncate tracking-tight">{profile.name}</h3>
                    <p className="text-[12px] text-noir-accent font-medium">
                      {isLoading ? 'Opening chat...' : 'Tap to start chatting'}
                    </p>
                  </div>
                  <div className="shrink-0">
                    {isLoading ? (
                      <Loader2 size={18} className="text-noir-accent animate-spin" />
                    ) : (
                      <MessageSquare size={18} className="text-noir-accent opacity-60 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* === ACTIVE CONVERSATIONS === */}
        <div className="pt-2">
          {!search && <h4 className="px-6 text-[10px] font-black uppercase text-text-muted tracking-widest mb-3">Messages</h4>}
          {filteredChats.map((chat: any) => {
            const otherParticipant = chat.chat_participants?.find((p: any) => p.user_id !== user?.id) || chat.chat_participants?.[0];
            return (
              <ChatListItem
                key={chat.id}
                chat={chat}
                isActive={activeChat?.id === chat.id}
                isPinned={pinnedChats.includes(chat.id)}
                isOnline={chat.type === 'private' && otherParticipant && onlineUsers[otherParticipant.user_id]?.status === 'online'}
                isTyping={typingUsers[otherParticipant?.user_id || '']}
                unreadCount={chat.unread_count || 0}
                user={user}
                onlineUsers={onlineUsers}
                typingUsers={typingUsers}
                setActiveChat={setActiveChat}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
