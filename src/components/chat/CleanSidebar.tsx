'use client'

import React, { useState } from 'react';
import { 
  MessageSquare, 
  Users as UsersIcon, 
  Phone, 
  Eye, 
  Clock, 
  BarChart2, 
  Video,
  Settings,
  User,
  MoreHorizontal
} from 'lucide-react';
import Image from 'next/image';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { getAvatarUrl } from '@/lib/utils';
import { StatusPicker } from '../StatusPicker';

export const CleanSidebar = () => {
  const { 
    setActiveChat, 
    setActiveView,
    activeView,
    setSettingsModalOpen,
    theme,
    setTheme
  } = useChatStore();
  const { profile } = useAuthStore();
  const [isStatusPickerOpen, setIsStatusPickerOpen] = useState(false);

  const navItems = [
    { icon: MessageSquare, label: 'Chat', id: 'chat' },
    { icon: UsersIcon, label: 'Groups', id: 'groups' },
  ];

  const toggleTheme = () => {
    const themes: ('light' | 'dark' | 'midnight')[] = ['light', 'dark', 'midnight'];
    const currentIndex = themes.indexOf(theme as any);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  return (
    <div className="w-20 h-full bg-surface-lowest flex flex-col items-center py-8 border-r border-outline-variant clean-sidebar-shadow z-20 shrink-0 transition-all duration-300">
      {/* Logo */}
      <div 
        onClick={() => {
          setActiveView('chat');
          setActiveChat(null);
        }}
        className="mb-12 relative w-10 h-10 group cursor-pointer"
      >
        <div className="absolute inset-0 bg-mint-500/10 rounded-xl group-hover:bg-mint-500/20 transition-all"></div>
        <Image 
          src="/logo.png" 
          alt="Nexora Logo" 
          width={40} 
          height={40}
          className="rounded-xl"
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-6">
        {navItems.map((item, index) => {
          const isActive = activeView === item.id || (item.id === 'chat' && activeView === 'chat');
          return (
            <button 
              key={index}
              onClick={() => {
                setActiveView(item.id as any);
                if (item.id === 'chat') setActiveChat(null);
              }}
              className={`p-3 rounded-2xl transition-all duration-200 group relative ${
                isActive 
                  ? 'bg-mint-500/10 text-mint-500 shadow-sm' 
                  : 'text-text-muted hover:bg-surface-low hover:text-text-main'
              }`}
            >
              <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-mint-500 rounded-r-full shadow-lg shadow-mint-500/50"></div>
              )}
              
              <span className="absolute left-16 px-2 py-1 bg-surface-highest text-text-main text-[11px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 whitespace-nowrap pointer-events-none z-50 border border-outline-variant shadow-xl">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Profile & Settings */}
      <div className="mt-auto flex flex-col gap-6 items-center">
        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className="p-3 text-text-muted hover:text-mint-500 hover:bg-surface-low rounded-2xl transition-all duration-200 group relative"
        >
          {theme === 'light' ? <Eye size={22} /> : theme === 'midnight' ? <Eye size={22} className="text-indigo-400" /> : <Eye size={22} />}
          <span className="absolute left-16 px-2 py-1 bg-surface-highest text-text-main text-[11px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 whitespace-nowrap pointer-events-none z-50 border border-outline-variant shadow-xl">
            Theme: {theme}
          </span>
        </button>

        <button 
          onClick={() => setSettingsModalOpen(true)}
          className="p-3 text-text-muted hover:text-mint-500 hover:bg-surface-low rounded-2xl transition-all duration-200 group relative"
        >
          <Settings size={22} />
          <span className="absolute left-16 px-2 py-1 bg-surface-highest text-text-main text-[11px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 whitespace-nowrap pointer-events-none z-50 border border-outline-variant shadow-xl">
            Settings
          </span>
        </button>
        
        <div className="relative group cursor-pointer">
          <div 
            onClick={() => setIsStatusPickerOpen(!isStatusPickerOpen)}
            className="w-11 h-11 rounded-2xl overflow-hidden border-2 border-outline-variant shadow-lg hover:ring-2 hover:ring-mint-500/20 transition-all"
          >
            <img 
              src={getAvatarUrl(profile)} 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-surface-lowest
            ${(() => {
              const status = profile?.status || 'online'
              if (status === 'online') return 'bg-presence-online'
              if (status === 'idle') return 'bg-presence-idle'
              if (status === 'dnd') return 'bg-presence-dnd'
              return 'bg-presence-offline grayscale opacity-50'
            })()}
          `} />
          <StatusPicker isOpen={isStatusPickerOpen} onClose={() => setIsStatusPickerOpen(false)} />
        </div>
      </div>
    </div>
  );
};
