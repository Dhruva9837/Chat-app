'use client'

import React from 'react'
import { MessageSquare, Star, User, Settings, Bookmark, Phone, Users } from 'lucide-react'
import { useChatStore } from '@/store/chatStore'

export function BottomNav() {
  const { activeView, setActiveView } = useChatStore()

  const navItems = [
    { id: 'chat', icon: MessageSquare, label: 'CHATS' },
    { id: 'calls', icon: Phone, label: 'CALLS' },
    { id: 'contacts', icon: Users, label: 'NETWORK' },
    { id: 'saved', icon: Bookmark, label: 'SAVED' },
  ] as const

  return (
    <div className="md:hidden h-20 bg-white border-t border-[#f1f1f1] flex items-center justify-around px-4 sticky bottom-0 z-[100] ambient-shadow">
      {navItems.map((item) => {
        const isActive = activeView === item.id
        const Icon = item.icon
        return (
          <button 
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={`flex flex-col items-center justify-center space-y-1.5 transition-all group relative py-3 px-6 rounded-2xl ${isActive ? 'bg-[#eef2ff]' : 'hover:bg-surface-low/30'}`}
          >
            <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-primary' : 'text-zinc-300 group-hover:text-primary/50'}`} />
            <span className={`text-[9px] font-black tracking-widest leading-none ${isActive ? 'text-primary' : 'text-zinc-400'}`}>
              {item.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
