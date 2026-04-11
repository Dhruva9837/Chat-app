'use client'

import React from 'react';
import { 
  MessageSquare, 
  Briefcase, 
  Video, 
  Calendar, 
  BarChart2, 
  Bookmark,
  Settings,
  Grid
} from 'lucide-react';
import { useChatStore } from '@/store/chatStore';
import { motion } from 'framer-motion';
import { BrandLogo } from '../BrandLogo';

export const GlobalSidebar = () => {
  const { setActiveView, activeView, setSettingsModalOpen, chats } = useChatStore();
  
  const totalUnread = chats.reduce((acc, chat) => acc + (chat.unread_count || 0), 0);

  const navItems = [
    { icon: MessageSquare, label: 'All chats', id: 'chat' },
    { icon: Briefcase, label: 'Work', id: 'groups' },
    { icon: Calendar, label: 'Calendar', id: 'calendar' },
    { icon: Bookmark, label: 'Saved', id: 'favorites' },
  ];

  return (
    <div className="hidden md:flex w-[80px] h-[100vh] noir-sidebar-left flex-col items-center py-8 z-30 shrink-0 select-none">
      {/* Brand Logo */}
      <div 
        className="mb-10 cursor-pointer"
        onClick={() => setActiveView('chat')}
      >
        <BrandLogo collapsed />
      </div>

      {/* Primary Navigation */}
      <nav className="flex-1 flex flex-col gap-8 w-full items-center">
        {navItems.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button 
              key={item.id}
              onClick={() => setActiveView(item.id as any)}
              className={`group relative p-3 rounded-2xl transition-all duration-300 ${
                isActive 
                  ? 'text-white' 
                  : 'text-text-muted hover:text-white'
              }`}
            >
              <item.icon size={22} strokeWidth={2.5} />
              
              {/* Active Indicator Dot (Optional or Badge) */}
              {item.id === 'chat' && totalUnread > 0 && (
                <div className="absolute top-2 right-2 min-w-[16px] h-4 bg-noir-accent text-[9px] font-black flex items-center justify-center rounded-full text-white border-2 border-surface-lowest px-1">
                  {totalUnread > 99 ? '99+' : totalUnread}
                </div>
              )}

              {/* Tooltip */}
              <span className="absolute left-20 px-3 py-2 bg-noir-surface text-white text-[10px] font-black uppercase tracking-widest rounded-xl opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 whitespace-nowrap pointer-events-none z-50 border border-outline-variant shadow-2xl">
                {item.label}
              </span>

              {isActive && (
                <motion.div 
                  layoutId="activeNav"
                  className="absolute left-[-10px] top-1/2 -translate-y-1/2 w-1.5 h-6 bg-white rounded-r-full"
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="mt-auto flex flex-col gap-6 items-center">
        <button 
           onClick={() => setSettingsModalOpen(true)}
           className="p-3 text-text-muted hover:text-white transition-all duration-200 group relative"
        >
          <Settings size={22} strokeWidth={2.5} />
        </button>
        
        <div className="flex flex-col items-center">
            <span className="text-[10px] font-black text-text-muted uppercase tracking-widest leading-none mb-1">chats</span>
            <div className="w-1.5 h-1.5 bg-text-muted rounded-full opacity-30" />
        </div>
      </div>
    </div>
  );
};
