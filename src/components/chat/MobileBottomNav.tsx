'use client'

import React from 'react'
import { 
  MessageSquare, 
  Briefcase, 
  Calendar, 
  Bookmark,
  Settings
} from 'lucide-react'
import { useChatStore } from '@/store/chatStore'
import { motion } from 'framer-motion'

export const MobileBottomNav = () => {
  const { setActiveView, activeView, chats, activeChat, setSettingsModalOpen } = useChatStore()
  
  const totalUnread = chats.reduce((acc, chat) => acc + (chat.unread_count || 0), 0)

  // Hide the navigation entirely if a user is actively inside a chat room
  if (activeChat && activeView === 'chat') return null

  const navItems = [
    { icon: MessageSquare, label: 'Chats', id: 'chat' },
    { icon: Briefcase, label: 'Work', id: 'groups' },
    { icon: Calendar, label: 'Calendar', id: 'calendar' },
    { icon: Settings, label: 'Settings', id: 'settings', action: () => setSettingsModalOpen(true) }
  ]

  return (
    <div className="fixed bottom-0 left-0 w-full h-[72px] bg-surface-lowest/90 backdrop-blur-xl border-t border-outline-variant flex items-center justify-around px-2 z-40 md:hidden pb-safe">
      {navItems.map((item) => {
        const isActive = activeView === item.id && !item.action
        return (
          <button 
            key={item.id}
            onClick={() => item.action ? item.action() : setActiveView(item.id as any)}
            className={`relative flex flex-col items-center justify-center w-14 h-12 transition-all ${
              isActive ? 'text-noir-accent' : 'text-text-muted hover:text-white'
            }`}
          >
            <item.icon size={22} strokeWidth={isActive ? 3 : 2.5} className="mb-1" />
            <span className={`text-[9px] font-bold tracking-wide ${isActive ? 'text-noir-accent' : 'text-text-muted'}`}>
              {item.label}
            </span>

            {/* Unread Badge */}
            {item.id === 'chat' && totalUnread > 0 && (
              <div className="absolute top-0 right-2 min-w-[14px] h-3.5 bg-rose-500 text-[8px] font-black flex items-center justify-center rounded-full text-white border border-surface-lowest px-1">
                {totalUnread > 99 ? '99+' : totalUnread}
              </div>
            )}

            {/* Active Indication Dot underneath */}
            {isActive && (
              <motion.div 
                layoutId="mobileActiveTab"
                className="absolute -bottom-1 w-1 h-1 bg-noir-accent rounded-full"
              />
            )}
          </button>
        )
      })}
    </div>
  )
}
