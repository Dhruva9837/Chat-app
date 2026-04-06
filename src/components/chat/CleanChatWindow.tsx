'use client'

import React, { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, MoreHorizontal, Smile, Video, Phone, ChevronLeft } from 'lucide-react';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import { getAvatarUrl } from '@/lib/utils';

export const CleanChatWindow = () => {
  const { user } = useAuthStore();
  const { 
    activeChat, 
    setActiveChat, 
    typingUsers,
    setTypingUser
  } = useChatStore();
  
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch messages for active chat
  useEffect(() => {
    if (!activeChat) return;
    
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          profiles:sender_id (id, name, avatar_url)
        `)
        .eq('chat_id', activeChat.id)
        .order('created_at', { ascending: true });
        
      if (data) setMessages(data);
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`chat:${activeChat.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `chat_id=eq.${activeChat.id}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeChat?.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat || !user) return;

    const content = newMessage;
    setNewMessage('');

    const { error } = await supabase
      .from('messages')
      .insert({
        chat_id: activeChat.id,
        sender_id: user.id,
        content
      });

    if (error) console.error('Error sending message:', error);
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    // Note: In a real app, you'd broadcast this to others via Supabase Realtime
    // For now, we're just updating the local store state for consistency
    if (user) setTypingUser(user.id, e.target.value.length > 0);
  };

  if (!activeChat) {
    return (
      <div className="flex-1 h-full bg-surface-lowest flex flex-col items-center justify-center text-text-muted transition-colors duration-300">
        <div className="w-24 h-24 bg-surface-low rounded-[3rem] flex items-center justify-center mb-6">
          <Send size={40} className="opacity-20 translate-x-1 -translate-y-1" />
        </div>
        <p className="text-sm font-bold uppercase tracking-widest opacity-50 font-sans">Select a chat to start messaging</p>
      </div>
    );
  }

  const isGroup = activeChat.type === 'group';
  const otherParticipant = activeChat.chat_participants?.find((p: any) => p.user_id !== user?.id) || activeChat.chat_participants?.[0];
  const chatName = isGroup ? activeChat.name : otherParticipant?.profiles?.name;

  return (
    <div className="flex-1 h-full bg-surface-lowest flex flex-col relative shadow-sm transition-colors duration-300">
      {/* Header */}
      <div className="px-8 py-4 flex justify-between items-center border-b border-outline-variant bg-surface-lowest/80 backdrop-blur-md sticky top-0 z-10 transition-colors">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setActiveChat(null)}
            className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center text-text-muted hover:bg-surface-low transition-all lg:hidden"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm border border-outline-variant">
               <img src={getAvatarUrl(isGroup ? activeChat : otherParticipant?.profiles)} alt="" className="w-full h-full object-cover" />
             </div>
             <div>
               <h2 className="text-lg font-bold text-text-main">{chatName}</h2>
               <p className="text-[10px] font-bold text-mint-500 uppercase tracking-widest">Active Now</p>
             </div>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="hidden sm:flex bg-surface-low p-1.5 rounded-2xl border border-outline-variant">
            <button className="px-6 py-2 text-xs font-bold rounded-xl bg-surface-lowest shadow-sm text-mint-500 transition-all font-sans">Messages</button>
            <button className="px-6 py-2 text-xs font-bold rounded-xl text-text-muted hover:text-text-main transition-all font-sans">Participants</button>
          </div>
        </div>

        <div className="flex items-center gap-4">
           <button className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center text-text-muted hover:bg-surface-low transition-colors">
             <MoreHorizontal size={20} />
           </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-8 py-6 space-y-6 bg-bg-base no-scrollbar transition-colors">
        {messages.map((msg) => {
          const isMe = msg.sender_id === user?.id;
          const time = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          
          return (
            <div 
              key={msg.id} 
              className={`flex items-start gap-3 ${isMe ? 'flex-row-reverse' : ''}`}
            >
              {!isMe && (
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 shadow-sm border-2 border-surface-lowest">
                  <img src={getAvatarUrl(msg.profiles)} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <div className={`flex flex-col gap-1 max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                {!isMe && <span className="text-[11px] font-bold text-text-muted ml-1">{msg.profiles?.name}, {time}</span>}
                <div 
                  className={`px-5 py-3 text-sm shadow-sm transition-all hover:shadow-md ${
                    isMe 
                      ? 'bg-mint-500 text-white rounded-2xl rounded-tr-none font-medium' 
                      : 'bg-surface-lowest text-text-main rounded-2xl rounded-tl-none border border-outline-variant ring-1 ring-black/5'
                  }`}
                >
                  {msg.content}
                </div>
                {isMe && <span className="text-[10px] text-text-muted font-bold mt-0.5 px-1">{time}</span>}
              </div>
            </div>
          );
        })}
        
        {/* Typing Indicators */}
        {Object.entries(typingUsers).map(([userId, typing]) => {
          if (!typing || userId === user?.id) return null;
          return (
            <div key={userId} className="flex items-center gap-3 px-1">
              <div className="w-8 h-6 flex items-center justify-center bg-surface-low rounded-full">
                <div className="flex gap-1">
                  <div className="w-1 h-1 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-1 h-1 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
                  <div className="w-1 h-1 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '400ms' }}></div>
                </div>
              </div>
              <span className="text-[11px] font-bold text-text-muted italic">Someone is typing</span>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div className="px-8 py-6 border-t border-outline-variant bg-surface-lowest transition-colors">
        <form onSubmit={handleSendMessage} className="flex items-center gap-4 bg-surface-low p-2 pl-6 rounded-[2rem] border border-outline-variant focus-within:border-mint-500/30 focus-within:bg-surface-lowest transition-all group">
          <input 
            type="text" 
            value={newMessage}
            onChange={handleTyping}
            placeholder="Write your message..." 
            className="flex-1 bg-transparent border-none outline-none text-sm text-text-main placeholder-text-muted py-3 font-medium"
          />
          <div className="flex items-center gap-2 pr-2">
            <button type="button" className="p-2 text-text-muted hover:text-text-main transition-colors">
              <Smile size={22} />
            </button>
            <button type="submit" className="w-12 h-12 bg-mint-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-mint-500/20 hover:bg-mint-600 hover:scale-105 transition-all">
              <Send size={20} fill="currentColor" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
