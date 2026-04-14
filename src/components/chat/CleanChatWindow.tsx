'use client'

import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Paperclip, 
  Search, 
  Phone, 
  Maximize2, 
  MoreHorizontal, 
  Mic,
  ChevronLeft,
  Check,
  CheckCheck,
  Smile,
  X,
  Loader2
} from 'lucide-react';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import { getAvatarUrl } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { BrandLogo } from '../BrandLogo';

export const CleanChatWindow = () => {
  const { user } = useAuthStore();
  const { 
    activeChat, 
    setActiveChat, 
    setTypingUser,
    setShowInfoPanel,
    showInfoPanel,
    blockedUsers
  } = useChatStore();
  
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{file: File, url: string} | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const channelRef = useRef<any>(null);
  const typingTimeoutRef = useRef<any>(null);

  // Reset state when switching chats
  useEffect(() => {
    setMessages([]);
    setNewMessage('');
    setSelectedImage(null);
    setShowEmojiPicker(false);
  }, [activeChat?.id]);

  useEffect(() => {
    if (!activeChat || activeChat.id === 'pending') return;
    
    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select(`
            *,
            profiles:profiles!sender_id (id, name, avatar_url)
          `)
          .eq('chat_id', activeChat.id)
          .order('created_at', { ascending: true });

        if (error) throw error;
        if (data) {
          setMessages(data);
          const unreadIds = data.filter(m => !m.is_read && m.sender_id !== user?.id).map(m => m.id);
          if (unreadIds.length > 0) {
            await supabase.from('messages').update({ is_read: true }).in('id', unreadIds);
          }
        }
      } catch (err) {
        console.error('Failed to fetch messages:', err);
      }
    };
    
    fetchMessages();

    const channel = supabase
      .channel(`chat:${activeChat.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `chat_id=eq.${activeChat.id}`
      }, async (payload) => {
        const newMessage = payload.new;
        
        setMessages(prev => {
          // 1. Check if we already have this message by real ID
          if (prev.some(m => m.id === newMessage.id)) return prev;
          
          // 2. Check if this is our own message that we sent optimistically 
          // (matching by content, sender, and very close timestamp if needed)
          // Since we update the optimistic message ID in handleSendMessage, 
          // we might still have a race condition where the realtime event hits first.
          
          // Let's check for any "sending" messages that match this one
          const optimisticIndex = prev.findIndex(m => 
            m.sending && 
            m.sender_id === newMessage.sender_id && 
            m.content === newMessage.content
          );

          if (optimisticIndex !== -1) {
            // Replace the optimistic message with the real one
            const newPrev = [...prev];
            // Fetch profile for the new message if it's not from us (though usually it is if it's optimistic)
            // But for other users, we need their profile.
            newPrev[optimisticIndex] = { ...newMessage, profiles: prev[optimisticIndex].profiles };
            return newPrev;
          }

          return [...prev, newMessage];
        });
        
        // If it's from another user, fetch their profile to ensure avatar shows up
        if (newMessage.sender_id !== user?.id) {
           const { data: profile } = await supabase.from('profiles').select('*').eq('id', newMessage.sender_id).single();
           if (profile) {
              setMessages(prev => prev.map(m => m.id === newMessage.id ? { ...m, profiles: profile } : m));
           }

           // Mark as read
           supabase.from('messages').update({ is_read: true }).eq('id', newMessage.id).then();
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${activeChat.id}`
      }, (payload) => {
        setMessages(prev => prev.map(m => 
          m.id === payload.new.id 
            ? { ...payload.new, profiles: m.profiles } 
            : m
        ));
      })
      .on('broadcast', { event: 'typing' }, (payload) => {
         setTypingUser(payload.payload.userId, payload.payload.isTyping);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          channelRef.current = channel;
        }
      });

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [activeChat?.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      // Also scroll after a short delay for images
      setTimeout(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }, 100);
    }
  }, [messages, isUploading, selectedImage]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage({
        file,
        url: URL.createObjectURL(file)
      });
      setShowEmojiPicker(false);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleTyping = (val: string) => {
    setNewMessage(val);
    if (!user || !channelRef.current) return;
    
    channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId: user.id, isTyping: true }
    });
    
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      channelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId: user.id, isTyping: false }
      });
    }, 2000);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedImage) || !activeChat || !user || isUploading) return;

    let messageType = 'text';
    let imageUrl = null;
    let content = newMessage.trim();

    setIsUploading(true);

    if (selectedImage) {
      try {
        const fileExt = selectedImage.file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `chat-attachments/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('chat-media')
          .upload(filePath, selectedImage.file);
          
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('chat-media')
          .getPublicUrl(filePath);
          
        imageUrl = publicUrl;
        messageType = 'image';
        if (!content) content = 'Sent an image';
      } catch (err) {
        console.error('Error uploading image:', err);
        setIsUploading(false);
        return;
      }
    }

    const tempId = `temp-${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      chat_id: activeChat.id,
      sender_id: user.id,
      content,
      message_type: messageType,
      image_url: imageUrl,
      created_at: new Date().toISOString(),
      sending: true,
      profiles: user
    };

    setMessages(prev => [...prev, optimisticMsg]);
    setNewMessage('');
    setSelectedImage(null);
    setShowEmojiPicker(false);

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          chat_id: activeChat.id,
          sender_id: user.id,
          content,
          message_type: messageType,
          image_url: imageUrl
        })
        .select()
        .single();

      if (error) throw error;
      
      if (data) {
        setMessages(prev => prev.map(m => m.id === tempId ? { ...data, profiles: user } : m));
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } finally {
      setIsUploading(false);
    }
  };

  const onEmojiClick = (emojiObject: any) => {
    setNewMessage(prev => prev + emojiObject.emoji);
  };

  if (!activeChat || activeChat.id === 'pending') {
    return (
      <div className="flex-1 h-full bg-surface-lowest flex flex-col items-center justify-center text-text-muted select-none">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-8"
        >
          {activeChat?.id === 'pending' ? (
            <Loader2 size={48} className="text-noir-accent animate-spin" />
          ) : (
            <BrandLogo />
          )}
        </motion.div>
        <h2 className="text-[12px] font-black uppercase tracking-[0.4em] opacity-40 mt-4">
          {activeChat?.id === 'pending' ? 'Establishing secure connection...' : 'Select a chat to start messaging'}
        </h2>
        <p className="text-[10px] font-bold text-text-muted/30 uppercase tracking-[0.2em] mt-2">Private & Encrypted</p>
      </div>
    );
  }

  const isGroup = activeChat.type === 'group';
  
  // Safely find the other participant
  const otherParticipant = (activeChat.chat_participants || []).find((p: any) => p.user_id !== user?.id) || (activeChat.chat_participants?.[0]);
  
  // Safely get the name
  const participantProfile = otherParticipant?.profiles;
  const chatName = isGroup 
    ? (activeChat.name || 'Group Chat') 
    : (participantProfile?.name || participantProfile?.username || otherParticipant?.user_id || 'Secure Chat');

  const isBlocked = !isGroup && otherParticipant ? blockedUsers.includes(otherParticipant.user_id) : false;

  return (
    <div className="flex-1 h-full bg-surface-lowest flex flex-col relative select-none">
      
      {/* Header */}
      <header className="px-4 md:px-10 py-6 flex justify-between items-center z-20 bg-surface-lowest/80 backdrop-blur-md sticky top-0 transition-all">
        <div className="flex items-center gap-3 md:gap-4">
          <button 
            onClick={() => setActiveChat(null)}
            className="p-2 -ml-2 text-text-muted hover:text-white md:hidden"
          >
            <ChevronLeft size={24} />
          </button>
          
          {/* Avatar in Header */}
          <div className="w-12 h-12 rounded-[1.2rem] overflow-hidden border-2 border-[#202022] bg-surface-bubble shrink-0">
            <img 
              src={getAvatarUrl(participantProfile)} 
              alt={chatName} 
              className="w-full h-full object-cover" 
            />
          </div>

          <div>
            <h1 className="text-lg md:text-2xl font-display font-black text-white tracking-tight uppercase truncate max-w-[150px] md:max-w-none">
              {chatName}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
               <span className="text-[10px] md:text-[11px] font-bold text-text-muted">
                 {isGroup ? `${activeChat.chat_participants?.length || 0} members` : isBlocked ? 'Unavailable' : 'Secure Direct Message'}
               </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-4">
           <button className="hidden sm:block p-2 text-text-muted hover:text-white transition-colors"><Search size={20} /></button>
           <button 
             onClick={() => setShowInfoPanel(!showInfoPanel)}
             className={`p-2 transition-colors ${showInfoPanel ? 'text-noir-accent' : 'text-text-muted hover:text-white'}`}
           >
             <Maximize2 size={18} className="md:w-5 md:h-5" />
           </button>
           <button className="p-2 text-text-muted hover:text-white transition-colors"><MoreHorizontal size={20} /></button>
        </div>
      </header>

      {/* Messages */}
      <div 
        ref={scrollRef} 
        className="flex-1 overflow-y-auto px-4 md:px-10 py-6 space-y-6 md:space-y-8 no-scrollbar scroll-smooth"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg, index) => {
            const isMe = msg.sender_id === user?.id;
            const time = new Date(msg.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
            
            return (
              <motion.div 
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-2 md:gap-3 max-w-[90%] md:max-w-[85%] ${isMe ? 'ml-auto flex-row-reverse' : ''}`}
              >
                {/* Profile Image - Only on outer edges */}
                <div className="shrink-0 mt-auto mb-1">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-[1.2rem] overflow-hidden bg-surface-low border border-outline-variant">
                    <img 
                      src={getAvatarUrl(isMe ? user : msg.profiles)} 
                      alt="" 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                </div>
                
                <div className={`flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                  {isGroup && !isMe && (
                    <span className="text-[10px] md:text-[11px] font-black text-white/50 tracking-wide ml-1">
                       {msg.profiles?.name}
                    </span>
                  )}
                  
                  <div 
                    className={`
                      px-4 md:px-6 py-2.5 md:py-4 text-[13px] md:text-[14px] font-medium leading-relaxed
                      ${isMe ? 'noir-bubble-sent' : 'noir-bubble-received'}
                      ${msg.message_type === 'image' ? 'p-1 md:p-2' : ''}
                      ${msg.sending ? 'message-sending' : ''}
                    `}
                  >
                    {msg.message_type === 'image' && msg.image_url ? (
                      <div className="flex flex-col gap-2">
                        <div className="w-full max-w-[260px] md:max-w-[300px] rounded-[1rem] md:rounded-[1.4rem] overflow-hidden">
                          <img src={msg.image_url} alt="Attachment" className="w-full h-auto object-cover" />
                        </div>
                        {msg.content !== 'Sent an image' && (
                          <span className="px-3 md:px-4 pb-1 md:pb-2">{msg.content}</span>
                        )}
                      </div>
                    ) : (
                      <span>{msg.content}</span>
                    )}

                    <div className={`flex items-center gap-1 mt-1 justify-end ${isMe ? 'opacity-60' : 'opacity-30'}`}>
                       <span className="text-[8px] md:text-[9px] font-black uppercase">{time}</span>
                       {isMe && (
                         msg.sending ? <Loader2 size={10} className="animate-spin" /> : <CheckCheck size={12} className="text-white" />
                       )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Upload Preview & Emoji Picker Container */}
      <div className="px-4 md:px-10 relative">
        <AnimatePresence>
          {showEmojiPicker && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-full mb-4 right-4 md:right-10 z-50 shadow-2xl"
            >
              <EmojiPicker 
                theme={Theme.DARK} 
                onEmojiClick={onEmojiClick}
                width={typeof window !== 'undefined' && window.innerWidth < 640 ? 300 : undefined}
                style={{
                  backgroundColor: '#161618',
                  borderColor: 'rgba(255,255,255,0.05)',
                  '--epr-bg-color': '#161618',
                  '--epr-category-label-bg-color': '#161618',
                  '--epr-picker-border-radius': '2.2rem',
                } as any}
              />
            </motion.div>
          )}

          {selectedImage && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mb-4 p-3 md:p-4 bg-surface-low rounded-[1.5rem] md:rounded-[2.2rem] border border-outline-variant flex items-center justify-between shadow-2xl"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-[1rem] overflow-hidden bg-black/50 border border-outline-variant">
                  <img src={selectedImage.url} alt="Preview" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white truncate max-w-[200px]">{selectedImage.file.name}</h4>
                  <p className="text-[10px] font-black uppercase text-text-muted mt-1 tracking-widest">
                    {(selectedImage.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedImage(null)}
                className="w-10 h-10 rounded-full bg-surface-lowest border border-outline-variant flex items-center justify-center text-text-muted hover:text-rose-500 hover:border-rose-500/50 transition-all"
              >
                <X size={18} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input Section */}
      <div className="px-4 md:px-10 pb-6 md:pb-10">
        <form 
          onSubmit={handleSendMessage}
          className="relative flex items-center bg-surface-low rounded-[1.8rem] md:rounded-[2.2rem] border border-outline-variant group transition-all focus-within:ring-2 focus-within:ring-noir-accent/20 shadow-lg"
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageSelect} 
            accept="image/*" 
            className="hidden" 
          />
          <button 
            type="button" 
            onClick={() => fileInputRef.current?.click()}
            className="p-4 md:p-5 text-text-muted hover:text-white transition-colors"
          >
            <Paperclip size={22} strokeWidth={2.5} className="w-5 h-5 md:w-[22px] md:h-[22px]" />
          </button>
          
          <input 
            type="text" 
            value={newMessage}
            disabled={isUploading || isBlocked}
            onChange={(e) => handleTyping(e.target.value)}
            placeholder={isBlocked ? "Messaging disabled" : isUploading ? "Uploading..." : "Message"} 
            className="flex-1 bg-transparent border-none outline-none text-[14px] md:text-[15px] text-white placeholder-text-muted py-4 md:py-5 px-1 font-medium disabled:opacity-50"
          />

          <div className="flex items-center gap-0.5 md:gap-1 pr-2 md:pr-3">
             <button 
               type="button" 
               onClick={() => setShowEmojiPicker(!showEmojiPicker)}
               className={`hidden sm:flex p-3 transition-colors ${showEmojiPicker ? 'text-noir-accent' : 'text-text-muted hover:text-white'}`}
             >
                <Smile size={20} strokeWidth={2.5} />
             </button>
             
             {(newMessage.trim() || selectedImage) && (
               <motion.button 
                 initial={{ scale: 0.8, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 type="submit" 
                 disabled={isUploading || isBlocked}
                 className={`p-3 md:p-4 rounded-full flex items-center justify-center transition-all ${
                   isUploading || isBlocked
                    ? 'bg-[#2A2A2C] text-text-muted border border-outline-variant' 
                    : 'bg-noir-accent text-white shadow-lg shadow-noir-accent/30 hover:scale-105 active:scale-95'
                 }`}
               >
                 {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} fill="currentColor" />}
               </motion.button>
             )}
             {(!newMessage.trim() && !selectedImage) && (
               <button type="button" className="p-3 text-text-muted hover:text-noir-accent transition-colors">
                  <Mic size={20} strokeWidth={2.5} />
               </button>
             )}
          </div>
        </form>
      </div>
    </div>
  );
};
