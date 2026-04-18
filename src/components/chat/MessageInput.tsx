'use client'

import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Paperclip, Smile, Send, Mic, X, Loader2 } from 'lucide-react';
import EmojiPicker, { Theme } from 'emoji-picker-react';

interface MessageInputProps {
  newMessage: string;
  isUploading: boolean;
  isBlocked: boolean;
  showEmojiPicker: boolean;
  selectedImage: { file: File, url: string } | null;
  setShowEmojiPicker: (show: boolean) => void;
  setSelectedImage: (img: { file: File, url: string } | null) => void;
  onSendMessage: (e: React.FormEvent) => void;
  onTyping: (val: string) => void;
  onEmojiClick: (emoji: any) => void;
  onImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  newMessage,
  isUploading,
  isBlocked,
  showEmojiPicker,
  selectedImage,
  setShowEmojiPicker,
  setSelectedImage,
  onSendMessage,
  onTyping,
  onEmojiClick,
  onImageSelect
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="px-4 md:px-10 pb-6 md:pb-10">
      {/* Upload Preview & Emoji Picker Container */}
      <div className="relative">
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
                type="button"
                onClick={() => setSelectedImage(null)}
                className="w-10 h-10 rounded-full bg-surface-lowest border border-outline-variant flex items-center justify-center text-text-muted hover:text-rose-500 hover:border-rose-500/50 transition-all"
              >
                <X size={18} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <form 
        onSubmit={onSendMessage}
        className="relative flex items-center bg-surface-low rounded-[1.8rem] md:rounded-[2.2rem] border border-outline-variant group transition-all focus-within:ring-2 focus-within:ring-noir-accent/20 shadow-lg"
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={onImageSelect} 
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
          onChange={(e) => onTyping(e.target.value)}
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
  );
};
