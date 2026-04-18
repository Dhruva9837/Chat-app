'use client'

import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, CheckCheck } from 'lucide-react';
import { Message, Profile } from '@/types/database';
import { getAvatarUrl } from '@/lib/utils';

interface MessageBubbleProps {
  msg: Message;
  isMe: boolean;
  isGroup: boolean;
  user: any;
  profile: Profile | null;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  msg,
  isMe,
  isGroup,
  user,
  profile
}) => {
  const time = new Date(msg.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-2 md:gap-3 max-w-[90%] md:max-w-[85%] ${isMe ? 'ml-auto flex-row-reverse' : ''}`}
    >
      {/* Profile Image */}
      <div className="shrink-0 mt-auto mb-1">
        <div className="w-8 h-8 md:w-10 md:h-10 rounded-[1.2rem] overflow-hidden bg-surface-low border border-outline-variant">
          <img 
            src={getAvatarUrl(isMe ? (profile || user) : msg.sender_profile)} 
            alt="" 
            className="w-full h-full object-cover" 
          />
        </div>
      </div>
      
      <div className={`flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
        {isGroup && !isMe && (
          <span className="text-[10px] md:text-[11px] font-black text-white/50 tracking-wide ml-1">
             {msg.sender_profile?.name}
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
};
