'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Send, Smile, Phone, Video, Info, MoreVertical, Plus, Mic, Paperclip, Check, Search } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useChatStore } from '@/store/chatStore'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'

export function ChatWindow() {
  const { activeChat, messages, setMessages, addMessage, setActiveChat, toggleDetailSidebar, typingUsers, setTypingUser, onlineUsers } = useChatStore()
  const { user } = useAuthStore()
  const [content, setContent] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [uploading, setUploading] = useState(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!activeChat || !user) return

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', activeChat.id)
        .order('created_at', { ascending: true })
      
      if (!error && data) {
        setMessages(data)
        // Mark as read
        const unreadIds = data
          .filter(m => !m.is_read && m.sender_id !== user.id)
          .map(m => m.id)
        
        if (unreadIds.length > 0) {
          await supabase
            .from('messages')
            .update({ is_read: true })
            .in('id', unreadIds)
        }
      }
    }

    fetchMessages()

    const channel = supabase
      .channel(`chat:${activeChat.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `chat_id=eq.${activeChat.id}`
      }, (payload) => {
        addMessage(payload.new as any)
        // If message is from others and we are active, mark it as read immediately
        if (payload.new.sender_id !== user.id) {
          supabase.from('messages').update({ is_read: true }).eq('id', payload.new.id).then()
        }
      })
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        setTypingUser(payload.userId, payload.isTyping)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeChat?.id, user?.id])

  const handleTyping = () => {
    if (!activeChat || !user) return

    if (!isTyping) {
      setIsTyping(true)
      supabase.channel(`chat:${activeChat.id}`).send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId: user.id, isTyping: true },
      })
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      supabase.channel(`chat:${activeChat.id}`).send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId: user.id, isTyping: false },
      })
    }, 2000)
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || !activeChat || !user) return

    const newMessage = {
      chat_id: activeChat.id,
      sender_id: user.id,
      content: content.trim(),
    }

    setContent('')
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    setIsTyping(false)
    supabase.channel(`chat:${activeChat.id}`).send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId: user.id, isTyping: false },
    })

    const { error } = await supabase.from('messages').insert(newMessage)
    if (error) console.error('Error sending message:', error)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !activeChat || !user) return

    try {
      setUploading(true)
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${activeChat.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('chat-media')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('chat-media')
        .getPublicUrl(filePath)

      const newMessage = {
        chat_id: activeChat.id,
        sender_id: user.id,
        content: `shared an image`,
        message_type: 'image',
        image_url: publicUrl
      }

      const { error: msgError } = await supabase.from('messages').insert(newMessage)
      if (msgError) throw msgError

    } catch (error: any) {
      alert(error.message)
    } finally {
      setUploading(false)
    }
  }

  if (!activeChat) {
    return (
      <div className="flex-1 hidden md:flex items-center justify-center bg-[#f8faff] p-12">
        <div className="max-w-md text-center">
           <div className="w-24 h-24 bg-white rounded-[2.5rem] ambient-shadow flex items-center justify-center mx-auto mb-8 animate-pulse border border-[#f1f1f1]">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                 <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </div>
           </div>
           <h2 className="font-display font-black text-2xl tracking-tight text-gray-900 mb-3">Architecture of Message</h2>
           <p className="text-zinc-400 font-sans tracking-tight text-sm leading-relaxed">
             Select a professional yap stream to begin your architectural conversation.
           </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-white relative h-screen font-sans border-r border-[#f1f1f1]">
      {/* Header (Inspired by reference) */}
      <div className="h-24 px-10 flex items-center justify-between sticky top-0 glass-v2 z-50 border-b border-white/10">
        <div className="flex items-center space-x-6">
          <button 
            onClick={() => setActiveChat(null)}
            className="p-3 text-gray-900 bg-white/50 hover:bg-white rounded-2xl transition-all md:hidden shadow-sm"
          >
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          
          {(() => {
            const isGroup = (activeChat as any).type === 'group'
            const otherParticipant = (activeChat as any).chat_participants?.find((p: any) => p.user_id !== user?.id)
            const participantProfile = otherParticipant?.profiles
            const chatName = (activeChat as any).name || participantProfile?.name || 'Unknown User'
            const chatAvatar = isGroup 
              ? `https://api.dicebear.com/7.x/initials/svg?seed=${chatName}&backgroundColor=00a3ff&fontFamily=monospace&bold=true`
              : participantProfile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${participantProfile?.email || activeChat.id}`
            const isOnline = !isGroup && onlineUsers[otherParticipant?.user_id || '']
            const memberCount = (activeChat as any).chat_participants?.length || 0

            return (
              <div className="flex items-center space-x-5">
                 <div className="w-14 h-14 rounded-[1.5rem] overflow-hidden ambient-shadow-lg border-2 border-white relative shrink-0">
                    <img 
                      src={chatAvatar} 
                      alt="" 
                      className="w-full h-full object-cover" 
                    />
                    {isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-secondary-presence rounded-full border-4 border-white z-20 shadow-sm" />
                    )}
                 </div>
                 <div>
                   <h2 className="font-display font-black text-xl tracking-tighter text-gray-900 leading-none mb-1.5">
                     {chatName}
                   </h2>
                   <div className={`flex items-center text-[10px] uppercase font-black tracking-[0.2em] ${isOnline || isGroup ? 'text-secondary-presence' : 'text-zinc-400'}`}>
                     <span className={`w-1.5 h-1.5 rounded-full mr-2 ${isOnline || isGroup ? 'bg-secondary-presence animate-pulse' : 'bg-zinc-300'}`} />
                     {isGroup ? `${memberCount} Architects Node` : (isOnline ? 'Active Stream' : 'Offline')}
                   </div>
                 </div>
              </div>
            )
          })()}
        </div>
        
        <div className="flex items-center space-x-4">
          <HeaderAction icon={Video} color="text-zinc-500" />
          <HeaderAction icon={Phone} color="text-zinc-500" />
          <div className="w-px h-8 bg-black/5 mx-2" />
          <HeaderAction icon={Search} color="text-zinc-500" />
          <HeaderAction icon={Info} color="text-primary" onClick={toggleDetailSidebar} />
          <HeaderAction icon={MoreVertical} color="text-zinc-500" />
        </div>
      </div>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto px-12 pt-10 pb-16 space-y-10 scroll-smooth no-scrollbar">
        <div className="flex items-center justify-center mb-12">
           <span className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.5em] bg-white/50 backdrop-blur-md px-8 py-2.5 rounded-full border border-black/5">
              Secure Terminal Connection established
           </span>
        </div>

        <AnimatePresence initial={false}>
          {messages.map((msg, index) => {
            const isMe = msg.sender_id === user?.id
            return (
              <motion.div
                key={msg.id || index}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, delay: index * 0.02, ease: [0.16, 1, 0.3, 1] }}
                className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div className="flex items-end space-x-5 max-w-[85%] md:max-w-[75%] lg:max-w-[70%]">
                   {!isMe && (
                      <div className="w-11 h-11 rounded-2xl overflow-hidden ambient-shadow border-2 border-white shrink-0 mb-6 self-center rotate-3">
                         <img 
                           src={((activeChat as any).chat_participants?.find((p: any) => p.user_id !== user?.id)?.profiles?.avatar_url) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${activeChat.id}`} 
                           alt="" 
                           className="w-full h-full object-cover" 
                         />
                      </div>
                   )}
                   <div className="flex flex-col">
                      <div 
                        className={`px-8 py-6 ambient-shadow-lg relative transition-all hover:scale-[1.01] overflow-hidden ${
                          isMe 
                            ? 'bg-gradient-to-br from-primary to-primary-container text-white rounded-[2.5rem] rounded-br-[0.5rem] shadow-xl shadow-primary/10' 
                            : 'bg-white text-gray-900 rounded-[2.5rem] rounded-bl-[0.5rem] border border-black/5'
                        }`}
                      >
                         {msg.message_type === 'image' ? (
                           <div className="space-y-4">
                              <div className="relative group rounded-3xl overflow-hidden ambient-shadow border-2 border-white/20">
                                <img 
                                  src={msg.image_url} 
                                  alt="Shared media" 
                                  className="max-w-full h-auto object-cover max-h-[400px] transition-transform duration-700 group-hover:scale-110" 
                                />
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                              <p className={`text-[13px] font-black uppercase tracking-widest ${isMe ? 'text-white/60' : 'text-zinc-400'}`}>Media Node Received</p>
                           </div>
                         ) : (
                           <p className="text-[16px] leading-[1.6] font-sans tracking-tight font-medium selection:bg-white/20">{msg.content}</p>
                         )}
                      </div>
                      <div className={`flex items-center mt-3.5 px-6 ${isMe ? 'justify-end' : 'justify-start'}`}>
                         <span className="text-[11px] font-black text-zinc-300 uppercase tracking-widest">
                           {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                         </span>
                         {isMe && (
                           <div className="flex items-center ml-3.5 space-x-0.5">
                              <Check className={`w-4 h-4 ${msg.is_read ? 'text-secondary-presence' : 'text-zinc-300'} transition-colors`} />
                              {msg.is_read && <Check className="w-4 h-4 text-secondary-presence -ml-2.5" />}
                           </div>
                         )}
                      </div>
                   </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {/* Typing Indicator */}
        {(() => {
          const otherParticipant = (activeChat as any).chat_participants?.find((p: any) => p.user_id !== user?.id)
          const isOtherTyping = typingUsers[otherParticipant?.user_id || '']
          
          if (!isOtherTyping) return null

          return (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="flex items-center space-x-5"
            >
               <div className="w-11 h-11 rounded-2xl overflow-hidden ambient-shadow border-2 border-white shrink-0 opacity-80 -rotate-3">
                  <img src={otherParticipant?.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherParticipant?.user_id}`} alt="" />
               </div>
               <div className="bg-white px-8 py-5 rounded-full flex items-center space-x-2.5 border border-black/5 shadow-sm">
                  <motion.span 
                    animate={{ scale: [1, 1.5, 1] }} 
                    transition={{ repeat: Infinity, duration: 1, delay: 0.1 }}
                    className="w-2 h-2 bg-primary/40 rounded-full" 
                  />
                  <motion.span 
                    animate={{ scale: [1, 1.5, 1] }} 
                    transition={{ repeat: Infinity, duration: 1, delay: 0.3 }}
                    className="w-2 h-2 bg-primary/40 rounded-full" 
                  />
                  <motion.span 
                    animate={{ scale: [1, 1.5, 1] }} 
                    transition={{ repeat: Infinity, duration: 1, delay: 0.5 }}
                    className="w-2 h-2 bg-primary/40 rounded-full" 
                  />
               </div>
            </motion.div>
          )
        })()}

        <div ref={messagesEndRef} />
      </div>

      {/* The Compose Area (Floating Pill) */}
      <div className="px-12 pb-14 pt-4 bg-white sticky bottom-0">
        <form 
          onSubmit={handleSendMessage}
          className="bg-[#f8faff] rounded-[3.5rem] border border-black/5 p-4 flex items-center group focus-within:bg-white focus-within:shadow-2xl focus-within:shadow-primary/5 focus-within:border-primary/20 transition-all duration-500"
        >
          <div className="flex items-center px-4 space-x-2">
             <input 
               type="file" 
               className="hidden" 
               ref={fileInputRef} 
               accept="image/*"
               onChange={handleFileUpload}
             />
             <ComposeAction 
               icon={uploading ? () => <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /> : Paperclip} 
               onClick={() => fileInputRef.current?.click()}
             />
             <ComposeAction icon={Smile} />
          </div>
          <input
            type="text"
            value={content}
            onChange={(e) => {
              setContent(e.target.value)
              handleTyping()
            }}
            placeholder={`Type a high-fidelity message...`}
            className="flex-1 bg-transparent border-none py-4 px-4 text-[17px] focus:ring-0 outline-none text-gray-800 placeholder:text-zinc-300 font-sans font-medium"
          />
          <div className="flex items-center px-4 space-x-3">
             <ComposeAction icon={Mic} />
             <motion.button
               whileTap={{ scale: 0.92 }}
               type="submit"
               disabled={!content.trim()}
               className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                 content.trim() 
                   ? 'bg-primary text-white shadow-2xl shadow-primary/40' 
                   : 'bg-zinc-100 text-zinc-300'
               }`}
             >
               <Send className="w-6 h-6 fill-current" />
             </motion.button>
          </div>
        </form>
      </div>
    </div>
  )
}

function HeaderAction({ icon: Icon, color, onClick }: any) {
  return (
    <button onClick={onClick} className={`p-2.5 rounded-xl transition-all active:scale-90 hover:bg-surface-low ${color}`}>
       <Icon className="w-5 h-5" />
    </button>
  )
}

function ComposeAction({ icon: Icon }: any) {
  return (
    <button type="button" className="p-3 text-zinc-300 hover:text-primary transition-colors rounded-full hover:bg-white active:scale-90">
       <Icon className="w-5 h-5" />
    </button>
  )
}
