'use client'

import React, { useState, useEffect, useRef } from 'react'
import { X, Search, Users, Check, Flame, Upload, Camera, Trash2, Plus } from 'lucide-react'
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
  
  // Icon State
  const [iconFile, setIconFile] = useState<File | null>(null)
  const [iconPreview, setIconPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isOpen) {
      setGroupName('')
      setSelectedIds([])
      setSearch('')
      setIconFile(null)
      setIconPreview(null)
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

  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setIconFile(file)
      setIconPreview(URL.createObjectURL(file))
    }
  }

  const handleCreateChat = async () => {
    if (selectedIds.length === 0 || !user) return
    setLoading(true)

    try {
      const isGroup = !!groupName && selectedIds.length > 0;
      
      if (!isGroup && selectedIds.length === 1) {
        // --- DIRECT MESSAGE LOGIC (Remains similar but cleaned up) ---
        const otherId = selectedIds[0];
        
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
          for (const chat of existingChats) {
            const { data: participants } = await supabase
              .from('chat_participants')
              .select('user_id')
              .eq('chat_id', chat.id);
            
            const participantIds = participants?.map(p => p.user_id) || [];
            
            if (otherId === user.id) {
              if (participantIds.length === 1 && participantIds[0] === user.id) {
                finalChatId = chat.id;
                break;
              }
            } else {
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

        // Create new DM via standard insert (DMs don't need the complex API yet)
        const { data: newChat, error: chatError } = await supabase
          .from('chats')
          .insert({ type: 'dm' })
          .select()
          .single();

        if (chatError) throw chatError;

        const participantRecords = otherId === user.id 
          ? [{ chat_id: newChat.id, user_id: user.id }]
          : [{ chat_id: newChat.id, user_id: user.id }, { chat_id: newChat.id, user_id: otherId }];

        await supabase.from('chat_participants').insert(participantRecords);

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
        // --- GROUP LOGIC (Using New API) ---
        let iconUrl = null
        
        // 1. Upload Icon if present
        if (iconFile) {
          const fileExt = iconFile.name.split('.').pop()
          const fileName = `${Math.random()}.${fileExt}`
          const filePath = `group-icons/${fileName}`
          
          const { error: uploadError } = await supabase.storage
            .from('chat-media') // Using existing bucket
            .upload(filePath, iconFile)
            
          if (uploadError) throw uploadError
          
          const { data: { publicUrl } } = supabase.storage
            .from('chat-media')
            .getPublicUrl(filePath)
            
          iconUrl = publicUrl
        }

        // 2. Call the new API
        const response = await fetch('/api/groups/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: groupName,
            members: selectedIds,
            icon: iconUrl,
            created_by: user.id
          })
        })

        const fullChat = await response.json()
        
        if (!response.ok) throw new Error(fullChat.error || 'Failed to create group')

        // 3. Update Store
        if (fullChat) {
          addChat(fullChat)
          setActiveChat(fullChat)
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
  ).filter(p => !selectedIds.includes(p.id)) // Hide selected ones from the main list for cleaner UI

  const selectedProfiles = profiles.filter(p => selectedIds.includes(p.id))

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
          {/* Group Info Section */}
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Icon Upload Overlay */}
            <div className="relative group shrink-0">
               <div 
                 onClick={() => fileInputRef.current?.click()}
                 className="w-24 h-24 rounded-[2rem] bg-surface-low border-2 border-dashed border-outline-variant group-hover:border-primary transition-all cursor-pointer overflow-hidden flex items-center justify-center relative shadow-sm"
               >
                 {iconPreview ? (
                   <>
                    <img src={iconPreview} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                       <Camera className="w-8 h-8 text-white" />
                    </div>
                   </>
                 ) : (
                   <div className="flex flex-col items-center justify-center text-text-muted group-hover:text-primary transition-colors">
                      <Upload className="w-6 h-6 mb-1" />
                      <span className="text-[9px] font-black uppercase tracking-tighter">Icon</span>
                   </div>
                 )}
               </div>
               {iconPreview && (
                 <button 
                   onClick={() => { setIconFile(null); setIconPreview(null); }}
                   className="absolute -top-2 -right-2 w-8 h-8 bg-surface-lowest border border-outline-variant text-presence-dnd rounded-xl flex items-center justify-center hover:bg-surface-low transition-colors shadow-sm z-10"
                 >
                   <Trash2 className="w-4 h-4" />
                 </button>
               )}
               <input 
                 type="file" 
                 ref={fileInputRef} 
                 onChange={handleIconChange} 
                 accept="image/*" 
                 className="hidden" 
               />
            </div>

            <div className="flex-1 w-full space-y-4">
               <label className="text-[11px] font-black uppercase tracking-widest text-text-muted ml-1">Group Name</label>
               <div className="relative group">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-primary">
                     <Flame className="w-5 h-5 fill-current" />
                  </div>
                    <input 
                      type="text"
                      placeholder="Group Name (e.g. Dream Team)..."
                      value={groupName}
                      onChange={e => setGroupName(e.target.value)}
                      className="w-full bg-surface-low border border-outline-variant rounded-3xl py-5 pl-16 pr-8 text-[17px] font-sans font-semibold focus:bg-surface-lowest focus:ring-4 focus:ring-primary/5 transition-all outline-none text-text-main"
                    />
               </div>
            </div>
          </div>

          {/* Selected Members Mini Preview */}
          <AnimatePresence>
            {selectedIds.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <label className="text-[11px] font-black uppercase tracking-widest text-text-muted ml-1">Included Members</label>
                <div className="flex flex-wrap gap-3">
                   {selectedProfiles.map(p => (
                     <div key={p.id} className="group relative">
                        <div className="relative">
                          <img 
                            src={getAvatarUrl(p)} 
                            className="w-12 h-12 rounded-2xl object-cover border-2 border-primary shadow-lg shadow-primary/10" 
                            alt="" 
                          />
                          <button 
                             onClick={() => toggleSelect(p.id)}
                             className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-presence-dnd text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 shadow-md"
                          >
                             <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                     </div>
                   ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search */}
          <div className="space-y-4">
             <label className="text-[11px] font-black uppercase tracking-widest text-text-muted ml-1">Add Members</label>
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
            {filteredProfiles.map(profile => (
              <button
                key={profile.id}
                onClick={() => toggleSelect(profile.id)}
                className="flex items-center space-x-5 p-4 rounded-3xl transition-all border-2 bg-surface-lowest border-outline-variant hover:bg-surface-low active:scale-[0.98]"
              >
                <div className="w-14 h-14 rounded-2xl overflow-hidden ambient-shadow border-2 border-surface-lowest shrink-0 transition-colors">
                  <img src={getAvatarUrl(profile)} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-display font-black text-lg tracking-tight text-text-main leading-none mb-1">{profile.name}</h3>
                  <p className="text-[11px] font-black uppercase tracking-widest text-primary">@{profile.username || 'user'}</p>
                </div>
                <div className="w-8 h-8 rounded-full border-2 border-outline-variant flex items-center justify-center text-transparent transition-all">
                  <Plus className="w-5 h-5 text-text-muted group-hover:text-primary" />
                </div>
              </button>
            ))}
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
