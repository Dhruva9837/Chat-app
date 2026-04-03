'use client'

import React, { useState } from 'react'
import { Search, Edit, Filter, Plus } from 'lucide-react'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import { useChatStore } from '@/store/chatStore'
import { useAuthStore } from '@/store/authStore'
import { NewGroupModal } from './NewGroupModal'

export function Sidebar() {
  const { chats, activeChat, setActiveChat, onlineUsers } = useChatStore()
  const { user } = useAuthStore()
  const [filter, setFilter] = useState('All')
  const [isNewGroupOpen, setIsNewGroupOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const filters = ['All', 'Unread', 'Personal', 'Work']

  return (
    <div className="w-full md:w-[320px] lg:w-[380px] h-screen bg-white flex flex-col shrink-0 overflow-hidden relative border-r border-[#f1f1f1]">
      {/* Header (Inspired by reference) */}
      <div className="p-8 flex items-center justify-between pb-6">
        <button 
          onClick={() => setIsNewGroupOpen(true)}
          className="p-2.5 bg-[#eef2ff] text-primary rounded-xl hover:bg-primary hover:text-white transition-all active:scale-95 shadow-sm flex items-center space-x-2 group"
        >
           <Plus className="w-5 h-5" />
           <span className="text-[10px] font-black uppercase tracking-widest hidden lg:block">Project Node</span>
        </button>
      </div>

      <NewGroupModal isOpen={isNewGroupOpen} onClose={() => setIsNewGroupOpen(false)} />

      {/* Search (Inspired by reference) */}
      <div className="px-8 mb-6">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300 group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search conversations..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#f8faff] rounded-xl py-3.5 pl-11 pr-4 text-sm focus:bg-white focus:ring-1 focus:ring-primary/20 outline-none transition-all placeholder:text-zinc-300 font-sans border border-transparent focus:border-primary/10"
          />
        </div>
      </div>

      {/* Category Pills (Filters) */}
      <div className="px-8 mb-8 flex items-center space-x-2 overflow-x-auto no-scrollbar pb-1">
         {filters.map(f => (
            <button
               key={f}
               onClick={() => setFilter(f)}
               className={`px-6 py-2.5 rounded-full text-xs font-black tracking-tight transition-all shrink-0 ${
                  filter === f 
                    ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                    : 'bg-white text-zinc-400 hover:bg-surface-low border border-[#f1f1f1]'
               }`}
            >
               {f}
            </button>
         ))}
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-4 space-y-3 pb-24 no-scrollbar">
        <LayoutGroup>
          <AnimatePresence mode="popLayout">
            {chats.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-20 px-8 text-center"
              >
                <div className="w-16 h-16 bg-[#f8faff] rounded-[1.5rem] flex items-center justify-center mb-6 border border-black/5">
                   <Edit className="w-6 h-6 text-primary/40" />
                </div>
                <h3 className="font-display font-black text-lg text-gray-900 mb-2 uppercase tracking-tight">No Architecture Found</h3>
                <p className="text-[13px] text-zinc-400 font-sans leading-relaxed mb-8">
                  Your node list is currently empty. Initialize a new professional stream to begin.
                </p>
                <button 
                  onClick={() => setIsNewGroupOpen(true)}
                  className="w-full py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Initialize First Node
                </button>
              </motion.div>
            ) : chats.map((chat: any, index: number) => {
              const isActive = activeChat?.id === chat.id
              
              // Logic for Chat Name and Avatar
              const isGroup = chat.type === 'group'
              const otherParticipant = chat.chat_participants?.find((p: any) => p.user_id !== user?.id)
              const participantProfile = otherParticipant?.profiles
              
              const chatName = chat.name || participantProfile?.name || 'Unknown Architect'
              const chatAvatar = isGroup 
                ? `https://api.dicebear.com/7.x/initials/svg?seed=${chatName}&backgroundColor=00a3ff&fontFamily=monospace&bold=true`
                : participantProfile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${participantProfile?.email || chat.id}`
              
              const lastMsg = chat.last_message
              const unreadCount = chat.unread_count || 0
              const isOnline = onlineUsers[otherParticipant?.user_id || '']
              const isTyping = useChatStore.getState().typingUsers[otherParticipant?.user_id || '']
              
              const time = lastMsg ? new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
              
              const matchesSearch = chatName.toLowerCase().includes(searchQuery.toLowerCase()) || (participantProfile?.email || '').toLowerCase().includes(searchQuery.toLowerCase())
              
              if (filter === 'Unread' && unreadCount === 0) return null
              if (searchQuery && !matchesSearch) return null

              return (
                <motion.button
                  layout
                  key={chat.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ 
                    duration: 0.4, 
                    delay: index * 0.04,
                    ease: [0.16, 1, 0.3, 1] 
                  }}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveChat(chat)}
                  className={`w-full p-4 rounded-[2rem] flex items-center space-x-4 transition-all relative group overflow-hidden ${
                    isActive 
                      ? 'bg-white shadow-xl shadow-primary/5 ring-1 ring-black/5' 
                      : 'hover:bg-white/60'
                  }`}
                >
                  {isActive && (
                    <motion.div 
                      layoutId="active-pill"
                      className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent -z-10" 
                    />
                  )}

                  <div className="relative shrink-0">
                    <div className={`w-14 h-14 rounded-2xl bg-white p-0.5 border-2 transition-all duration-500 group-hover:rotate-3 ${isActive ? 'border-primary/20 scale-110 shadow-md shadow-primary/10' : 'border-white'}`}>
                       <img 
                          src={chatAvatar} 
                          alt="" 
                          className="w-full h-full object-cover rounded-[0.85rem]" 
                       />
                    </div>
                    {isOnline && (
                       <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-secondary-presence rounded-full border-4 border-white z-20 shadow-sm animate-pulse" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex justify-between items-baseline mb-1">
                       <h3 className={`font-display font-black text-[16px] truncate tracking-tighter transition-colors ${isActive ? 'text-primary' : 'text-gray-900 group-hover:text-primary/80'}`}>
                         {chatName}
                       </h3>
                       <span className={`text-[10px] font-black tracking-tight tabular-nums ${isActive ? 'text-primary/60' : 'text-zinc-400'}`}>
                          {time}
                       </span>
                    </div>
                    <p className={`text-[13px] truncate font-sans tracking-tight leading-none transition-all ${unreadCount > 0 ? 'font-black text-gray-900' : 'text-zinc-400 group-hover:text-zinc-500'}`}>
                       {isTyping ? (
                         <span className="text-primary font-black italic animate-pulse">Encoding stream...</span>
                       ) : (
                         lastMsg?.content || "Cipher stream ready"
                       )}
                    </p>
                  </div>

                  {unreadCount > 0 && (
                     <div className="w-6 h-6 bg-primary rounded-xl flex items-center justify-center text-[10px] font-black text-white shadow-lg shadow-primary/30 shrink-0">
                        {unreadCount}
                     </div>
                  )}
                </motion.button>
              )
            })}
          </AnimatePresence>
        </LayoutGroup>
      </div>
    </div>
  )
}
