'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { 
  Send, 
  Smile, 
  Phone, 
  Video, 
  Info, 
  MoreVertical, 
  Plus, 
  Mic, 
  Paperclip, 
  Check, 
  Search, 
  FileText, 
  UserPlus, 
  Sparkles, 
  Users, 
  Hash,
  Copy,
  Trash2,
  Heart,
  Flame,
  ThumbsUp,
  Laugh,
  ArrowLeft,
  ImageIcon,
  X,
  Loader2,
  MessageSquare,
  SquarePen,
  Circle
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useChatStore } from '@/store/chatStore'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { getAvatarUrl, formatTime } from '@/lib/utils'

export function ChatWindow() {
  const { 
    activeChat, 
    setActiveChat, 
    messages, 
    onlineUsers, 
    typingUsers, 
    showDetailSidebar, 
    toggleDetailSidebar, 
    fontSize, 
    setIsAddFriendModalOpen 
  } = useChatStore()
  const { user, profile } = useAuthStore()
  const [newMessage, setNewMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [activeTab, setActiveTab] = useState<'chat' | 'pins' | 'threads'>('chat')
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  
  // Local reactions for the demo (since DB schema update is restricted)
  const [localReactions, setLocalReactions] = useState<Record<string, any>>({})

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  if (!activeChat) {
    const onlineCount = Object.values(onlineUsers || {}).filter(u => (u as any).status === 'online').length

    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#f8f9fc] p-8 text-center animate-in fade-in duration-700 relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none" 
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #000 1px, transparent 0)', backgroundSize: '40px 40px' }} 
        />
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative mb-12"
        >
          {/* Central Icon Container */}
          <div className="w-48 h-48 bg-white/80 backdrop-blur-xl rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-white flex items-center justify-center relative">
            <div className="w-24 h-24 bg-primary rounded-[2rem] flex items-center justify-center shadow-[0_15px_30px_rgba(35,116,225,0.3)] relative">
               <MessageSquare className="w-12 h-12 text-white fill-white/10" />
               
               {/* Plus Overlay */}
               <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-2xl shadow-lg border-4 border-[#f8f9fc] flex items-center justify-center">
                  <Plus className="w-5 h-5 text-primary stroke-[3]" />
               </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="space-y-4 max-w-sm"
        >
          <h2 className="text-4xl font-display font-black tracking-tight text-[#1a1c1e]">Quiet in here...</h2>
          <p className="text-[#6c727a] text-lg font-medium leading-relaxed">
            Start a conversation with your team to see your message history appear here.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          className="mt-12 flex flex-col items-center space-y-6"
        >
           <button 
             onClick={() => setIsAddFriendModalOpen(true)}
             className="flex items-center space-x-3 px-10 py-5 bg-primary text-white rounded-[2rem] font-bold text-lg shadow-[0_15px_30px_rgba(35,116,225,0.3)] hover:scale-105 active:scale-95 transition-all group"
           >
             <SquarePen className="w-6 h-6 group-hover:rotate-12 transition-transform" />
             <span>Start New Chat</span>
           </button>
           
           <button 
              key="browse-contacts-link"
              className="text-primary font-bold text-lg hover:underline transition-all"
           >
             Browse Contacts
           </button>
        </motion.div>

        {/* Presence Indicator Pill */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="absolute bottom-12"
        >
          <div className="flex items-center space-x-3 px-6 py-3 bg-white rounded-full shadow-sm border border-[#eee] text-[12px] font-black uppercase tracking-widest text-[#444]">
            <Circle className="w-2.5 h-2.5 fill-[#23a55a] text-[#23a55a]" />
            <span>{onlineCount} CONTACTS ONLINE</span>
          </div>
        </motion.div>
      </div>
    )
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() && !pendingFile) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let imageUrl = null
    if (pendingFile) {
      const fileName = `${Date.now()}-${pendingFile.name}`
      const { data, error } = await supabase.storage
        .from('chat-media')
        .upload(fileName, pendingFile)
      
      if (!error) {
        const { data: { publicUrl } } = supabase.storage
          .from('chat-media')
          .getPublicUrl(fileName)
        imageUrl = publicUrl
      }
    }

    const { error } = await supabase
      .from('messages')
      .insert({
        content: newMessage,
        chat_id: activeChat.id,
        sender_id: user.id,
        image_url: imageUrl
      })

    if (!error) {
      setNewMessage('')
      setPendingFile(null)
      setImagePreview(null)
    }
  }

  const addReaction = (messageId: string, emoji: string) => {
    setLocalReactions(prev => ({
      ...prev,
      [messageId]: {
        ...prev[messageId],
        [emoji]: (prev[messageId]?.[emoji] || 0) + 1
      }
    }))
  }

  const otherParticipant = activeChat.chat_participants?.find(p => p.user_id !== user?.id)?.profiles
  const isGroup = activeChat.type === 'group'
  const chatName = isGroup ? activeChat.name : otherParticipant?.name
  const chatTypingUsers = Object.entries(typingUsers || {}).filter(([id, typing]) => typing && id !== user?.id)

  return (
    <div className="flex-1 flex overflow-hidden bg-surface-lowest relative font-sans">
      <div className="flex-1 flex flex-col min-w-0 border-r border-outline-variant/30">
        {/* Chat Header */}
        <header className="h-[84px] bg-surface-lowest/80 backdrop-blur-xl border-b border-outline-variant flex items-center justify-between px-8 z-30 shrink-0">
          <div className="flex items-center space-x-5">
            <div className="relative group">
              <div className="w-14 h-14 rounded-2xl overflow-hidden ring-2 ring-outline-variant/20 hover:ring-primary transition-all duration-500 shadow-sm border border-white">
                <img src={getAvatarUrl(isGroup ? activeChat : otherParticipant)} alt="" className="w-full h-full object-cover" />
              </div>
              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-4 border-surface-low 
                ${isGroup ? 'bg-primary' : (onlineUsers[otherParticipant?.id || '']?.status === 'online' ? 'bg-presence-online' : 'bg-presence-offline')}
              `} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-display font-black text-xl tracking-tighter text-text-main leading-none uppercase tracking-widest flex items-center">
                  {isGroup && <Hash className="w-5 h-5 mr-1.5 text-primary" />}
                  {chatName}
                </h2>
                {isGroup && <span className="px-2 py-0.5 bg-primary/10 text-primary text-[8px] font-black rounded-md tracking-widest uppercase">Verified</span>}
              </div>
              <p className="text-[10px] font-black text-text-muted mt-1 uppercase tracking-widest flex items-center">
                {isGroup ? <><Users className="w-3 h-3 mr-1" /> {activeChat.chat_participants?.length || 0} Members</> : (onlineUsers[otherParticipant?.id || '']?.status === 'online' ? 'Connected to Neural Grid' : 'Standard Transmission')}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button className="w-12 h-12 flex items-center justify-center text-text-muted hover:bg-primary/5 hover:text-primary rounded-xl transition-all">
              <Phone className="w-5 h-5" />
            </button>
            <button className="w-12 h-12 flex items-center justify-center text-text-muted hover:bg-primary/5 hover:text-primary rounded-xl transition-all">
              <Video className="w-5 h-5" />
            </button>
            <button 
              onClick={toggleDetailSidebar}
              className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all ${showDetailSidebar ? 'bg-primary text-white' : 'text-text-muted hover:bg-primary/5 hover:text-primary'}`}
            >
              <Info className="w-5 h-5" />
            </button>
            <button className="w-12 h-12 flex items-center justify-center text-text-muted hover:bg-primary/5 hover:text-primary rounded-xl transition-all">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Messages Content Area */}
        <div className="flex-1 flex overflow-hidden">
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-8 py-10 space-y-8 no-scrollbar scroll-smooth">
            {messages.map((msg, i) => {
              const isOwn = msg.sender_id === user?.id
              const showAvatar = i === 0 || messages[i-1].sender_id !== msg.sender_id
              const reactions = localReactions[msg.id] || {}

              return (
                <motion.div 
                  initial={{ opacity: 0, x: isOwn ? 10 : -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={msg.id} 
                  className={`flex group/msg relative ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  {/* Reaction Bar (Hover Only) */}
                  <div className={`absolute top-0 z-10 transition-all opacity-0 group-hover/msg:opacity-100 ${isOwn ? 'right-full mr-4' : 'left-full ml-4'} flex bg-surface-lowest border border-outline-variant rounded-xl shadow-xl p-1 space-x-1`}>
                    <ReactionButton emoji="🔥" onClick={() => addReaction(msg.id, '🔥')} />
                    <ReactionButton emoji="❤️" onClick={() => addReaction(msg.id, '❤️')} />
                    <ReactionButton emoji="👍" onClick={() => addReaction(msg.id, '👍')} />
                    <ReactionButton emoji="😂" onClick={() => addReaction(msg.id, '😂')} />
                    <div className="w-px h-4 bg-outline-variant self-center" />
                    <ReactionButton icon={MoreVertical} onClick={() => {}} />
                  </div>

                  <div className={`max-w-[70%] flex ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                    {showAvatar && !isOwn && (
                      <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 mt-1 shadow-md mr-3 border-2 transition-all border-outline-variant/10"
                        style={msg.sender_profile?.avatar_decoration ? { 
                          borderColor: msg.sender_profile.avatar_decoration,
                          boxShadow: `0 0 12px ${msg.sender_profile.avatar_decoration}40`
                        } : {}}
                      >
                        <img src={getAvatarUrl(msg.sender_profile)} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} ${!showAvatar && !isOwn ? 'ml-13' : ''}`}>
                      {showAvatar && (
                        <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-1.5 flex items-center">
                          {isOwn ? 'You' : (msg.sender_profile?.name || 'Agent')}
                          <span className="mx-2 w-1 h-1 bg-outline-variant rounded-full" />
                          {formatTime(msg.created_at)}
                        </span>
                      )}
                      
                      <div className={`relative px-5 py-3.5 rounded-[1.8rem] shadow-sm transform transition-transform active:scale-[0.98]
                        ${isOwn 
                          ? 'bg-primary text-white rounded-tr-none font-bold' 
                          : 'bg-surface-low text-text-main rounded-tl-none font-medium border border-outline-variant/10'}`}>
                        <div style={{ fontSize: `${fontSize}px` }}>
                          {msg.content}
                        </div>
                        <Check className={`w-3 h-3 absolute bottom-2 right-3 opacity-40 ${isOwn ? 'text-white' : 'text-primary'}`} />
                        
                        {/* Render Reactions */}
                        <div className={`absolute -bottom-4 flex space-x-1 ${isOwn ? 'right-0' : 'left-0'}`}>
                            {Object.entries(reactions).map(([emoji, count]: any) => (
                                <div key={emoji} className="bg-surface-lowest border border-outline-variant px-1.5 py-0.5 rounded-full text-[10px] shadow-sm flex items-center">
                                    <span>{emoji} {count}</span>
                                </div>
                            ))}
                        </div>
                      </div>
                      
                      {msg.image_url && (
                        <div className="mt-3 rounded-2xl overflow-hidden shadow-sm border border-outline-variant/30">
                          <img src={msg.image_url} alt="Shared" className="max-w-[300px] h-auto" />
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Input Dock Area */}
        <div className="px-8 pb-8 pt-4">
          <form onSubmit={handleSendMessage} className="relative group">
            {/* Input Overlay with gradient border */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 via-transparent to-primary/20 rounded-[2rem] opacity-0 group-focus-within:opacity-100 transition-opacity blur-[8px]" />
            
            <div className="relative bg-surface-lowest border border-outline-variant rounded-[2.5rem] p-3 flex items-center shadow-[0_10px_40px_rgba(0,0,0,0.03)] focus-within:shadow-xl focus-within:border-primary/30 transition-all">
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-12 h-12 flex items-center justify-center text-text-muted hover:bg-primary hover:text-white rounded-full transition-all"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setPendingFile(file)
                    setImagePreview(URL.createObjectURL(file))
                  }
                }}
              />
              
              <div className="flex-1 px-4">
                {imagePreview && (
                  <div className="mb-2 relative w-20 h-20">
                    <img src={imagePreview} className="w-full h-full object-cover rounded-xl" />
                    <button onClick={() => { setImagePreview(null); setPendingFile(null); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><X className="w-3 h-3" /></button>
                  </div>
                )}
                <input 
                  type="text"
                  placeholder={`Transmit message to ${chatName}...`}
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value)
                    // Typing logic could go here
                  }}
                  className="w-full bg-transparent border-none outline-none text-text-main placeholder-text-muted font-medium text-lg"
                />
              </div>

              <div className="flex items-center space-x-2 mr-2">
                <button type="button" className="w-11 h-11 flex items-center justify-center text-text-muted hover:bg-surface-low rounded-full transition-all">
                  <Smile className="w-5 h-5" />
                </button>
                <div className="w-px h-6 bg-outline-variant" />
                <button 
                  type="submit"
                  disabled={!newMessage.trim() && !pendingFile}
                  className="w-11 h-11 bg-primary text-white rounded-full flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-110 active:scale-95 disabled:opacity-50 disabled:grayscale transition-all"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </form>
          <div className="mt-4 px-6 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">
             <div className="flex items-center space-x-4">
                <div className="flex items-center">
                    <Sparkles className="w-3 h-3 mr-1.5 text-primary" />
                    <span>Neural Link Active</span>
                </div>
                {chatTypingUsers.length > 0 && (
                   <span className="text-primary animate-pulse">{chatTypingUsers[0][0].split('-')[0]} is typing...</span>
                )}
             </div>
             <div>
                PGP 2048 Bit Encryption
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ReactionButton({ icon: Icon, emoji, onClick }: { icon?: any, emoji?: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="p-1.5 hover:bg-primary/10 rounded-lg text-lg transition-all"
    >
      {Icon ? <Icon className="w-4 h-4 text-text-muted" /> : emoji}
    </button>
  )
}
