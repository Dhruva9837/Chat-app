'use client'

import React, { useState, useEffect } from 'react'
import { X, Search, Users, Check, Flame } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useChatStore } from '@/store/chatStore'
import { getAvatarUrl } from '@/lib/utils'

interface Profile {
  id: string
  name: string
  username: string
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
      if (data) setProfiles(data)
    }
    fetchProfiles()
  }, [isOpen, user?.id])

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleCreateChat = async () => {
    if (selectedIds.length === 0 || !user) return
    setLoading(true)

    try {
      const isGroup = !!groupName && selectedIds.length > 0;
      
      if (!isGroup && selectedIds.length === 1) {
        // --- START DIRECT MESSAGE LOGIC ---
        const otherId = selectedIds[0];
        
        // Check if a DM already exists
        const { data: existingChats } = await supabase
          .from('chats')
          .select(`
            id,
            type,
            chat_participants!inner(user_id)
          `)
          .eq('type', 'dm')
          .eq('chat_participants.user_id', user.id);

        let finalChatId = null;

        if (existingChats) {
          // Manually verify the other participant in these chats
          for (const chat of existingChats) {
            const { data: participants } = await supabase
              .from('chat_participants')
              .select('user_id')
              .eq('chat_id', chat.id);
            
            const participantIds = participants?.map(p => p.user_id) || [];
            
            // For self-chat, it should only have the user
            if (otherId === user.id) {
              if (participantIds.length === 1 && participantIds[0] === user.id) {
                finalChatId = chat.id;
                break;
              }
            } else {
              // For others, it should have exactly 2 people: user and other
              if (participantIds.length === 2 && participantIds.includes(otherId)) {
                finalChatId = chat.id;
                break;
              }
            }
          }
        }

        if (finalChatId) {
          const { data: fullChat } = await supabase
            .from('chats')
            .select('*, chat_participants(*, profiles(*))')
            .eq('id', finalChatId)
            .single();
          if (fullChat) {
            addChat(fullChat as any);
            setActiveChat(fullChat as any);
          }
          onClose();
          return;
        }

        // Create new DM
        const { data: newChat, error: chatError } = await supabase
          .from('chats')
          .insert({ type: 'dm' })
          .select()
          .single();

        if (chatError) throw chatError;

        const participantRecords = otherId === user.id 
          ? [{ chat_id: newChat.id, user_id: user.id }]
          : [{ chat_id: newChat.id, user_id: user.id }, { chat_id: newChat.id, user_id: otherId }];

        const { error: partError } = await supabase
          .from('chat_participants')
          .insert(participantRecords);

        if (partError) throw partError;

        const { data: fullChat } = await supabase
          .from('chats')
          .select('*, chat_participants(*, profiles(*))')
          .eq('id', newChat.id)
          .single();

        if (fullChat) {
          addChat(fullChat as any);
          setActiveChat(fullChat as any);
        }
      } else if (isGroup) {
        // --- GROUP LOGIC ---
        const { data: chat, error: chatError } = await supabase
          .from('chats')
          .insert({ name: groupName, type: 'group' })
          .select()
          .single()

        if (chatError) throw chatError

        const participants = [user.id, ...selectedIds].map(id => ({
          chat_id: chat.id,
          user_id: id
        }))

        await supabase.from('chat_participants').insert(participants)

        const { data: fullChat } = await supabase
          .from('chats')
          .select('*, chat_participants(*, profiles(*))')
          .eq('id', chat.id)
          .single()

        if (fullChat) {
          addChat(fullChat as any)
          setActiveChat(fullChat as any)
        }
      }

      onClose()
    } catch (error: any) {
      console.error(error);
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredProfiles = profiles.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    (p.username && p.username.toLowerCase().includes(search.toLowerCase().replace('@', ''))) ||
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
        className="w-full max-w-lg bg-surface-lowest rounded-[3rem] relative z-10 overflow-hidden ambient-shadow-2xl flex flex-col max-h-[85vh] border border-outline-variant transition-colors"
      >
        {/* Header */}
        <div className="px-10 pt-10 pb-6 flex items-center justify-between sticky top-0 bg-surface-lowest/80 backdrop-blur-md z-20">
          <div>
            <h2 className="text-3xl font-display font-black tracking-tighter text-text-main leading-none mb-1.5 uppercase tracking-widest">New Group</h2>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted">Start a new conversation</p>
          </div>
          <button onClick={onClose} className="p-3 text-text-muted hover:text-text-main transition-colors bg-surface-low rounded-2xl">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-10 pb-10 space-y-8 no-scrollbar">
          {/* Group Info */}
          <div className="space-y-4">
             <label className="text-[11px] font-black uppercase tracking-widest text-text-muted ml-1">Group Info</label>
             <div className="relative group">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-primary">
                   <Flame className="w-5 h-5 fill-current" />
                </div>
                  <input 
                    type="text"
                    placeholder="Group Name (leave empty for single chat)..."
                    value={groupName}
                    onChange={e => setGroupName(e.target.value)}
                    className="w-full bg-surface-low border border-outline-variant rounded-3xl py-6 pl-16 pr-8 text-[17px] font-sans font-semibold focus:bg-surface-lowest focus:ring-4 focus:ring-primary/5 transition-all outline-none text-text-main"
                  />
             </div>
          </div>

          {/* Search */}
          <div className="space-y-4">
             <label className="text-[11px] font-black uppercase tracking-widest text-text-muted ml-1">Select Members ({selectedIds.length} chosen)</label>
             <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-text-muted w-5 h-5" />
                <input 
                  type="text"
                  placeholder="Filter users..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full bg-surface-low border border-outline-variant rounded-3xl py-4 pl-16 pr-8 text-[15px] font-sans font-medium focus:bg-surface-lowest transition-all outline-none text-text-main"
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
                      : 'bg-surface-lowest border-outline-variant hover:bg-surface-low'
                  }`}
                >
                  <div className="w-14 h-14 rounded-2xl overflow-hidden ambient-shadow border-2 border-surface-lowest shrink-0 transition-colors">
                    <img src={getAvatarUrl(profile)} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-display font-black text-lg tracking-tight text-text-main leading-none mb-1">{profile.name}</h3>
                    <p className="text-[11px] font-black uppercase tracking-widest text-primary">@{profile.username || 'user'}</p>
                  </div>
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                    isSelected ? 'bg-primary border-primary text-white' : 'border-outline-variant text-transparent'
                  }`}>
                    <Check className="w-5 h-5" />
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-10 border-t border-outline-variant bg-surface-low/50 flex space-x-4">
           <button 
             onClick={onClose}
             className="flex-1 bg-surface-lowest border border-outline-variant rounded-3xl py-5 font-display font-black text-text-muted hover:text-text-main transition-all uppercase tracking-widest"
           >
             Cancel
           </button>
            <button 
              disabled={selectedIds.length === 0 || loading || (selectedIds.length > 1 && !groupName)}
              onClick={handleCreateChat}
              className={`flex-[2] rounded-3xl py-5 font-display font-black uppercase tracking-widest transition-all shadow-2xl ${
                selectedIds.length === 0 || loading || (selectedIds.length > 1 && !groupName)
                  ? 'bg-surface-low text-text-muted cursor-not-allowed shadow-none'
                  : 'bg-primary text-white shadow-primary/30 hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              {loading ? 'Creating...' : selectedIds.length > 1 ? 'Create Group' : 'Start Chat'}
            </button>
        </div>
      </motion.div>
    </div>
  )
}
