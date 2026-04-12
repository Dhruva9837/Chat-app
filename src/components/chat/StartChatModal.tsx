'use client'

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, User, MessageSquare } from 'lucide-react';
import { useChatStore } from '@/store/chatStore';
import { getAvatarUrl } from '@/lib/utils';

export const StartChatModal = () => {
  const { isStartChatModalOpen, setIsStartChatModalOpen, friends, startPrivateChat } = useChatStore();

  if (!isStartChatModalOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-md bg-surface-lowest border border-outline-variant rounded-[2.5rem] shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="px-8 pt-8 pb-4 flex items-center justify-between">
            <h3 className="text-xl font-display font-black text-white tracking-tight flex items-center gap-2">
              <MessageSquare size={20} className="text-noir-accent" />
              New Conversation
            </h3>
            <button 
              onClick={() => setIsStartChatModalOpen(false)}
              className="w-10 h-10 rounded-full bg-surface-high flex items-center justify-center text-text-muted hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Search Placeholder */}
          <div className="px-8 mb-4">
            <div className="relative group">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-noir-accent transition-colors" />
              <input 
                type="text" 
                placeholder="Find a friend..." 
                className="w-full pl-11 pr-4 py-3 bg-surface-high rounded-2xl text-sm text-white placeholder:text-text-muted outline-none transition-all focus:ring-1 focus:ring-noir-accent/30"
              />
            </div>
          </div>

          {/* Friends List */}
          <div className="px-4 pb-8 max-h-[400px] overflow-y-auto no-scrollbar">
            {friends.length === 0 ? (
              <div className="py-12 flex flex-col items-center text-center px-8">
                <div className="w-16 h-16 bg-surface-high rounded-full flex items-center justify-center text-text-muted mb-4 opacity-20">
                  <User size={32} />
                </div>
                <p className="text-sm font-bold text-text-muted">No friends found yet.</p>
                <p className="text-xs text-text-muted/60 mt-1">Add friends from the main menu to start chatting!</p>
              </div>
            ) : (
              <div className="grid gap-2">
                {friends.map((f: any) => {
                  const profile = f.friend_profile;
                  if (!profile) return null;
                  
                  return (
                    <button
                      key={f.id}
                      onClick={() => {
                        startPrivateChat(profile.id);
                        setIsStartChatModalOpen(false);
                      }}
                      className="flex items-center gap-4 p-4 hover:bg-surface-high rounded-[1.8rem] transition-all group text-left"
                    >
                      <div className="relative">
                        <img 
                          src={getAvatarUrl(profile)} 
                          alt="" 
                          className="w-12 h-12 rounded-2xl object-cover" 
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-black text-white group-hover:text-noir-accent transition-colors">
                          {profile.name}
                        </h4>
                        <p className="text-xs text-text-muted">@{profile.username || 'user'}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
