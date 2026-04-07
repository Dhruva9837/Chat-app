'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, UserPlus, MessageSquare, Sparkles, Check, User, Signal } from 'lucide-react'
import { useChatStore } from '@/store/chatStore'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { getAvatarUrl } from '@/lib/utils'

export function AddFriendModal() {
  const { isAddFriendModalOpen, setIsAddFriendModalOpen, setActiveChat, setChats, chats, friendRequests } = useChatStore()
  const { user } = useAuthStore()
  const [username, setUsername] = useState('')
  const [searching, setSearching] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !user) return

    setSearching(true)
    setError('')
    setResult(null)

    try {
      const resp = await fetch('/api/friends/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim().toLowerCase() })
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'User not found');
      if (data.profile.id === user.id) throw new Error("You can't add yourself!");
      
      setResult(data.profile)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSearching(false)
    }
  }

  const existingChat = result ? chats.find(c => 
    c.type === 'private' && 
    (c as any).chat_participants?.some((p: any) => p.user_id === result.id)
  ) : null

  const pendingRequestSent = result ? friendRequests.find(r => r.sender_id === user?.id && r.receiver_id === result.id && r.status === 'pending') : null
  const pendingRequestReceived = result ? friendRequests.find(r => r.receiver_id === user?.id && r.sender_id === result.id && r.status === 'pending') : null

  const handleAction = async () => {
    if (!result || !user) return
    if (existingChat) {
      setActiveChat(existingChat);
      setIsAddFriendModalOpen(false);
      return;
    }
    if (pendingRequestSent) return;
    if (pendingRequestReceived) {
      try {
        const resp = await fetch('/api/friends/requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestId: pendingRequestReceived.id, action: 'accept', userId: user.id })
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error);
        setIsAddFriendModalOpen(false);
      } catch (err: any) {
        alert(err.message);
      }
      return;
    }
    try {
      const resp = await fetch('/api/friends/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId: user.id, receiverId: result.id })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error);
    } catch (err: any) {
      alert(err.message);
    }
  }

  return (
    <AnimatePresence mode="wait">
      {isAddFriendModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsAddFriendModalOpen(false)}
            className="absolute inset-0 bg-black/80 backdrop-blur-2xl"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            className="relative w-full max-w-[500px] noir-card rounded-[2.5rem] overflow-hidden flex flex-col shadow-[0_35px_80px_-15px_rgba(0,0,0,0.8)]"
          >
            {/* Header Content */}
            <div className="px-10 pt-10 pb-2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-noir-accent/20 rounded-[1.2rem] flex items-center justify-center text-noir-accent border border-noir-accent/20">
                    <UserPlus size={20} strokeWidth={2.5} />
                 </div>
                 <h2 className="text-xl font-display font-black text-white tracking-tight uppercase">Discovery</h2>
              </div>
              <button 
                onClick={() => setIsAddFriendModalOpen(false)}
                className="p-1.5 text-text-muted hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-10 py-6">
               <p className="text-[13px] text-text-muted font-bold leading-relaxed mb-8">
                 Enter a unique username to initiate a secure connection. 
                 Discovery is end-to-end encrypted and deterministic.
               </p>

               {/* Search Form */}
               <form onSubmit={handleSearch} className="relative mb-10 group">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-white transition-colors" />
                  <input 
                    autoFocus
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                    className="w-full bg-[#1A1A1C] border border-outline-variant rounded-[1.8rem] py-5 pl-14 pr-32 text-[15px] font-bold outline-none ring-noir-accent/30 focus:ring-4 transition-all placeholder:text-text-muted uppercase tracking-widest text-white"
                  />
                  <button 
                    type="submit"
                    disabled={searching || !username.trim()}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-noir-accent text-white px-6 py-3 rounded-[1.4rem] font-black uppercase tracking-widest text-[10px] shadow-lg shadow-noir-accent/30 hover:scale-[1.03] active:scale-95 disabled:opacity-30 disabled:scale-100 transition-all"
                  >
                    {searching ? 'LINKING...' : 'DISCOVER'}
                  </button>
               </form>

               {/* Result Area */}
               <div className="min-h-[220px] rounded-[2.2rem] bg-[#1A1A1C] border-2 border-dashed border-outline-variant flex flex-col items-center justify-center overflow-hidden relative p-8">
                  <AnimatePresence mode="wait">
                     {error && (
                        <motion.div 
                          key="error"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="text-center"
                        >
                           <div className="w-16 h-16 bg-presence-dnd/10 text-presence-dnd rounded-full flex items-center justify-center mx-auto mb-4 border border-presence-dnd/20">
                              <X size={24} strokeWidth={3} />
                           </div>
                           <p className="text-[11px] font-black uppercase text-text-muted tracking-widest">{error}</p>
                        </motion.div>
                     )}

                     {result && (
                        <motion.div 
                          key="result"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="w-full flex flex-col items-center"
                        >
                           <div className="relative mb-6">
                              <div className="w-24 h-24 rounded-[2rem] overflow-hidden border-2 border-outline-variant shadow-2xl rotate-3 bg-[#111113]">
                                 <img src={getAvatarUrl(result)} alt="" className="w-full h-full object-cover" />
                              </div>
                              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-presence-online rounded-full border-4 border-[#1A1A1C] shadow-lg" />
                           </div>
                           
                           <h3 className="text-xl font-display font-black text-white tracking-tight uppercase mb-0.5">{result.name}</h3>
                           <p className="text-[11px] font-black text-noir-accent uppercase tracking-[0.2em] mb-10">@{result.username}</p>
                           
                           <button 
                             onClick={handleAction}
                             className={`
                               flex items-center gap-3 px-10 py-5 rounded-[1.6rem] font-black uppercase tracking-widest text-[11px] transition-all shadow-2xl
                               ${existingChat ? 'bg-white text-noir-bg hover:scale-[1.03] active:scale-95' : 
                                 pendingRequestSent ? 'bg-noir-surface text-text-muted border border-outline-variant opacity-60 cursor-not-allowed' :
                                 pendingRequestReceived ? 'bg-noir-accent text-white hover:scale-[1.03] shadow-noir-accent/20' :
                                 'bg-noir-accent text-white hover:scale-[1.03] active:scale-95 shadow-noir-accent/30'}
                             `}
                           >
                             <Signal size={16} strokeWidth={3} />
                             <span>
                               {existingChat ? 'INITIATE CHAT' : 
                                 pendingRequestSent ? 'LINK PENDING' :
                                 pendingRequestReceived ? 'ESTABLISH LINK' :
                                 'REQUEST LINK'}
                             </span>
                           </button>
                        </motion.div>
                     )}

                     {!result && !error && !searching && (
                        <motion.div 
                          key="placeholder"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 0.3 }}
                          className="text-center"
                        >
                           <Sparkles size={48} className="mx-auto mb-6 text-white" />
                           <p className="text-[10px] font-black uppercase text-white tracking-[0.4em]">Ready for discovery</p>
                        </motion.div>
                     )}
                  </AnimatePresence>
               </div>
            </div>

            {/* Bottom Footer Section */}
            <div className="px-10 py-8 bg-[#131315] border-t border-outline-variant flex items-center justify-center">
               <div className="flex items-center gap-2 text-text-muted">
                  <div className="w-2 h-2 rounded-full bg-presence-online animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Protocol active</span>
               </div>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
