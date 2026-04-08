'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, UserPlus, MessageSquare, Sparkles, Check, User, Signal, Zap, Globe, Shield, Loader2 } from 'lucide-react'
import { useChatStore } from '@/store/chatStore'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { getAvatarUrl } from '@/lib/utils'

export function AddFriendModal() {
  const { isAddFriendModalOpen, setIsAddFriendModalOpen, setActiveChat, chats, friendRequests } = useChatStore()
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
      // Simulate network delay for the scanning effect immersion
      await new Promise(resolve => setTimeout(resolve, 1500));

      const resp = await fetch('/api/friends/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim().toLowerCase() })
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Identity not found in global node map');
      if (data.profile.id === user.id) throw new Error("Self-discovery loop detected!");
      
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
            className="absolute inset-0 bg-black/90 backdrop-blur-3xl"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-[540px] bg-[#0A0A0B] border border-white/10 rounded-[3rem] overflow-hidden flex flex-col shadow-[0_0_100px_rgba(59,59,253,0.15)]"
          >
            {/* Animated Background Mesh */}
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,_#3B3BFD_0%,_transparent_50%)]" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-40 brightness-150 contrast-150" />
            </div>

            {/* Header Content */}
            <div className="relative z-10 px-12 pt-12 pb-4 flex items-center justify-between">
              <div className="flex items-center gap-5">
                 <motion.div 
                    whileHover={{ rotate: 90 }}
                    className="w-14 h-14 bg-noir-accent/10 rounded-[1.4rem] flex items-center justify-center text-noir-accent border border-noir-accent/20 shadow-[0_0_20px_rgba(59,59,253,0.2)]"
                 >
                    <Globe size={26} strokeWidth={2.5} />
                 </motion.div>
                 <div>
                    <h2 className="text-3xl font-display font-black text-white tracking-tight uppercase leading-none mb-1">Discovery</h2>
                    <div className="flex items-center gap-2">
                       <Shield size={12} className="text-noir-accent" />
                       <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Hash-Deterministic Linkage</span>
                    </div>
                 </div>
              </div>
              <button 
                onClick={() => setIsAddFriendModalOpen(false)}
                className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-text-muted hover:text-white transition-all"
              >
                <X size={22} />
              </button>
            </div>

            <div className="relative z-10 px-12 py-6">
               <p className="text-[14px] text-text-muted font-medium leading-relaxed mb-10 opacity-80">
                 Map the global neural network to establish secure peer-to-peer connections. 
                 Identification is verified across distributed nodes.
               </p>

               {/* Search Interface */}
               <form onSubmit={handleSearch} className="relative mb-12 group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-noir-accent/50 to-transparent rounded-[2.2rem] opacity-0 group-focus-within:opacity-100 blur-md transition-opacity duration-500" />
                  <div className="relative flex items-center bg-[#141416] border border-white/10 rounded-[2rem] p-2 focus-within:border-noir-accent/40 shadow-2xl transition-all">
                      <Search className="ml-5 w-6 h-6 text-text-muted group-focus-within:text-noir-accent transition-colors" />
                      <input 
                        autoFocus
                        type="text"
                        placeholder="IDENTIFIER (@username)"
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase())}
                        className="flex-1 bg-transparent py-5 px-6 text-[15px] font-bold outline-none text-white placeholder:text-text-muted/40 uppercase tracking-[0.1em]"
                      />
                      <button 
                        type="submit"
                        disabled={searching || !username.trim()}
                        className="mr-2 bg-noir-accent text-white px-8 py-4 rounded-[1.6rem] font-black uppercase tracking-widest text-[11px] shadow-[0_10px_30px_rgba(59,59,253,0.3)] hover:scale-[1.05] active:scale-95 disabled:opacity-30 disabled:scale-100 transition-all flex items-center gap-2"
                      >
                        {searching ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} fill="white" />}
                        <span>Discover</span>
                      </button>
                  </div>
               </form>

               {/* Results / Status Area */}
               <div className="min-h-[280px] rounded-[3rem] bg-[#0E0E10] border-2 border-dashed border-white/5 flex flex-col items-center justify-center overflow-hidden relative p-10 shadow-inner">
                  <AnimatePresence mode="wait">
                     {searching && (
                        <motion.div 
                          key="searching"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex flex-col items-center gap-6"
                        >
                           <div className="relative">
                              <div className="w-24 h-24 rounded-full border-4 border-noir-accent/20 border-t-noir-accent animate-spin" />
                              <div className="absolute inset-0 flex items-center justify-center">
                                 <Signal size={24} className="text-noir-accent animate-pulse" />
                              </div>
                           </div>
                           <div className="text-center space-y-2">
                              <p className="text-[12px] font-black text-white uppercase tracking-[0.3em]">Mapping Nodes...</p>
                              <p className="text-[10px] text-text-muted font-bold uppercase tracking-[0.2em] animate-pulse">Scanning Global Registry</p>
                           </div>
                        </motion.div>
                     )}

                     {error && !searching && (
                        <motion.div 
                          key="error"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="text-center px-6"
                        >
                           <div className="w-20 h-20 bg-presence-dnd/10 text-presence-dnd rounded-3xl flex items-center justify-center mx-auto mb-6 border border-presence-dnd/20 rotate-12">
                              <Shield size={32} strokeWidth={2.5} />
                           </div>
                           <h4 className="text-lg font-display font-black text-white uppercase tracking-tight mb-2">Protocol Error</h4>
                           <p className="text-[12px] font-bold text-text-muted tracking-tight leading-relaxed">{error}</p>
                        </motion.div>
                     )}

                     {result && !searching && (
                        <motion.div 
                          key="result"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="w-full flex flex-col items-center"
                        >
                           <div className="relative mb-8">
                              <div className="absolute -inset-4 bg-noir-accent/10 rounded-full blur-xl scale-125 animate-pulse" />
                              <div className="relative w-32 h-32 p-1.5 bg-gradient-to-br from-noir-accent/40 to-transparent rounded-[2.5rem] shadow-2xl">
                                 <img src={getAvatarUrl(result)} alt="" className="w-full h-full rounded-[2.25rem] object-cover bg-[#141416]" />
                                 <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-presence-online rounded-2xl border-4 border-[#0E0E10] shadow-xl flex items-center justify-center">
                                    <div className="w-3 h-3 bg-white rounded-full animate-ping" />
                                 </div>
                              </div>
                           </div>
                           
                           <div className="text-center mb-10">
                              <h3 className="text-3xl font-display font-black text-white tracking-tight uppercase mb-1">{result.name}</h3>
                              <div className="flex items-center justify-center gap-3">
                                 <span className="text-[11px] font-black bg-white/5 text-noir-accent px-3 py-1 rounded-full border border-white/5 uppercase tracking-[0.15em]">@{result.username}</span>
                                 <div className="w-1.5 h-1.5 bg-white/20 rounded-full" />
                                 <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{result.email.split('@')[0].slice(0, 3)}... AUTH</span>
                              </div>
                           </div>
                           
                           <button 
                             onClick={handleAction}
                             className={`
                               group flex items-center gap-4 px-12 py-5 rounded-[2rem] font-black uppercase tracking-widest text-[12px] transition-all shadow-2xl
                               ${existingChat ? 'bg-white text-noir-bg hover:scale-[1.05] active:scale-95' : 
                                 pendingRequestSent ? 'bg-white/5 text-text-muted border border-white/5 cursor-not-allowed' :
                                 pendingRequestReceived ? 'bg-noir-accent text-white hover:scale-[1.05]' :
                                 'bg-noir-accent text-white hover:scale-[1.05] active:scale-95 shadow-[0_20px_40px_rgba(59,59,253,0.3)]'}
                             `}
                           >
                              {existingChat ? <MessageSquare size={18} fill="currentColor" /> : <Zap size={18} fill="currentColor" />}
                              <span>
                                {existingChat ? 'Initiate Private Link' : 
                                  pendingRequestSent ? 'Node Link Pending' :
                                  pendingRequestReceived ? 'Confirm Neural Handshake' :
                                  'Dispatch Link Request'}
                              </span>
                           </button>
                        </motion.div>
                     )}

                     {!result && !error && !searching && (
                        <motion.div 
                          key="placeholder"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex flex-col items-center"
                        >
                           <div className="w-32 h-32 relative mb-8">
                                <motion.div 
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-0 border-2 border-dashed border-white/10 rounded-full"
                                />
                                <motion.div 
                                    animate={{ rotate: -360 }}
                                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-4 border-2 border-dashed border-noir-accent/20 rounded-full"
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Sparkles size={40} className="text-noir-accent/40" />
                                </div>
                           </div>
                           <div className="text-center space-y-2">
                              <p className="text-[12px] font-black uppercase text-white tracking-[0.4em] opacity-40">Awaiting Signal</p>
                              <p className="text-[9px] font-bold text-text-muted uppercase tracking-[0.2em] opacity-60">Global discovery protocol online</p>
                           </div>
                        </motion.div>
                     )}
                  </AnimatePresence>
               </div>
            </div>

            {/* Bottom Footer Section */}
            <div className="relative z-10 px-12 py-10 bg-black/40 border-t border-white/5 flex items-center justify-between">
               <div className="flex items-center gap-3 text-text-muted">
                  <div className="w-2.5 h-2.5 rounded-full bg-presence-online shadow-[0_0_10px_#34C759]" />
                  <span className="text-[11px] font-black uppercase tracking-[0.25em] opacity-70">Core Protocol Active</span>
               </div>
               <div className="text-[10px] font-bold text-text-muted/40 uppercase tracking-widest">
                  v4.1.2-stable
               </div>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

