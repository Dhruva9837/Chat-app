'use client'

import React from 'react'
import { MessageSquare, Star, User, Settings, Bookmark, Phone, Users } from 'lucide-react'
import { useChatStore } from '@/store/chatStore'

export function BottomNav() {
  const { activeView, setActiveView } = useChatStore()

  const navItems = [
    { id: 'chat', icon: MessageSquare, label: 'CHAT' },
    { id: 'favorites', icon: Star, label: 'FAVORITES' },
    { id: 'profile', icon: User, label: 'PROFILE' },
    { id: 'settings', icon: Settings, label: 'SETTINGS' },
  ] as const

  return (
    <div className="md:hidden h-20 bg-surface-lowest border-t border-outline-variant flex items-center justify-around px-4 sticky bottom-0 z-[100] ambient-shadow transition-colors">
      {navItems.map((item) => {
        const isActive = activeView === item.id
        const Icon = item.icon
        return (
          <button 
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={`flex flex-col items-center justify-center space-y-1.5 transition-all group relative py-3 px-5 rounded-2xl ${isActive ? 'bg-primary/10' : 'hover:bg-surface-low/30'}`}
          >
            <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-primary fill-current' : 'text-zinc-400 group-hover:text-primary/50'}`} />
            <span className={`text-[9px] font-black tracking-widest leading-none ${isActive ? 'text-primary' : 'text-zinc-400'}`}>
              {item.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
