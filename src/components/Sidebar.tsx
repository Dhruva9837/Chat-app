'use client'

import React, { useState, useEffect } from 'react'
import { 
  Search, 
  Plus, 
  Users,
  Hash,
  MessageSquare,
  SignalHigh,
  UserPlus,
  Mic,
  Phone,
  Check,
  X as XIcon
} from 'lucide-react'
import { useChatStore } from '@/store/chatStore'
import { useAuthStore } from '@/store/authStore'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import { getAvatarUrl } from '@/lib/utils'

import { VoiceHUD } from './VoiceHUD'
import { NewGroupModal } from './NewGroupModal'
import { FriendRequestsList } from './FriendRequestsList'

export function Sidebar() {
  const { user } = useAuthStore()
  const { 
    chats, 
    activeChat, 
    setActiveChat, 
    onlineUsers,
    typingUsers,
    activeVoiceChannelId,
    leaveVoiceChannel,
    sidebarTab,
    setSidebarTab,
    friendRequests,
    fetchFriends,
    fetchRequests,
    setIsAddFriendModalOpen,
    setNewGroupModalOpen
  } = useChatStore()
  
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (user?.id) {
      fetchFriends(user.id)
      fetchRequests(user.id)
    }
  }, [user?.id, fetchFriends, fetchRequests])

  const filteredChats = chats.filter((chat: any) => {
    // 1. Filter by Tab
    if (sidebarTab === 'message') {
      if (chat.type !== 'private') return false
    } else {
      if (chat.type !== 'group') return false
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

  // Incoming Friend Requests (Incoming)
  const incomingRequests = friendRequests?.filter(req => req.receiver_id === user?.id && req.status === 'pending') || []

  return (
    <div className="w-full md:w-[320px] lg:w-[380px] h-screen bg-surface-lowest flex flex-col shrink-0 overflow-hidden relative border-r border-outline-variant transition-colors duration-500">
      
      {/* Dynamic Header */}
      <div className="bg-primary px-6 pt-10 pb-6 flex flex-col shadow-lg transition-colors duration-500">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-display font-black tracking-widest text-white uppercase truncate pr-4">
              {sidebarTab === 'message' ? 'Messages' : 'Groups'}
            </h2>
            <div className="flex items-center space-x-1">
              {sidebarTab === 'message' ? (
                <button 
                  onClick={() => setIsAddFriendModalOpen(true)}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all active:scale-95 shadow-sm flex items-center space-x-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Add</span>
                </button>
              ) : (
                <button 
                  onClick={() => setNewGroupModalOpen(true)}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all active:scale-95 shadow-sm"
                >
                  <Plus className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {activeVoiceChannelId && (
            <div className="px-4 py-3 bg-white/10 rounded-2xl flex items-center justify-between group mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white shadow-lg animate-speak-pulse">
                    <SignalHigh className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase text-white tracking-widest">Voice Live</span>
                    <span className="text-[9px] font-bold text-white/60 truncate max-w-[100px]">Connected to Audio</span>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <button className="p-2 hover:bg-white/20 rounded-lg text-white transition-all group-hover:scale-110"><Mic className="w-4 h-4" /></button>
                <button className="p-2 hover:bg-red-500/20 rounded-lg text-red-100 transition-all" onClick={leaveVoiceChannel}><Phone className="w-4 h-4 rotate-[135deg]" /></button>
              </div>
            </div>
          )}

          {/* Quick Tabs */}
          <div className="flex items-center space-x-6 mt-2">
            {[
              { id: 'message', label: 'Direct', icon: MessageSquare },
              { id: 'group', label: 'Groups', icon: Users }
            ].map((tab) => {
              const isTabActive = sidebarTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setSidebarTab(tab.id as any)}
                  className={`flex items-center space-x-2 text-[10px] font-black uppercase tracking-[0.2em] pb-2 transition-all border-b-2 ${
                    isTabActive
                      ? 'text-white border-white' 
                      : 'text-white/40 border-transparent hover:text-white/60'
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
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
            placeholder={sidebarTab === 'message' ? "Find or start a conversation" : "Search your groups"}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-low border border-outline-variant rounded-xl py-2.5 pl-11 pr-4 text-sm focus:ring-1 focus:ring-primary/40 focus:bg-white outline-none transition-all placeholder:text-text-muted/60"
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-4 space-y-6 pb-24 no-scrollbar">
        
        {/* Friend Requests Section */}
        {sidebarTab === 'message' && incomingRequests.length > 0 && (
          <FriendRequestsList />
        )}

        {/* Chat List */}
        <div className="space-y-1">
          <div className="px-2 pb-2 mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-text-muted flex items-center justify-between">
            <span>Recent {sidebarTab === 'message' ? 'Chats' : 'Groups'}</span>
            <Plus 
              onClick={() => setNewGroupModalOpen(true)}
              className="w-3 h-3 cursor-pointer hover:text-primary transition-colors" 
            />
          </div>
          <LayoutGroup>
            <AnimatePresence mode="popLayout">
              {filteredChats.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-12 flex flex-col items-center justify-center text-center px-6"
                >
                  <div className="w-16 h-16 bg-surface-low rounded-[2rem] flex items-center justify-center text-text-muted/30 mb-4 border border-outline-variant">
                    {sidebarTab === 'message' ? <MessageSquare className="w-8 h-8" /> : <Users className="w-8 h-8" />}
                  </div>
                  <p className="text-[11px] font-black uppercase tracking-widest text-text-muted">No {sidebarTab}s found</p>
                </motion.div>
              ) : (
                filteredChats.map((chat: any) => {
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
                            src={getAvatarUrl(isGroup ? chat : participantProfile)} 
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
                })
              )}
            </AnimatePresence>
          </LayoutGroup>
        </div>
      </div>

      <VoiceHUD />
      <NewGroupModal />
    </div>
  )
}
