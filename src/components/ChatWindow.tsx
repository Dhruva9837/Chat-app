'use client'

import React, { useState, useEffect, useRef } from 'react'
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
  Laugh
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useChatStore } from '@/store/chatStore'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { getAvatarUrl, formatTime } from '@/lib/utils'

export function ChatWindow() {
  const { activeChat, messages, onlineUsers, typingUsers, showDetailSidebar, toggleDetailSidebar, fontSize } = useChatStore()
  const { user, profile } = useAuthStore()
  const [newMessage, setNewMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [activeTab, setActiveTab] = useState<'chat' | 'pins' | 'threads'>('chat')
  const scrollRef = useRef<HTMLDivElement>(null)
  
  // Local reactions for the demo (since DB schema update is restricted)
  const [localReactions, setLocalReactions] = useState<Record<string, any>>({})

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  if (!activeChat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-surface-lowest p-8 text-center animate-in fade-in duration-700">
        <div className="w-24 h-24 bg-surface-low rounded-[2.5rem] flex items-center justify-center mb-8 shadow-inner">
           <Sparkles className="w-12 h-12 text-primary animate-pulse" />
        </div>
        <h2 className="text-3xl font-display font-black uppercase tracking-tighter text-text-main mb-3">Welcome to Nexora</h2>
        <p className="text-text-muted max-w-sm text-sm font-medium leading-relaxed uppercase tracking-widest opacity-60">Select a private space or community server to begin your next secure transmission.</p>
        <div className="mt-12 flex space-x-4">
           <button className="px-6 py-3 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20 hover:scale-105 transition-all">Start Discovery</button>
           <button className="px-6 py-3 bg-surface-low text-text-main rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-white transition-all">View Tutorial</button>
        </div>
      </div>
    )
  }

  const isGroup = activeChat.type === 'group'
  const otherParticipant = !isGroup ? activeChat.chat_participants?.find(p => p.user_id !== user?.id)?.profiles : null
  const chatName = isGroup ? activeChat.name : (otherParticipant?.name || 'Private Chat')
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    const { error } = await supabase
      .from('messages')
      .insert({
        chat_id: activeChat.id,
        sender_id: user?.id,
        content: newMessage.trim(),
        message_type: 'text'
      })

    if (!error) setNewMessage('')
  }

  const addReaction = (messageId: string, emoji: string) => {
    setLocalReactions(prev => {
        const messageReactions = prev[messageId] || {}
        return {
            ...prev,
            [messageId]: {
                ...messageReactions,
                [emoji]: (messageReactions[emoji] || 0) + 1
            }
        }
    })
  }

  // Filter typing users for THIS specific chat
  const chatTypingUsers = Object.entries(typingUsers || {}).filter(([id, typing]) => typing && id !== user?.id)

  return (
    <div className="flex-1 flex overflow-hidden bg-surface-lowest relative font-sans">
      <div className="flex-1 flex flex-col min-w-0 border-r border-outline-variant/30">
        {/* Chat Header */}
        <header className="h-[84px] bg-surface-lowest/80 backdrop-blur-xl border-b border-outline-variant flex items-center justify-between px-8 z-30 shrink-0">
          <div className="flex items-center space-x-5">
            <div className="relative group">
              <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/50 group-hover:scale-105 transition-all duration-500">
                <img src={getAvatarUrl(isGroup ? activeChat : otherParticipant)} alt="" className="w-full h-full object-cover" />
              </div>
              {!isGroup && (
                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-4 border-surface-lowest 
                  ${onlineUsers[otherParticipant?.id || ''] ? 'bg-presence-online shadow-[0_0_15px_rgba(35,165,90,0.5)]' : 'bg-presence-offline border-zinc-400'}`} 
                />
              )}
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
                {isGroup ? <><Users className="w-3 h-3 mr-1" /> {activeChat.chat_participants?.length || 0} Members</> : (onlineUsers[otherParticipant?.id || ''] ? 'Connected to Neural Grid' : 'Standard Transmission')}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
             <div className="hidden md:flex bg-surface-low rounded-xl p-1 border border-outline-variant">
                <button className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'chat' ? 'bg-white shadow-sm text-primary' : 'text-text-muted hover:text-text-main'}`} onClick={() => setActiveTab('chat')}>History</button>
                <button className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'pins' ? 'bg-white shadow-sm text-primary' : 'text-text-muted hover:text-text-main'}`} onClick={() => setActiveTab('pins')}>Pinned</button>
             </div>
             <div className="w-px h-6 bg-outline-variant mx-2" />
             <div className="flex space-x-1">
                <HeaderAction icon={Phone} label="Voice Call" />
                <HeaderAction icon={Video} label="Video Call" />
                <HeaderAction 
                  icon={Info} 
                  label="Details" 
                  active={showDetailSidebar} 
                  onClick={toggleDetailSidebar} 
                />
             </div>
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
                                <motion.div 
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    key={emoji} 
                                    className="px-2 py-0.5 bg-surface-lowest border border-outline-variant rounded-full shadow-sm text-[10px] flex items-center space-x-1"
                                >
                                    <span>{emoji}</span>
                                    <span className="font-black text-text-muted">{count}</span>
                                </motion.div>
                            ))}
                        </div>
                      </div>
                      
                      {msg.message_type === 'image' && msg.image_url && (
                        <div className="mt-3 rounded-[2rem] overflow-hidden border-4 border-white shadow-2xl rotate-1 hover:rotate-0 transition-transform duration-500 cursor-zoom-in">
                          <img src={msg.image_url} alt="" className="max-w-xs md:max-w-md object-cover" />
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Member List (Unified with Detail Sidebar concept) */}
          <AnimatePresence>
            {isGroup && showDetailSidebar && (
              <motion.div 
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 280, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="h-full bg-surface-low/50 backdrop-blur-md border-l border-outline-variant hidden lg:flex flex-col"
              >
                <div className="p-6">
                  <h3 className="text-[10px] font-black uppercase text-text-muted tracking-[0.2em] mb-6">Participants — {activeChat.chat_participants?.length}</h3>
                  <div className="space-y-4">
                     {/* Role-based groupings */}
                     <RoleSection title="Admin" count={1} />
                     <div className="space-y-1">
                        {activeChat.chat_participants?.filter(p => (p as any).role === 'admin' || (p as any).role === 'owner').map(participant => (
                           <MemberItem key={participant.user_id} profile={participant.profiles} status={onlineUsers[participant.user_id]?.status || 'offline'} isSpeaking={onlineUsers[participant.user_id]?.status === 'online'} />
                        ))}
                     </div>

                     <RoleSection title="Agents" count={activeChat.chat_participants?.length - 1} />
                     <div className="space-y-1">
                        {activeChat.chat_participants?.filter(p => !((p as any).role === 'admin' || (p as any).role === 'owner')).map(participant => (
                           <MemberItem key={participant.user_id} profile={participant.profiles} status={onlineUsers[participant.user_id]?.status || 'offline'} />
                        ))}
                     </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input Area */}
        <footer className="px-8 pb-8 pt-2 relative z-30">
          <div className="max-w-5xl mx-auto">
             {/* Premium Typing Indicator */}
             <AnimatePresence>
               {chatTypingUsers.length > 0 && (
                 <motion.div 
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: 10 }}
                   className="absolute -top-6 left-12 flex items-center space-x-3"
                 >
                   <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-typing-bounce" style={{ animationDelay: '0s' }} />
                      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-typing-bounce" style={{ animationDelay: '0.2s' }} />
                      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-typing-bounce" style={{ animationDelay: '0.4s' }} />
                   </div>
                   <span className="text-[9px] font-black text-primary uppercase tracking-widest">
                     {chatTypingUsers.length === 1 
                        ? `${chatTypingUsers[0][1]} is typing...` 
                        : `${chatTypingUsers.length} people are typing...`}
                   </span>
                 </motion.div>
               )}
             </AnimatePresence>

             <form onSubmit={handleSendMessage} className="relative bg-surface-low border border-outline-variant rounded-[2.5rem] p-2 pr-4 flex items-center shadow-2xl transition-all focus-within:ring-4 focus-within:ring-primary/5 focus-within:bg-white group">
                <button className="w-12 h-12 rounded-full flex items-center justify-center text-text-muted hover:bg-primary/10 hover:text-primary transition-all">
                   <Plus className="w-6 h-6" />
                </button>
                <input 
                   type="text"
                   placeholder={`Message ${chatName}...`}
                   value={newMessage}
                   onChange={(e) => setNewMessage(e.target.value)}
                   className="flex-1 bg-transparent border-none outline-none px-4 py-3.5 text-sm font-bold text-text-main placeholder:text-text-muted/40 placeholder:uppercase placeholder:tracking-widest"
                />
                <div className="flex items-center space-x-1 pl-4">
                  <InputUtility icon={Smile} />
                  <InputUtility icon={Mic} />
                  <InputUtility icon={Paperclip} />
                </div>
                <button className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-xl ${newMessage.trim() ? 'bg-primary text-white rotate-0 scale-100' : 'bg-surface-low text-text-muted scale-90 rotate-12 opacity-50'}`}>
                   <Send className="w-6 h-6" />
                </button>
             </form>
          </div>
        </footer>
      </div>
    </div>
  )
}

