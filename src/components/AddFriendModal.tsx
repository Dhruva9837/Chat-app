'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, MessageSquare, Sparkles, Check, Signal, Zap, Globe, Shield, Loader2 } from 'lucide-react'
import { useChatStore } from '@/store/chatStore'
import { useAuthStore } from '@/store/authStore'
import { getAvatarUrl } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

export function AddFriendModal() {
  const { isAddFriendModalOpen, setIsAddFriendModalOpen, setActiveChat, chats, friendRequests, fetchRequests, fetchFriends } = useChatStore()
  const { user } = useAuthStore()
  const [username, setUsername] = useState('')
  const [searching, setSearching] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [actionDone, setActionDone] = useState(false)

  // Reset state when modal closes
  useEffect(() => {
    if (!isAddFriendModalOpen) {
      setUsername('')
      setResult(null)
      setError('')
      setActionDone(false)
    }
  }, [isAddFriendModalOpen])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = username.trim().toLowerCase().replace(/^@/, '')
    if (!trimmed || !user) return

    setSearching(true)
    setError('')
    setResult(null)
    setActionDone(false)

    try {
      // Simulate scanning effect
      await new Promise(resolve => setTimeout(resolve, 1200))

      const resp = await fetch('/api/friends/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: trimmed })
      })

      const data = await resp.json()

      if (!resp.ok) throw new Error(data.error || 'User not found in network')
      if (data.profile.id === user.id) throw new Error('You cannot add yourself!')

      setResult(data.profile)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSearching(false)
    }
  }

  const existingChat = result
    ? chats.find(c => c.type === 'private' && (c as any).chat_participants?.some((p: any) => p.user_id === result.id))
    : null

  const pendingRequestSent = result
    ? friendRequests.find(r => r.sender_id === user?.id && r.receiver_id === result.id && r.status === 'pending')
    : null

  const pendingRequestReceived = result
    ? friendRequests.find(r => r.receiver_id === user?.id && r.sender_id === result.id && r.status === 'pending')
    : null

  const alreadyFriend = result
    ? friendRequests.find(r => (r.sender_id === user?.id && r.receiver_id === result.id && r.status === 'accepted') || (r.receiver_id === user?.id && r.sender_id === result.id && r.status === 'accepted'))
    : null

  const handleAction = async () => {
    if (!result || !user || actionLoading) return

    if (existingChat) {
      setActiveChat(existingChat)
      setIsAddFriendModalOpen(false)
      return
    }

    if (pendingRequestSent || alreadyFriend) return

    setActionLoading(true)
    try {
      if (pendingRequestReceived) {
        console.log('Accepting incoming request:', pendingRequestReceived.id);
        // Accept incoming request
        const { error } = await supabase
          .from('friend_requests')
          .update({ status: 'accepted' })
          .eq('id', pendingRequestReceived.id)
          .select();
        if (error) throw error;
        
        console.log('Inserting friendship records...');
        const { error: friendErr } = await supabase
          .from('friends')
          .insert([
             { user_id: user.id, friend_id: result.id },
             { user_id: result.id, friend_id: user.id }
          ])
          .select();
        if (friendErr) throw friendErr;
      } else {
        console.log('Sending new friend request to:', result.id);
        // Send new request
        const { error } = await supabase
          .from('friend_requests')
          .insert({ sender_id: user.id, receiver_id: result.id })
          .select();
        
        if (error) {
          console.error('Supabase Insert Error:', error);
          throw error;
        }
        console.log('Request sent successfully');
      }
      setActionDone(true)
      if (user) {
        fetchRequests(user.id)
        fetchFriends(user.id)
      }
    } catch (err: any) {
      console.error('AddFriendModal Action Failed:', err);
      setError(err.message || err.details || 'Network error: Protocol failed to reach peer.')
    } finally {
      setActionLoading(false)
    }
  }

  const getActionLabel = () => {
    if (actionDone) return 'Request Sent!'
    if (existingChat) return 'Open Chat'
    if (alreadyFriend) return 'Already Friends'
    if (pendingRequestSent) return 'Request Pending...'
    if (pendingRequestReceived) return 'Accept Request'
    return 'Send Friend Request'
  }

  const getActionIcon = () => {
    if (actionDone) return <Check size={16} />
    if (existingChat) return <MessageSquare size={16} fill="currentColor" />
    return <Zap size={16} fill="currentColor" />
  }

  return (
    <AnimatePresence>
      {isAddFriendModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsAddFriendModalOpen(false)}
            className="absolute inset-0 bg-black/80 backdrop-blur-2xl"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 60, scale: 0.95 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="relative w-full sm:max-w-[520px] bg-[#0A0A0B] border border-white/10 rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden flex flex-col shadow-[0_0_80px_rgba(59,59,253,0.2)] max-h-[92vh] overflow-y-auto"
          >
            {/* Gradient BG */}
            <div className="absolute inset-0 z-0 pointer-events-none">
              <div className="absolute top-0 left-0 w-full h-48 bg-[radial-gradient(circle_at_50%_0%,_#3B3BFD22_0%,_transparent_70%)]" />
            </div>

            {/* Header */}
            <div className="relative z-10 px-6 sm:px-10 pt-8 pb-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <motion.div
                  whileHover={{ rotate: 90 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                  className="w-12 h-12 bg-noir-accent/10 rounded-2xl flex items-center justify-center text-noir-accent border border-noir-accent/20"
                >
                  <Globe size={22} strokeWidth={2.5} />
                </motion.div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-display font-black text-white tracking-tight uppercase leading-none">Discovery</h2>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Shield size={10} className="text-noir-accent" />
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Secure Peer Network</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsAddFriendModalOpen(false)}
                className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-text-muted hover:text-white transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="relative z-10 px-6 sm:px-10 pb-8 flex flex-col gap-6">
              <p className="text-[13px] text-text-muted leading-relaxed">
                Search by <span className="text-white font-bold">@username</span> to connect with people on Nexora.
              </p>

              {/* Search Bar */}
              <form onSubmit={handleSearch} className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-noir-accent/40 to-transparent rounded-[1.8rem] opacity-0 group-focus-within:opacity-100 blur-sm transition-opacity duration-300" />
                <div className="relative flex items-center bg-[#141416] border border-white/10 rounded-[1.5rem] p-1.5 focus-within:border-noir-accent/50 transition-all">
                  <Search className="ml-4 w-5 h-5 text-text-muted group-focus-within:text-noir-accent transition-colors shrink-0" />
                  <input
                    autoFocus
                    type="text"
                    placeholder="@username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="flex-1 bg-transparent py-3.5 px-4 text-[14px] font-medium outline-none text-white placeholder:text-text-muted/50"
                  />
                  <button
                    type="submit"
                    disabled={searching || !username.trim()}
                    className="shrink-0 bg-noir-accent text-white px-5 py-3 rounded-[1.2rem] font-black uppercase tracking-widest text-[11px] shadow-lg shadow-noir-accent/20 hover:scale-[1.03] active:scale-95 disabled:opacity-30 disabled:scale-100 transition-all flex items-center gap-2"
                  >
                    {searching ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} fill="white" />}
                    <span className="hidden sm:inline">Search</span>
                  </button>
                </div>
              </form>

              {/* Result Area */}
              <div className="min-h-[200px] rounded-[2rem] bg-[#111113] border border-white/8 flex flex-col items-center justify-center relative overflow-hidden p-6">
                {/* Grid pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

                <AnimatePresence mode="wait">
                  {/* Scanning state */}
                  {searching && (
                    <motion.div
                      key="scanning"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="flex flex-col items-center gap-5 relative z-10"
                    >
                      <div className="relative w-20 h-20">
                        <div className="absolute inset-0 rounded-full border-4 border-noir-accent/20 border-t-noir-accent animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Signal size={22} className="text-noir-accent animate-pulse" />
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-[11px] font-black text-white uppercase tracking-[0.3em]">Scanning Network...</p>
                        <p className="text-[10px] text-text-muted mt-1">Locating identity in global registry</p>
                      </div>
                    </motion.div>
                  )}

                  {/* Error state */}
                  {error && !searching && (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                      className="text-center relative z-10 px-4"
                    >
                      <div className="w-16 h-16 bg-red-500/10 text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                        <Shield size={28} strokeWidth={2} />
                      </div>
                      <h4 className="text-base font-black text-white mb-1">Not Found</h4>
                      <p className="text-[12px] text-text-muted leading-relaxed">{error}</p>
                      <button
                        onClick={() => { setError(''); setUsername(''); }}
                        className="mt-4 text-[11px] font-bold text-noir-accent hover:underline"
                      >
                        Try again
                      </button>
                    </motion.div>
                  )}

                  {/* Result found */}
                  {result && !searching && (
                    <motion.div
                      key="result"
                      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                      className="w-full flex flex-col items-center gap-5 relative z-10"
                    >
                      {/* Avatar */}
                      <div className="relative">
                        <div className="absolute -inset-3 bg-noir-accent/10 rounded-full blur-xl animate-pulse" />
                        <div className="relative w-24 h-24 p-1 bg-gradient-to-br from-noir-accent/40 to-transparent rounded-[2rem] shadow-xl">
                          <img
                            src={getAvatarUrl(result)}
                            alt={result.name}
                            className="w-full h-full rounded-[1.75rem] object-cover bg-[#1A1A1C]"
                          />
                          <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-green-500 rounded-xl border-[3px] border-[#111113] flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full" />
                          </div>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="text-center">
                        <h3 className="text-xl font-display font-black text-white tracking-tight">{result.name}</h3>
                        <span className="text-[12px] font-bold text-noir-accent bg-noir-accent/10 px-3 py-1 rounded-full mt-1 inline-block">
                          @{result.username}
                        </span>
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={handleAction}
                        disabled={actionLoading || !!pendingRequestSent || !!alreadyFriend || actionDone}
                        className={`
                          w-full max-w-[260px] flex items-center justify-center gap-3 py-4 rounded-[1.5rem]
                          font-black uppercase tracking-wider text-[12px] transition-all
                          ${actionDone
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30 cursor-default'
                            : existingChat
                              ? 'bg-white text-[#0A0A0B] hover:scale-[1.03] active:scale-95 shadow-xl'
                              : pendingRequestSent || alreadyFriend
                                ? 'bg-white/5 text-text-muted border border-white/10 cursor-not-allowed'
                                : 'bg-noir-accent text-white hover:scale-[1.03] active:scale-95 shadow-lg shadow-noir-accent/30'
                          }
                        `}
                      >
                        {actionLoading ? <Loader2 size={16} className="animate-spin" /> : getActionIcon()}
                        <span>{getActionLabel()}</span>
                      </button>
                    </motion.div>
                  )}

                  {/* Default idle state */}
                  {!result && !error && !searching && (
                    <motion.div
                      key="idle"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="flex flex-col items-center gap-4 relative z-10 text-center"
                    >
                      <div className="w-20 h-20 relative flex items-center justify-center">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
                          className="absolute inset-0 border border-white/10 rounded-full"
                        />
                        <motion.div
                          animate={{ rotate: -360 }}
                          transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                          className="absolute inset-3 border border-noir-accent/25 rounded-full"
                        />
                        <Sparkles size={28} className="text-white/70 relative z-10" />
                      </div>
                      <div>
                        <p className="text-[12px] font-black text-white uppercase tracking-[0.3em]">Ready to Discover</p>
                        <p className="text-[10px] text-text-muted mt-1">Enter a username above to search</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
