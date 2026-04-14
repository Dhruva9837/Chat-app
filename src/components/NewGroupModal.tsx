'use client'

import React, { useState, useEffect, useRef } from 'react'
import { X, Search, Users, Check, Flame, Upload, Camera, Trash2, Plus, ArrowRight, Shield } from 'lucide-react'
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

export function NewGroupModal() {
  const { user } = useAuthStore()
  const { addChat, setActiveChat, isNewGroupModalOpen, setNewGroupModalOpen } = useChatStore()
  const [groupName, setGroupName] = useState('')
  const [search, setSearch] = useState('')
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  
  const [iconFile, setIconFile] = useState<File | null>(null)
  const [iconPreview, setIconPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isNewGroupModalOpen) {
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
        .neq('id', user?.id)
      if (data) setProfiles(data)
    }
    fetchProfiles()
  }, [isNewGroupModalOpen, user?.id])

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

  const handleCreateGroup = async () => {
    if (!user || !groupName) return
    setLoading(true)

    try {
      let iconUrl = null
      
      if (iconFile) {
        const fileExt = iconFile.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `group-icons/${fileName}`
        
        const { error: uploadError } = await supabase.storage
          .from('chat-media')
          .upload(filePath, iconFile)
          
        if (uploadError) throw uploadError
        
        const { data: { publicUrl } } = supabase.storage
          .from('chat-media')
          .getPublicUrl(filePath)
          
        iconUrl = publicUrl
      }

      // 1. Create the Chat record on the client-side to pass RLS
      const { data: chat, error: chatError } = await supabase
        .from('chats')
        .insert([{ 
          name: groupName, 
          type: 'group', 
          group_icon: iconUrl,
          created_by: user.id 
        }])
        .select()
        .single();
      
      if (chatError) throw chatError;

      // 2. Add Participants via API (which handles bulk insertion and joins)
      const response = await fetch('/api/groups/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chat.id,
          members: selectedIds || [],
          created_by: user.id
        })
      });

      const fullChat = await response.json();
      if (!response.ok) throw new Error(fullChat.error || 'Failed to add group members');

      if (fullChat) {
        addChat(fullChat);
        setActiveChat(fullChat);
      }
      setNewGroupModalOpen(false);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false)
    }
  }

  const filteredProfiles = profiles.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    (p.username && p.username.toLowerCase().includes(search.toLowerCase().replace('@', ''))) ||
    p.email.toLowerCase().includes(search.toLowerCase())
  ).filter(p => !selectedIds.includes(p.id))

  const selectedProfiles = profiles.filter(p => selectedIds.includes(p.id))

  return (
    <AnimatePresence mode="wait">
      {isNewGroupModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setNewGroupModalOpen(false)}
            className="absolute inset-0 bg-black/80 backdrop-blur-2xl" 
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            className="relative w-full max-w-[600px] noir-card rounded-[2.8rem] flex flex-col max-h-[85vh] overflow-hidden shadow-[0_35px_80px_-15px_rgba(0,0,0,0.8)]"
          >
            {/* Header Area */}
            <div className="px-12 pt-12 pb-6 flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-noir-accent/20 rounded-[1.4rem] flex items-center justify-center text-noir-accent border border-noir-accent/20">
                     <Users size={24} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-display font-black text-white tracking-tight uppercase">Protocol Group</h2>
                    <div className="flex items-center gap-2 mt-0.5">
                       <Shield size={12} className="text-noir-accent" />
                       <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">End-to-End Encrypted</span>
                    </div>
                  </div>
               </div>
               <button 
                onClick={() => setNewGroupModalOpen(false)} 
                className="p-2 text-text-muted hover:text-white transition-colors"
               >
                <X size={24} />
               </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar px-12 py-6 space-y-10">
               
               {/* Identity Section */}
               <div className="flex items-center gap-10">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-[120px] h-[120px] rounded-[2.2rem] bg-[#1A1A1C] border-2 border-dashed border-outline-variant hover:border-noir-accent/50 transition-all cursor-pointer overflow-hidden flex items-center justify-center relative group shrink-0"
                  >
                    {iconPreview ? (
                      <>
                        <img src={iconPreview} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-noir-bg/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Camera size={32} className="text-white" />
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-text-muted group-hover:text-white transition-colors">
                        <Camera size={32} />
                        <span className="text-[9px] font-black uppercase mt-2">Upload</span>
                      </div>
                    )}
                    <input type="file" ref={fileInputRef} onChange={handleIconChange} accept="image/*" className="hidden" />
                  </div>

                  <div className="flex-1">
                     <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] mb-3 block ml-1">Identity Label</span>
                     <input 
                        type="text"
                        placeholder="Labeling the collective..."
                        value={groupName}
                        onChange={e => setGroupName(e.target.value)}
                        className="w-full bg-[#1A1A1C] border border-outline-variant rounded-[1.8rem] py-5 px-8 text-[15px] font-bold outline-none focus:ring-4 focus:ring-noir-accent/20 transition-all text-white placeholder:text-text-muted uppercase tracking-widest"
                     />
                  </div>
               </div>

               {/* Selected Members Preview */}
               <AnimatePresence>
                 {selectedIds.length > 0 && (
                   <motion.div 
                     initial={{ opacity: 0, scale: 0.98 }}
                     animate={{ opacity: 1, scale: 1 }}
                     className="space-y-4"
                   >
                     <div className="flex justify-between items-center px-1">
                        <span className="text-[10px] font-black text-text-muted uppercase tracking-widest leading-none">Linked Entities ({selectedIds.length})</span>
                     </div>
                     <div className="flex flex-wrap gap-4 p-5 bg-[#1A1A1C] rounded-[2rem] border border-outline-variant">
                       {selectedProfiles.map(p => (
                         <div key={p.id} className="relative group">
                            <div className="w-12 h-12 rounded-[1rem] overflow-hidden border border-noir-accent/30 shadow-lg">
                               <img src={getAvatarUrl(p)} className="w-full h-full object-cover" alt="" />
                            </div>
                            <button 
                              onClick={() => toggleSelect(p.id)}
                              className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-white text-noir-bg rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
                            >
                              <X size={12} strokeWidth={4} />
                            </button>
                         </div>
                       ))}
                     </div>
                   </motion.div>
                 )}
               </AnimatePresence>

               {/* Search & Select */}
               <div className="space-y-6">
                  <div className="relative group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-white transition-colors" />
                    <input 
                      type="text"
                      placeholder="Protocol Discovery"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="w-full bg-noir-bg border border-outline-variant rounded-[1.8rem] py-5 pl-14 pr-6 text-[14px] font-medium outline-none focus:ring-4 focus:ring-noir-accent/10 transition-all text-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-1 max-h-[280px] overflow-y-auto no-scrollbar pr-2">
                    {filteredProfiles.map(profile => (
                      <button
                        key={profile.id}
                        onClick={() => toggleSelect(profile.id)}
                        className="flex items-center gap-5 p-4 rounded-[1.8rem] transition-all hover:bg-[#1A1A1C] border border-transparent hover:border-outline-variant group active:scale-[0.98]"
                      >
                        <div className="w-14 h-14 rounded-[1.4rem] overflow-hidden bg-noir-bg border border-outline-variant shrink-0">
                          <img src={getAvatarUrl(profile)} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 text-left">
                          <h4 className="text-[14px] font-display font-black text-white uppercase tracking-tight group-hover:text-noir-accent transition-colors">{profile.name}</h4>
                          <p className="text-[10px] text-text-muted font-black uppercase tracking-widest mt-0.5">@{profile.username || 'unknown'}</p>
                        </div>
                        <div className="w-10 h-10 rounded-[1.2rem] bg-noir-bg border border-outline-variant flex items-center justify-center text-text-muted group-hover:bg-noir-accent group-hover:text-white group-hover:border-noir-accent transition-all">
                          <Plus size={20} strokeWidth={3} />
                        </div>
                      </button>
                    ))}
                  </div>
               </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-10 bg-[#131315] border-t border-outline-variant flex gap-4">
              <button 
                onClick={() => setNewGroupModalOpen(false)}
                className="flex-1 px-8 py-5 bg-[#1A1A1C] border border-outline-variant rounded-[1.8rem] text-[11px] font-black uppercase tracking-widest text-text-muted hover:text-white hover:bg-surface-bubble transition-all"
              >
                Abort
              </button>
              <button 
                disabled={loading || !groupName}
                onClick={handleCreateGroup}
                className={`flex-1 px-8 py-5 rounded-[1.8rem] text-[11px] font-black uppercase tracking-widest transition-all shadow-[0_20px_50px_-15px_rgba(0,0,0,0.4)] flex items-center justify-center gap-3 ${
                  loading || !groupName
                    ? 'bg-[#1A1A1C] text-text-muted opacity-40 cursor-not-allowed border border-outline-variant'
                    : 'bg-noir-accent text-white hover:scale-[1.03] active:scale-95 shadow-noir-accent/30'
                }`}
              >
                {loading ? 'Initializing...' : (
                  <>
                    <span>Assemble Group</span>
                    <ArrowRight size={14} strokeWidth={3} />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
