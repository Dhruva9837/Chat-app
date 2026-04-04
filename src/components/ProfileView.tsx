'use client'

import React, { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { User, LogOut, Shield, Bell, Monitor, Search, MoreVertical, Menu, CheckCircle, Sparkles, Globe, Briefcase, Camera, Loader2, Edit3, X, Save, Grid, Users as UsersIcon, Heart } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { ThemeToggle } from './ThemeToggle'
import { getAvatarUrl } from '@/lib/utils'

export function ProfileView() {
  const { profile, setProfile, signOut } = useAuthStore()
  const [uploading, setUploading] = useState(false)
  const [isEditingBio, setIsEditingBio] = useState(false)
  const [bioContent, setBioContent] = useState(profile?.bio || '')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSaveBio = async () => {
    if (!profile) return
    try {
      setUploading(true)
      const { error } = await supabase
        .from('profiles')
        .update({ bio: bioContent })
        .eq('id', profile.id)
      
      if (error) throw error
      setProfile({ ...profile, bio: bioContent })
      setIsEditingBio(false)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return

    try {
      setUploading(true)
      const fileExt = file.name.split('.').pop()
      const fileName = `${profile.id}-${Math.random()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('chat-media')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('chat-media')
        .getPublicUrl(filePath)

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id)

      if (updateError) throw updateError
      setProfile({ ...profile, avatar_url: publicUrl })

    } catch (error: any) {
       alert(`Upload Error: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex-1 bg-surface-lowest overflow-y-auto flex flex-col h-screen font-sans transition-colors duration-500">
      {/* Reference Header: Solid Teal */}
      <div className="h-24 px-8 flex items-center justify-between sticky top-0 bg-primary z-50 shadow-lg">
         <div className="flex items-center space-x-6">
            <h1 className="font-display font-black text-2xl text-white tracking-widest uppercase">My Profile</h1>
         </div>
         <div className="flex items-center space-x-4">
            <ThemeToggle />
            <button className="p-2 text-white/80 hover:text-white transition-colors">
               <MoreVertical className="w-5 h-5" />
            </button>
         </div>
      </div>

      <div className="flex-1 px-8 py-10 flex flex-col max-w-2xl mx-auto w-full">
         {/* Profile Card Head */}
         <div className="flex items-start justify-between mb-10 bg-surface-low p-8 rounded-[2.5rem]">
            <div className="flex items-center space-x-6">
               <div className="relative group">
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                  <div 
                    onClick={() => !uploading && fileInputRef.current?.click()}
                    className="w-24 h-24 rounded-full bg-surface-lowest p-1 shadow-xl relative cursor-pointer group-hover:scale-105 transition-transform overflow-hidden"
                  >
                     <img 
                        src={getAvatarUrl(profile)} 
                        alt="" 
                        className="w-full h-full rounded-full object-cover" 
                     />
                     {uploading && <div className="absolute inset-0 bg-black/20 flex items-center justify-center"><Loader2 className="w-6 h-6 text-white animate-spin" /></div>}
                  </div>
               </div>
               <div>
                  <h2 className="text-2xl font-display font-black text-text-main tracking-tight leading-none mb-2">{profile?.name || 'User'}</h2>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">UI/UX Designer</p>
               </div>
            </div>
            <button onClick={() => setIsEditingBio(true)} className="p-3 bg-surface-lowest rounded-2xl shadow-sm text-primary hover:scale-110 active:scale-95 transition-all">
               <Edit3 className="w-5 h-5" />
            </button>
         </div>

         {/* Bio Section */}
         <div className="mb-12 px-2">
            <p className="text-[11px] font-black uppercase tracking-widest text-text-muted mb-4">Bio Details</p>
            {isEditingBio ? (
               <div className="space-y-4">
                  <textarea 
                    autoFocus
                    value={bioContent}
                    onChange={e => setBioContent(e.target.value)}
                    className="w-full bg-surface-low border border-primary/20 rounded-3xl p-6 text-[15px] text-text-main outline-none focus:ring-4 focus:ring-primary/5 min-h-[120px]"
                  />
                  <div className="flex justify-end space-x-3">
                     <button onClick={() => setIsEditingBio(false)} className="px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest text-text-muted">Cancel</button>
                     <button onClick={handleSaveBio} className="px-8 py-2.5 bg-primary text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-95">Save Changes</button>
                  </div>
               </div>
            ) : (
               <p className="text-text-muted font-sans leading-relaxed text-[15px]">
                  {profile?.bio || "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout."}
               </p>
            )}
         </div>

         {/* Stats Row */}
         <div className="grid grid-cols-3 gap-6 mb-12 py-8 border-y border-outline-variant">
            <StatColumn label="Public Post" value="522" />
            <StatColumn label="Followers" value="4389" />
            <StatColumn label="Following" value="8543" />
         </div>

         {/* Sections: Friends & Photos */}
         <div className="space-y-12">
            <MediaGrid label="Friends" icon={UsersIcon} count="42" />
            <MediaGrid label="Photos" icon={Grid} />
         </div>

         <button 
           onClick={() => signOut()}
           className="mt-16 w-full py-5 bg-surface-low text-tertiary-presence rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-tertiary-presence/5 transition-all flex items-center justify-center space-x-3"
         >
            <LogOut className="w-5 h-5" />
            <span>Sign Out Workspace</span>
         </button>
      </div>
    </div>
  )
}

function StatColumn({ label, value }: any) {
  return (
    <div className="flex flex-col items-center text-center">
       <span className="text-xl font-display font-black text-text-main tabular-nums">{value}</span>
       <span className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted mt-1">{label}</span>
    </div>
  )
}

function MediaGrid({ label, icon: Icon, count }: any) {
  return (
    <div>
       <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
             <Icon className="w-4 h-4 text-primary" />
             <h3 className="text-[11px] font-black uppercase tracking-widest text-text-main">{label}</h3>
          </div>
          <button className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">See all</button>
       </div>
       <div className="grid grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
             <div key={i} className="aspect-square bg-surface-low rounded-2xl overflow-hidden hover:scale-105 transition-transform cursor-pointer relative group">
                <img src={`https://picsum.photos/seed/${label}${i}/400`} className="w-full h-full object-cover opacity-80" alt="" />
                {i === 4 && count && (
                   <div className="absolute inset-0 bg-primary/80 flex items-center justify-center text-white text-xs font-black">+{count}</div>
                )}
             </div>
          ))}
       </div>
    </div>
  )
}
