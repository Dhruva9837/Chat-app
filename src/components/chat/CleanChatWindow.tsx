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
import { BrandLogo } from '../BrandLogo';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';

export const CleanChatWindow = () => {
  const { user, profile } = useAuthStore();
  const { 
    activeChat, 
    setActiveChat, 
    setTypingUser,
    setShowInfoPanel,
    showInfoPanel,
    blockedUsers,
    messages,
    setMessages,
    addMessage,
    resolveOptimisticMessage
  } = useChatStore();
  
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
            sender_profile:profiles!sender_id (id, name, avatar_url)
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

    // Per-chat typing channel — unique name avoids conflict with global-messages in page.tsx
    const typingChannel = supabase.channel(`typing:${activeChat.id}`);
    
    typingChannel
      .on('broadcast', { event: 'typing' }, (payload) => {
         setTypingUser(payload.payload.userId, payload.payload.isTyping);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          channelRef.current = typingChannel;
        }
      });

    return () => {
      supabase.removeChannel(typingChannel);
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

    let messageType: 'text' | 'image' = 'text';
    let imageUrl: string | undefined = undefined;
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
      is_read: false,
      sender_profile: profile || user
    };

    addMessage(optimisticMsg);
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
        resolveOptimisticMessage(tempId, { ...data, sender_profile: profile || user });
      }
    } catch (err) {
      setMessages(messages.filter(m => m.id !== tempId));
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
            className="w-10 h-10 rounded-[1rem] bg-surface-high flex items-center justify-center text-text-muted hover:text-white md:hidden transition-all active:scale-95 border border-outline-variant"
          >
            <ChevronLeft size={20} />
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
          {messages.map((msg) => (
            <MessageBubble 
              key={msg.id}
              msg={msg}
              isMe={msg.sender_id === user?.id}
              isGroup={isGroup}
              user={user}
              profile={profile}
            />
          ))}
        </AnimatePresence>
      </div>      <MessageInput 
        newMessage={newMessage}
        isUploading={isUploading}
        isBlocked={isBlocked}
        showEmojiPicker={showEmojiPicker}
        selectedImage={selectedImage}
        setShowEmojiPicker={setShowEmojiPicker}
        setSelectedImage={setSelectedImage}
        onSendMessage={handleSendMessage}
        onTyping={handleTyping}
        onEmojiClick={onEmojiClick}
        onImageSelect={handleImageSelect}
      />
    </div>
  );
};