function RoleSection({ title, count }: { title: string, count: number }) {
    return (
        <div className="flex items-center justify-between mt-6 mb-2 px-2">
            <span className="text-[9px] font-black uppercase text-text-muted tracking-[0.2em]">{title}</span>
            <span className="text-[9px] font-black text-text-muted opacity-40">— {count}</span>
        </div>
    )
}

function MemberItem({ profile, status, isSpeaking }: { profile: any, status: string, isSpeaking?: boolean }) {
    return (
        <div className={`flex items-center space-x-3 p-2 rounded-xl hover:bg-white/50 transition-all cursor-pointer group ${status === 'offline' ? 'opacity-40 grayscale-[0.5]' : ''}`}>
           <div 
              className={`relative shrink-0 ${isSpeaking ? 'animate-speak-pulse rounded-2xl' : ''}`}
              style={profile?.avatar_decoration ? { 
                boxShadow: `0 0 18px ${profile.avatar_decoration}50`
              } : {}}
            >
              <div className="w-9 h-9 rounded-2xl overflow-hidden border-2 border-transparent group-hover:border-primary transition-all"
                style={profile?.avatar_decoration ? { borderColor: profile.avatar_decoration } : {}}
              >
                 <img src={getAvatarUrl(profile)} alt="" className="w-full h-full object-cover" />
              </div>
              <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-4 border-surface-low
                ${status === 'online' ? 'bg-presence-online' : status === 'idle' ? 'bg-presence-idle' : status === 'dnd' ? 'bg-presence-dnd' : 'bg-presence-offline'}`} 
              />
           </div>
           <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-text-main truncate group-hover:text-primary transition-colors">{profile?.name}</p>
              <p className="text-[8px] font-black text-text-muted uppercase tracking-widest">{status === 'online' ? 'Active' : status}</p>
           </div>
        </div>
    )
}

function ReactionButton({ icon: Icon, emoji, onClick }: { icon?: any, emoji?: string, onClick: () => void }) {
    return (
        <button 
            onClick={onClick}
            className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-surface-low transition-all text-lg hover:scale-110 active:scale-95"
        >
            {Icon ? <Icon className="w-4 h-4 text-text-muted" /> : emoji}
        </button>
    )
}

function HeaderAction({ icon: Icon, label, active, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) {
   return (
      <button 
        onClick={onClick}
        title={label}
        className={`p-2.5 rounded-xl transition-all relative group ${active ? 'bg-primary text-white shadow-xl' : 'text-text-muted hover:bg-surface-low hover:text-text-main'}`}
      >
         <Icon className="w-5 h-5 group-hover:rotate-6 transition-transform" />
      </button>
   )
}

function InputUtility({ icon: Icon }: { icon: any }) {
    return (
        <button className="w-10 h-10 rounded-xl flex items-center justify-center text-text-muted hover:bg-surface-lowest hover:text-primary transition-all">
            <Icon className="w-5 h-5" />
        </button>
    )
}
