'use client'

import React, { useState, useEffect } from 'react'
import { X, Search, Users, Check, Flame } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useChatStore } from '@/store/chatStore'

interface Profile {
  id: string
  name: string
  email: string
  avatar_url: string
}

export function NewGroupModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { user } = useAuthStore()
  const { addChat, setActiveChat } = useChatStore()
  const [groupName, setGroupName] = useState('')
  const [search, setSearch] = useState('')
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setGroupName('')
      setSelectedIds([])
      setSearch('')
      return
    }

    const fetchProfiles = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user?.id)
      if (data) setProfiles(data)
    }
    fetchProfiles()
  }, [isOpen, user?.id])

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleCreateGroup = async () => {
    if (!groupName || selectedIds.length === 0 || !user) return
    setLoading(true)

    try {
      // 1. Create the chat
      const { data: chat, error: chatError } = await supabase
        .from('chats')
        .insert({ name: groupName, type: 'group' })
        .select()
        .single()

      if (chatError) throw chatError

      // 2. Add participants (including creator)
      const participants = [user.id, ...selectedIds].map(id => ({
        chat_id: chat.id,
        user_id: id
      }))

      const { error: partError } = await supabase
        .from('chat_participants')
        .insert(participants)

      if (partError) throw partError

      // 3. Fetch full chat object for store
      const { data: fullChat } = await supabase
        .from('chats')
        .select(`
          *,
          chat_participants (
            user_id,
            profiles:user_id (id, name, avatar_url)
          )
        `)
        .eq('id', chat.id)
        .single()

      if (fullChat) {
        addChat(fullChat as any)
        setActiveChat(fullChat as any)
      }
      onClose()
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredProfiles = profiles.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.email.toLowerCase().includes(search.toLowerCase())
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-[#050505]/80 backdrop-blur-xl" 
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="w-full max-w-lg bg-white rounded-[3rem] relative z-10 overflow-hidden ambient-shadow-2xl flex flex-col max-h-[85vh] border border-black/5"
      >
        {/* Header */}
        <div className="px-10 pt-10 pb-6 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-20">
          <div>
            <h2 className="text-3xl font-display font-black tracking-tighter text-gray-900 leading-none mb-1.5 uppercase tracking-widest">New Group</h2>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Start a new conversation</p>
          </div>
          <button onClick={onClose} className="p-3 text-zinc-400 hover:text-gray-900 transition-colors bg-zinc-50 rounded-2xl">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-10 pb-10 space-y-8 no-scrollbar">
          {/* Group Info */}
          <div className="space-y-4">
             <label className="text-[11px] font-black uppercase tracking-widest text-zinc-400 ml-1">Group Info</label>
             <div className="relative group">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-primary">
                   <Flame className="w-5 h-5 fill-current" />
                </div>
                <input 
                  type="text"
                  placeholder="Group Name..."
                  value={groupName}
                  onChange={e => setGroupName(e.target.value)}
                  className="w-full bg-[#f8faff] border border-black/5 rounded-3xl py-6 pl-16 pr-8 text-[17px] font-sans font-semibold focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all outline-none text-gray-800"
                />
             </div>
          </div>

          {/* Search */}
          <div className="space-y-4">
             <label className="text-[11px] font-black uppercase tracking-widest text-zinc-400 ml-1">Select Members ({selectedIds.length} chosen)</label>
             <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
                <input 
                  type="text"
                  placeholder="Filter users..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full bg-[#f8faff] border border-black/5 rounded-3xl py-4 pl-16 pr-8 text-[15px] font-sans font-medium focus:bg-white transition-all outline-none text-gray-800"
                />
             </div>
          </div>

          {/* List */}
          <div className="grid grid-cols-1 gap-2.5">
            {filteredProfiles.map(profile => {
              const isSelected = selectedIds.includes(profile.id)
              return (
                <button
                  key={profile.id}
                  onClick={() => toggleSelect(profile.id)}
                  className={`flex items-center space-x-5 p-4 rounded-3xl transition-all border-2 ${
                    isSelected 
                      ? 'bg-primary/5 border-primary shadow-lg shadow-primary/5' 
                      : 'bg-white border-black/5 hover:bg-zinc-50'
                  }`}
                >
                  <div className="w-14 h-14 rounded-2xl overflow-hidden ambient-shadow border-2 border-white shrink-0">
                    <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-display font-black text-lg tracking-tight text-gray-900 leading-none mb-1">{profile.name}</h3>
                    <p className="text-[11px] font-black uppercase tracking-widest text-zinc-400">{profile.email}</p>
                  </div>
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                    isSelected ? 'bg-primary border-primary text-white' : 'border-zinc-200 text-transparent'
                  }`}>
                    <Check className="w-5 h-5" />
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-10 border-t border-black/5 bg-zinc-50/50 flex space-x-4">
           <button 
             onClick={onClose}
             className="flex-1 bg-white border border-black/5 rounded-3xl py-5 font-display font-black text-gray-400 hover:text-gray-900 transition-all uppercase tracking-widest"
           >
             Cancel
           </button>
           <button 
             disabled={!groupName || selectedIds.length === 0 || loading}
             onClick={handleCreateGroup}
             className={`flex-[2] rounded-3xl py-5 font-display font-black uppercase tracking-widest transition-all shadow-2xl ${
               !groupName || selectedIds.length === 0 || loading
                 ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed shadow-none'
                 : 'bg-primary text-white shadow-primary/30 hover:scale-[1.02] active:scale-[0.98]'
             }`}
           >
             {loading ? 'Creating...' : 'Create Group'}
           </button>
        </div>
      </motion.div>
    </div>
  )
}
