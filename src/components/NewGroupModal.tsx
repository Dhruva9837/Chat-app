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
        .neq('id', user?.id) // Don't show self
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

      const response = await fetch('/api/groups/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: groupName,
          members: selectedIds || [], // Can be empty now
          icon: iconUrl,
          created_by: user.id
        })
      })

      const fullChat = await response.json()
      
      if (!response.ok) throw new Error(fullChat.error || 'Failed to create group')

      if (fullChat) {
        addChat(fullChat)
        setActiveChat(fullChat)
      }

      setNewGroupModalOpen(false)
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
  ).filter(p => !selectedIds.includes(p.id))

  const selectedProfiles = profiles.filter(p => selectedIds.includes(p.id))

  return (
    <AnimatePresence>
      {isNewGroupModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setNewGroupModalOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-xl bg-surface-lowest rounded-[2.5rem] relative z-10 overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border border-outline-variant transition-colors"
          >
            {/* Header */}
            <div className="px-10 pt-10 pb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-text-main leading-tight">Create Group</h2>
                <p className="text-sm text-text-muted font-medium mt-1">Add members and set group details</p>
              </div>
              <button 
                onClick={() => setNewGroupModalOpen(false)} 
                className="w-11 h-11 flex items-center justify-center text-text-muted hover:text-text-main transition-colors bg-surface-low rounded-2xl hover:bg-surface-main transition-all"
              >
                <X size={22} strokeWidth={2.5} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-10 pb-8 space-y-8 no-scrollbar">
              {/* Group Metadata */}
              <div className="flex items-center gap-8 py-2">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-24 h-24 rounded-3xl bg-surface-low border-2 border-dashed border-outline-variant hover:border-mint-500/50 transition-all cursor-pointer overflow-hidden flex items-center justify-center relative group shrink-0"
                >
                  {iconPreview ? (
                    <>
                      <img src={iconPreview} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Camera className="w-8 h-8 text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-text-muted group-hover:text-mint-500 transition-colors">
                      <Camera size={28} />
                    </div>
                  )}
                  <input type="file" ref={fileInputRef} onChange={handleIconChange} accept="image/*" className="hidden" />
                </div>
                
                <div className="flex-1 space-y-2">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1">Group Name</span>
                  <input 
                    type="text"
                    placeholder="Enter group name..."
                    value={groupName}
                    onChange={e => setGroupName(e.target.value)}
                    className="w-full bg-surface-low border border-outline-variant rounded-2xl py-4 px-6 text-base focus:bg-surface-lowest focus:ring-4 focus:ring-mint-500/10 transition-all outline-none text-text-main font-bold placeholder-text-muted/50"
                  />
                </div>
              </div>

              {/* Selected Preview */}
              <AnimatePresence>
                {selectedIds.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4"
                  >
                    <div className="flex justify-between items-center px-1">
                       <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Added Members ({selectedIds.length})</span>
                       <button onClick={() => setSelectedIds([])} className="text-[10px] font-bold text-rose-500 hover:text-rose-600 transition-colors">REMOVE ALL</button>
                    </div>
                    <div className="flex flex-wrap gap-4 p-4 bg-surface-low rounded-3xl border border-outline-variant">
                      {selectedProfiles.map(p => (
                        <motion.div 
                          key={p.id} 
                          layout
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="relative group"
                        >
                          <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-mint-500/30 shadow-md">
                            <img src={getAvatarUrl(p)} className="w-full h-full object-cover" alt="" />
                          </div>
                          <button 
                            onClick={() => toggleSelect(p.id)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-surface-lowest border border-outline-variant text-rose-500 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 shadow-xl z-10"
                          >
                            <X size={14} strokeWidth={3} />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Add Members Search */}
              <div className="space-y-4">
                <div className="relative group">
                  <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-mint-500 transition-colors" />
                  <input 
                    type="text"
                    placeholder="Search people to add..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full bg-surface-lowest border border-outline-variant rounded-2xl py-4 pl-14 pr-6 text-sm font-medium focus:ring-4 focus:ring-mint-500/5 transition-all outline-none text-text-main shadow-sm"
                  />
                </div>

                <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto no-scrollbar pr-1">
                  {filteredProfiles.map(profile => (
                    <button
                      key={profile.id}
                      onClick={() => toggleSelect(profile.id)}
                      className="flex items-center gap-4 p-4 rounded-2xl transition-all border border-transparent hover:bg-surface-low hover:border-outline-variant group active:scale-[0.99]"
                    >
                      <div className="w-12 h-12 rounded-xl overflow-hidden shadow-sm border border-outline-variant bg-surface-lowest shrink-0">
                        <img src={getAvatarUrl(profile)} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 text-left">
                        <h4 className="font-bold text-text-main leading-none mb-1 group-hover:text-mint-500 transition-colors">{profile.name}</h4>
                        <p className="text-xs text-text-muted font-bold truncate">@{profile.username || 'user'}</p>
                      </div>
                      <div className="w-8 h-8 rounded-xl border border-outline-variant flex items-center justify-center text-text-muted group-hover:bg-mint-500 group-hover:border-mint-500 group-hover:text-white transition-all">
                        <Plus size={18} strokeWidth={3} />
                      </div>
                    </button>
                  ))}
                  {filteredProfiles.length === 0 && search && (
                    <div className="text-center py-10">
                      <p className="text-sm font-bold text-text-muted/50">No users found matching "{search}"</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-8 border-t border-outline-variant bg-surface-low/30 flex gap-4">
              <button 
                onClick={() => setNewGroupModalOpen(false)}
                className="flex-1 px-8 py-4 bg-surface-lowest border border-outline-variant rounded-2xl font-bold text-text-muted hover:text-text-main hover:bg-surface-low transition-all"
              >
                Cancel
              </button>
              <button 
                disabled={loading || !groupName}
                onClick={handleCreateGroup}
                className={`flex-1 px-8 py-4 rounded-2xl font-bold transition-all shadow-xl ${
                  loading || !groupName
                    ? 'bg-surface-low text-text-muted cursor-not-allowed border border-outline-variant'
                    : 'bg-mint-500 text-white shadow-mint-500/20 hover:bg-mint-600 hover:scale-[1.02] active:scale-[0.98]'
                }`}
              >
                {loading ? 'Creating...' : 'Launch Group'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
