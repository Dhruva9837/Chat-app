'use client'

import React, { useState } from 'react'
import { 
  MessageSquare, 
  Settings, 
  Plus, 
  Compass, 
  LayoutGrid, 
  Gamepad2, 
  Users
} from 'lucide-react'
import { useChatStore } from '@/store/chatStore'
import { useAuthStore } from '@/store/authStore'
import { motion, AnimatePresence } from 'framer-motion'
import { getAvatarUrl } from '@/lib/utils'
import { StatusPicker } from './StatusPicker'

export function GlobalSidebar() {
  const { 
    activeServerId, 
    setActiveServerId, 
    chats, 
    setActiveChat, 
    setCreateServerModalOpen,
    setSettingsModalOpen
  } = useChatStore()
  const { profile } = useAuthStore()
  const [isStatusPickerOpen, setIsStatusPickerOpen] = useState(false)

  const servers = chats.filter((c: any) => c.type === 'group')

  return (
    <div className="w-[84px] h-screen bg-surface-low flex flex-col items-center py-6 border-r border-outline-variant shrink-0 no-scrollbar transition-colors duration-500">
      
      {/* Home Button (Direct Messages) */}
      <div className="relative group mb-6">
        <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-2 bg-text-main rounded-r-full transition-all duration-300 ${activeServerId === 'home' ? 'h-10' : 'group-hover:h-5'}`} />
        <button
          onClick={() => {
            setActiveServerId('home')
            setActiveChat(null)
          }}
          className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-sm ${
            activeServerId === 'home' 
              ? 'bg-primary text-white shadow-xl shadow-primary/20 rotate-0' 
              : 'bg-white text-text-muted hover:bg-primary hover:text-white hover:rounded-xl'
          }`}
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      </div>

      <div className="w-[32px] h-px bg-outline-variant mb-6" />

      {/* Servers List */}
      <div className="flex-1 w-full overflow-y-auto no-scrollbar space-y-4 px-3 flex flex-col items-center">
        {servers.map((server: any) => {
          const isActive = activeServerId === server.id
          return (
            <div key={server.id} className="relative group w-full flex justify-center">
              <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-0 bg-text-main rounded-r-full transition-all duration-300 ${isActive ? 'h-10' : 'group-hover:h-5'}`} />
              <button
                onClick={() => {
                  setActiveServerId(server.id)
                  setActiveChat(server) // Auto-select server's main chat
                }}
                className={`w-14 h-14 rounded-[1.8rem] overflow-hidden transition-all duration-500 relative ${
                  isActive 
                    ? 'rounded-2xl border-2 border-primary shadow-xl shadow-primary/10' 
                    : 'hover:rounded-2xl border-2 border-transparent'
                }`}
              >
                <img 
                  src={getAvatarUrl(server)} 
                  alt={server.name} 
                  className="w-full h-full object-cover" 
                />
              </button>
              
              {/* Server Notification Dot (Simulated) */}
              {server.unread_count > 0 && !isActive && (
                 <div className="absolute top-0 right-1 w-4 h-4 bg-presence-dnd border-4 border-surface-low rounded-full" />
              )}
            </div>
          )
        })}

        {/* Action Buttons */}
        <button 
          onClick={() => setCreateServerModalOpen(true)}
          className="w-14 h-14 bg-white rounded-[1.8rem] flex items-center justify-center text-primary hover:bg-primary hover:text-white hover:rounded-2xl transition-all duration-500 shadow-sm border border-outline-variant"
        >
          <Plus className="w-6 h-6" />
        </button>
        
        <button className="w-14 h-14 bg-white rounded-[1.8rem] flex items-center justify-center text-presence-online hover:bg-presence-online hover:text-white hover:rounded-2xl transition-all duration-500 shadow-sm border border-outline-variant">
          <Compass className="w-6 h-6" />
        </button>
      </div>

      <div className="w-[32px] h-px bg-outline-variant my-4" />

      {/* Bottom Profile & Settings */}
      <div className="flex flex-col items-center space-y-4 px-3">
        <button 
          onClick={() => setSettingsModalOpen(true)}
          className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-text-muted hover:bg-primary hover:text-white transition-all group shadow-sm border border-outline-variant"
        >
          <Settings className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" />
        </button>

        <div className="relative group cursor-pointer">
            <div 
              onClick={() => setIsStatusPickerOpen(!isStatusPickerOpen)}
              className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-outline-variant group-hover:border-primary transition-all relative"
              style={profile?.avatar_decoration ? { 
                borderColor: profile.avatar_decoration,
                boxShadow: `0 0 18px ${profile.avatar_decoration}50`
              } : {}}
            >
              <img src={getAvatarUrl(profile)} alt="" className="w-full h-full object-cover" />
            </div>
            {/* User Status Ring */}
            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-4 border-surface-low group-hover:border-white transition-all
              ${(() => {
                const status = profile?.status || 'online'
                if (status === 'online') return 'bg-presence-online'
                if (status === 'idle') return 'bg-presence-idle'
                if (status === 'dnd') return 'bg-presence-dnd'
                return 'bg-presence-offline border-presence-offline opacity-50'
              })()}
            `} />
            
            <StatusPicker isOpen={isStatusPickerOpen} onClose={() => setIsStatusPickerOpen(false)} />
        </div>
      </div>
    </div>
  )
}
