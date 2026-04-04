'use client'

import React, { useState } from 'react'
import { 
  Search, 
  Plus, 
  MoreVertical, 
  Filter,
  Users,
  Hash,
  MessageSquare,
  Sparkles,
  SignalHigh,
  UserPlus,
  Mic,
  Phone
} from 'lucide-react'
import { useChatStore } from '@/store/chatStore'
import { useAuthStore } from '@/store/authStore'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import { getAvatarUrl } from '@/lib/utils'

import { VoiceHUD } from './VoiceHUD'

export function Sidebar() {
  const { user } = useAuthStore()
  const { 
    chats, 
    activeChat, 
    setActiveChat, 
    activeServerId, 
    onlineUsers,
    typingUsers,
    activeVoiceChannelId,
    voiceParticipants,
    joinVoiceChannel,
    leaveVoiceChannel,
    sidebarTab,
    setSidebarTab
  } = useChatStore()
  const [search, setSearch] = useState('')
  const [isNewGroupOpen, setIsNewGroupOpen] = useState(false)

  const filteredChats = chats.filter((chat: any) => {
    // 1. Filter by active server/home
    if (activeServerId === 'home') {
      if (sidebarTab === 'message') {
        if (chat.type !== 'private') return false
      } else {
        if (chat.type !== 'group') return false
      }
    } else {
      if (chat.id !== activeServerId) return false
    }

    // 2. Filter by search
    if (!search) return true
    const isGroup = chat.type === 'group'
    const allParticipants = chat.chat_participants || []
    const otherParticipant = allParticipants.find((p: any) => p.user_id !== user?.id) || allParticipants[0]
    const participantProfile = otherParticipant?.profiles
    
    const nameToSearch = isGroup ? (chat.name || '') : (participantProfile?.name || '')
    const usernameToSearch = participantProfile?.username || ''
    
    return (
      nameToSearch.toLowerCase().includes(search.toLowerCase()) ||
      usernameToSearch.toLowerCase().includes(search.toLowerCase())
    )
  })

  return (
    <div className="w-full md:w-[320px] lg:w-[380px] h-screen bg-surface-lowest flex flex-col shrink-0 overflow-hidden relative border-r border-outline-variant transition-colors duration-500">
      
      {/* Discord-style Header */}
      <div className="bg-primary px-6 pt-10 pb-6 flex flex-col shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-display font-black tracking-widest text-white uppercase truncate pr-4">
              {activeServerId === 'home' ? 'Direct Messages' : (chats.find(c => c.id === activeServerId)?.name || 'Server')}
            </h2>
            <div className="flex items-center space-x-1">
              {activeServerId === 'home' ? (
                <button 
                  onClick={() => useChatStore.getState().setAddFriendModalOpen(true)}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all active:scale-95 shadow-sm flex items-center space-x-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Add</span>
                </button>
              ) : (
                <button 
                  onClick={() => setIsNewGroupOpen(true)}
                  className="p-2 hover:bg-white/10 rounded-xl text-white transition-all active:scale-95 shrink-0"
                >
                  <Plus className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {activeVoiceChannelId && (
            <div className="px-4 py-3 bg-primary/10 border-t border-primary/20 flex items-center justify-between group">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg animate-speak-pulse">
                    <SignalHigh className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase text-primary tracking-widest">Voice Connected</span>
                    <span className="text-[9px] font-bold text-text-muted truncate max-w-[100px]">General / Nexora Server</span>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <button className="p-2 hover:bg-primary/20 rounded-lg text-primary transition-all group-hover:scale-110"><Mic className="w-4 h-4" /></button>
                <button className="p-2 hover:bg-presence-dnd/20 rounded-lg text-presence-dnd transition-all" onClick={leaveVoiceChannel}><Phone className="w-4 h-4 rotate-[135deg]" /></button>
              </div>
            </div>
          )}

          {/* Quick Tabs (Discord Style) */}
          <div className="flex items-center space-x-6 mt-4">
            {['Message', 'Group'].map((tab) => {
              const tabId = tab.toLowerCase() as 'message' | 'group'
              const isTabActive = (tabId === 'message' && activeServerId === 'home' && sidebarTab === 'message') || 
                                  (tabId === 'group' && (activeServerId !== 'home' || sidebarTab === 'group'))
              
              return (
                <button
                  key={tab}
                  onClick={() => setSidebarTab(tabId)}
                  className={`text-[10px] font-black uppercase tracking-[0.2em] pb-1 transition-all border-b-2 ${
                    isTabActive
                      ? 'text-white border-white' 
                      : 'text-white/40 border-transparent hover:text-white/60'
                  }`}
                >
                  {tab}
                </button>
              )
            })}
          </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 py-4">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder={activeServerId === 'home' ? "Find or start a conversation" : "Search in server"}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-low border border-outline-variant rounded-xl py-2.5 pl-11 pr-4 text-sm focus:ring-1 focus:ring-primary/40 focus:bg-white outline-none transition-all placeholder:text-text-muted/60"
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-4 space-y-6 pb-24 no-scrollbar">
        {/* Text Channels List */}
        <div className="space-y-1">
          <div className="px-2 pb-2 text-[10px] font-black uppercase tracking-[0.2em] text-text-muted flex items-center justify-between">
            <span>{activeServerId === 'home' ? 'Direct Messages' : 'Text Channels'}</span>
            <Plus className="w-3 h-3 cursor-pointer hover:text-primary transition-colors" />
          </div>
          <LayoutGroup>
            <AnimatePresence mode="popLayout">
              {filteredChats.map((chat: any) => {
                const isActive = activeChat?.id === chat.id
                const isGroup = chat.type === 'group'
                const allParticipants = chat.chat_participants || []
                const otherParticipant = allParticipants.find((p: any) => p.user_id !== user?.id) || allParticipants[0]
                const participantProfile = otherParticipant?.profiles
                
                const chatName = isGroup ? (chat.name || 'Group') : (participantProfile?.name || 'User')
                const isSelfChat = !isGroup && otherParticipant?.user_id === user?.id
                const finalChatName = isSelfChat ? `${chatName} (You)` : chatName
                
                const lastMsg = chat.last_message
                const unreadCount = chat.unread_count || 0
                const isTyping = typingUsers[otherParticipant?.user_id || '']
                const time = lastMsg ? new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''

                return (
                  <motion.button
                    layout
                    key={chat.id}
                    onClick={() => setActiveChat(chat)}
                    className={`
                      w-full group relative flex items-center p-3 rounded-2xl transition-all duration-300 active:scale-[0.98]
                      ${isActive ? 'bg-primary shadow-lg shadow-primary/20' : 'hover:bg-surface-low'}
                    `}
                  >
                    {/* Avatar Section */}
                    <div className="relative mr-4 shrink-0">
                      <div className={`
                        w-12 h-12 rounded-2xl overflow-hidden border-2 transition-all duration-500
                        ${isActive ? 'border-white/20' : 'border-outline-variant group-hover:border-primary/20'}
                      `}
                      style={!isActive && participantProfile?.avatar_decoration ? { 
                        borderColor: participantProfile.avatar_decoration,
                        boxShadow: `0 0 16px ${participantProfile.avatar_decoration}40`
                      } : {}}>
                        <img 
                          src={getAvatarUrl(isGroup ? { avatar_url: chat.avatar_url } : participantProfile)} 
                          alt="" 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      {/* Status Dot */}
                      {!isGroup && (
                        <div className={`
                          absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-surface-lowest
                          ${(() => {
                            const status = onlineUsers[otherParticipant?.user_id]?.status || 'offline'
                            if (status === 'online') return 'bg-presence-online'
                            if (status === 'idle') return 'bg-presence-idle'
                            if (status === 'dnd') return 'bg-presence-dnd'
                            return 'bg-presence-offline grayscale opacity-50'
                          })()}
                        `} />
                      )}
                    </div>

                    {/* Info Section */}
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center space-x-1 mb-1 overflow-hidden">
                        {isGroup && (
                          <Hash className={`w-3.5 h-3.5 shrink-0 -ml-0.5 ${isActive ? 'text-white/70' : 'text-text-muted'}`} />
                        )}
                        <h3 className={`font-display font-black text-[15px] truncate uppercase tracking-tight ${isActive ? 'text-white' : 'text-text-main'}`}>
                          {finalChatName}
                        </h3>
                        {!isGroup && !isSelfChat && participantProfile?.username && (
                          <span className={`text-[10px] font-black shrink-0 ${isActive ? 'text-white/60' : 'text-primary/60'}`}>@{participantProfile.username}</span>
                        )}
                      </div>
                      
                      <p className={`text-[12px] truncate transition-all ${isActive ? 'text-white/80' : 'text-text-muted'}`}>
                         {isTyping ? (
                           <span className={isActive ? 'text-white font-bold italic' : 'text-primary font-bold italic'}>Typing...</span>
                         ) : lastMsg ? (
                           lastMsg.content
                         ) : 'No messages yet'}
                      </p>
                    </div>

                    {/* Meta Section */}
                    <div className="ml-2 flex flex-col items-end shrink-0">
                      <span className={`text-[10px] font-bold mb-2 ${isActive ? 'text-white/60' : 'text-text-muted'}`}>
                        {time}
                      </span>
                      {unreadCount > 0 && (
                        <span className="bg-presence-dnd text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                  </motion.button>
                )
              })}
            </AnimatePresence>
          </LayoutGroup>
        </div>

        {/* Voice Channels Section (Discord Logic) */}
        {activeServerId !== 'home' && (
          <div className="space-y-1">
            <div className="px-2 pb-2 text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">
              Voice Channels
            </div>
            {chats.filter(c => c.type === 'group' && c.id === activeServerId).map(channel => (
              <div key={`voice-${channel.id}`} className="space-y-1">
                <button 
                  onClick={() => joinVoiceChannel(channel.id)}
                  className={`w-full flex items-center p-2.5 rounded-xl transition-all group ${activeVoiceChannelId === channel.id ? 'bg-presence-online/10 text-presence-online shadow-sm' : 'hover:bg-surface-low text-text-muted hover:text-text-main'}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 transition-colors ${activeVoiceChannelId === channel.id ? 'bg-presence-online text-white' : 'bg-surface-low text-text-muted group-hover:bg-primary group-hover:text-white'}`}>
                    <SignalHigh className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-sm tracking-tight truncate uppercase">General Voice</span>
                </button>
                
                <div className="space-y-1 ml-4 mt-1 border-l-2 border-outline-variant/30 pl-4 py-1">
                    {voiceParticipants[channel.id]?.map((participantId: string) => (
                      <div key={participantId} className="flex items-center space-x-2 group/vp py-1">
                        <div className="w-6 h-6 rounded-lg overflow-hidden border border-outline-variant animate-speak-pulse">
                          <img src={getAvatarUrl(null)} alt="" className="w-full h-full object-cover" />
                        </div>
                        <span className="text-[10px] font-bold text-text-muted group-hover:text-primary transition-colors">
                          {onlineUsers[participantId]?.name || 'Explorer'}
                        </span>
                      </div>
                    ))}
                  </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Voice HUD Overlay */}
      <VoiceHUD />
    </div>
  )
}
