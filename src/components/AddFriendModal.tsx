'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, UserPlus, MessageSquare, Sparkles, Check, User } from 'lucide-react'
import { useChatStore } from '@/store/chatStore'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { getAvatarUrl } from '@/lib/utils'

export function AddFriendModal() {
  const { isAddFriendModalOpen, setAddFriendModalOpen, setActiveChat, setChats, chats } = useChatStore()
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
      const { data, error: searchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username.trim().toLowerCase())
        .single()

      if (searchError) throw new Error('User not found')
      if (data.id === user.id) throw new Error("You can't add yourself!")
      
      setResult(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSearching(false)
    }
  }

  const handleStartChat = async () => {
    if (!result || !user) return

    try {
      // 1. Check if chat already exists
      const existingChat = chats.find(c => 
        c.type === 'private' && 
        (c as any).chat_participants?.some((p: any) => p.user_id === result.id)
      )

      if (existingChat) {
        setActiveChat(existingChat)
        setAddFriendModalOpen(false)
        return
      }

      // 2. Create new private chat
      const { data: newChat, error: chatError } = await supabase
        .from('chats')
        .insert({ type: 'private' })
        .select()
        .single()

      if (chatError) throw chatError

      // 3. Add participants
      await supabase.from('chat_participants').insert([
        { chat_id: newChat.id, user_id: user.id },
        { chat_id: newChat.id, user_id: result.id }
      ])

      // 4. Refresh local chats (should ideally be handled by subscription)
      setActiveChat({ ...newChat, chat_participants: [{ profiles: result }] } as any)
      setAddFriendModalOpen(false)
    } catch (err: any) {
      alert(err.message)
    }
  }

  return (
    <AnimatePresence>
      {isAddFriendModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setAddFriendModalOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-surface-lowest rounded-[2.5rem] shadow-2xl border border-outline-variant overflow-hidden"
          >
            {/* Header */}
            <div className="p-8 bg-primary text-white relative">
                <button 
                  onClick={() => setAddFriendModalOpen(false)}
                  className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-center space-x-4 mb-2">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                        <UserPlus className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-display font-black uppercase tracking-tight">Add Friend</h2>
                </div>
                <p className="text-white/70 text-sm font-sans tracking-tight">You can add friends with their Nexora username.</p>
            </div>

            {/* Search Content */}
            <div className="p-8 space-y-8">
                <form onSubmit={handleSearch} className="relative group">
                    <input 
                        autoFocus
                        type="text"
                        placeholder="Enter Username (e.g. jdoe)"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full bg-surface-low border border-outline-variant rounded-2xl py-4 pl-14 pr-36 text-lg font-bold outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all placeholder:text-text-muted/40 uppercase tracking-widest"
                    />
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-text-muted group-focus-within:text-primary transition-colors" />
                    <button 
                        type="submit"
                        disabled={searching || !username.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary text-white px-6 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all font-sans"
                    >
                        {searching ? 'Searching...' : 'Search'}
                    </button>
                </form>

                {/* Results Area */}
                <div className="min-h-[200px] flex flex-col items-center justify-center border-2 border-dashed border-outline-variant rounded-[2rem] bg-surface-low/30 overflow-hidden relative">
                    <AnimatePresence mode="wait">
                        {error && (
                            <motion.div 
                                key="error"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-center p-6"
                            >
                                <div className="w-16 h-16 bg-presence-dnd/10 text-presence-dnd rounded-full flex items-center justify-center mx-auto mb-4">
                                    <X className="w-8 h-8" />
                                </div>
                                <p className="text-sm font-black uppercase text-text-muted tracking-widest">{error}</p>
                            </motion.div>
                        )}

                        {result && (
                            <motion.div 
                                key="result"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="w-full p-8 flex flex-col items-center animate-in fade-in zoom-in duration-300"
                            >
                                <div className="relative mb-6">
                                    <div className="w-24 h-24 rounded-[2rem] overflow-hidden border-4 border-white shadow-xl rotate-3">
                                        <img src={getAvatarUrl(result)} alt="" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-presence-online rounded-full border-4 border-white shadow-sm" />
                                </div>
                                <h3 className="text-xl font-display font-black uppercase tracking-tight text-text-main mb-1">{result.name}</h3>
                                <p className="text-sm font-black text-primary uppercase tracking-widest mb-8">@{result.username}</p>
                                
                                <button 
                                    onClick={handleStartChat}
                                    className="flex items-center space-x-3 bg-text-main text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-primary transition-all hover:scale-105 active:scale-95 shadow-xl"
                                >
                                    <MessageSquare className="w-5 h-5" />
                                    <span>Send Message</span>
                                </button>
                            </motion.div>
                        )}

                        {!result && !error && !searching && (
                            <div key="empty" className="text-center opacity-40">
                                <Sparkles className="w-12 h-12 mx-auto mb-4" />
                                <p className="text-[10px] font-black uppercase tracking-[0.3em]">Ready for discovery</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <div className="p-6 bg-surface-low border-t border-outline-variant flex justify-center">
                <span className="text-[10px] font-black uppercase text-text-muted tracking-widest flex items-center">
                    <Check className="w-3 h-3 mr-2" /> End-to-end encrypted discovery
                </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
