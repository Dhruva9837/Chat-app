'use client'

import React from 'react';
import { motion } from 'framer-motion';
import { Pin } from 'lucide-react';
import { getAvatarUrl } from '@/lib/utils';
import { Chat } from '@/types/database';

interface ChatListItemProps {
  chat: Chat;
  isActive: boolean;
  isPinned: boolean;
  isOnline: boolean;
  isTyping: boolean;
  unreadCount: number;
  user: any;
  onlineUsers: Record<string, any>;
  typingUsers: Record<string, boolean>;
  setActiveChat: (chat: Chat) => void;
}

export const ChatListItem: React.FC<ChatListItemProps> = ({
  chat,
  isActive,
  isPinned,
  isOnline,
  isTyping,
  unreadCount,
  user,
  setActiveChat
}) => {
  const isGroup = chat.type === 'group';
  const allParticipants = chat.chat_participants || [];
  const otherParticipant = allParticipants.find((p: any) => p.user_id !== user?.id) || allParticipants[0];
  const participantProfile = otherParticipant?.profiles;
  
  const chatName = isGroup ? (chat.name || 'Group') : (participantProfile?.name || 'User');
  
  const lastMsg = chat.last_message;
  const timeRaw = lastMsg ? new Date(lastMsg.created_at) : new Date(chat.created_at);
  const time = lastMsg ? timeRaw.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase() : 'now';

  return (
    <motion.div 
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
        {isOnline && (
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
};
