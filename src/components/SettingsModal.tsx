'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, User, Settings, Palette, Bell, Shield, LogOut, Check, Edit2, Monitor, Eye, Trash2, ArrowLeft } from 'lucide-react'
import { useChatStore } from '@/store/chatStore'
import { useAuthStore } from '@/store/authStore'
import { getAvatarUrl } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

export function SettingsModal() {
  const { 
    isSettingsModalOpen, 
    setSettingsModalOpen, 
    theme, 
    setTheme, 
    fontSize, 
    setFontSize 
  } = useChatStore()
  const { profile, settings, updateProfile, updateSettings, signOut } = useAuthStore()
  const [activeTab, setActiveTab] = useState('My Account')
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(profile?.name || '')
  const [editBio, setEditBio] = useState(profile?.bio || '')
  const [editUsername, setEditUsername] = useState(profile?.username || '')
  const [editJobTitle, setEditJobTitle] = useState(profile?.job_title || '')
  const [editLocation, setEditLocation] = useState(profile?.location || '')
  const [editWebsite, setEditWebsite] = useState(profile?.website || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !profile?.id) return
    const file = e.target.files[0]
    setUploadingAvatar(true)
    setError('')
    try {
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

      await updateProfile({ avatar_url: publicUrl })
    } catch (err: any) {
      setError(err.message || 'Error uploading image')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const [mobileShowContent, setMobileShowContent] = React.useState(false)

  const toggleSetting = async (key: string) => {
    if (!settings) return
    const currentVal = (settings as any)[key]
    await updateSettings({ [key]: !currentVal })
  }

  useEffect(() => {
    if (isSettingsModalOpen) {
      setEditName(profile?.name || '')
      setEditBio(profile?.bio || '')
      setEditUsername(profile?.username || '')
      setEditJobTitle(profile?.job_title || '')
      setEditLocation(profile?.location || '')
      setEditWebsite(profile?.website || '')
      setError('')
    }
  }, [isSettingsModalOpen, profile])

  if (!isSettingsModalOpen) return null

  const handleSaveProfile = async () => {
    setSaving(true)
    setError('')
    try {
      // 1. Check username uniqueness if changed
      if (editUsername !== profile?.username) {
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', editUsername)
          .single()
        
        if (existingUser) throw new Error('Username is already taken.')
      }

      await updateProfile({ 
        name: editName, 
        bio: editBio,
        username: editUsername,
        job_title: editJobTitle,
        location: editLocation,
        website: editWebsite
      })
      setIsEditing(false)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const tabs = [
    { label: 'User Settings', type: 'header' },
    { label: 'My Account', icon: User },
    { label: 'Privacy & Safety', icon: Shield },
    { label: 'App Settings', type: 'header' },
    { label: 'Appearance', icon: Palette },
    { label: 'Accessibility', icon: Monitor },
    { label: 'Notifications', icon: Bell },
    { label: 'Log Out', icon: LogOut, action: signOut, color: 'text-presence-dnd' }
  ]

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 1.05 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="fixed inset-0 z-[200] bg-surface-lowest flex flex-col md:flex-row overflow-hidden font-sans"
    >
      {/* Left Sidebar - Full width on mobile, fixed on desktop */}
      <div className={`${
        mobileShowContent ? 'hidden md:flex' : 'flex'
      } w-full md:w-[280px] lg:w-[320px] bg-surface-low border-b md:border-b-0 md:border-r border-outline-variant flex-col pt-16 md:pt-24 pb-12 px-8 overflow-y-auto no-scrollbar shrink-0`}>
        {/* Mobile Header */}
        <div className="flex items-center justify-between md:hidden mb-6">
          <h2 className="text-base font-black uppercase tracking-widest text-text-main">Settings</h2>
          <button onClick={() => setSettingsModalOpen(false)} className="p-2 bg-primary text-white rounded-xl">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-1">
          {tabs.map((tab, idx) => {
            if (tab.type === 'header') {
              return (
                <div key={idx} className="px-4 mb-3 mt-6 first:mt-0">
                  <h3 className="text-[10px] font-black uppercase text-text-main/60 tracking-[0.25em]">{tab.label}</h3>
                </div>
              )
            }
            
            if (tab.label === 'Log Out') {
              return (
                <div key={idx} className="mt-8 pt-8 border-t border-outline-variant/60">
                   <button
                    onClick={signOut}
                    className="w-full flex items-center space-x-4 px-5 py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] text-presence-dnd hover:bg-presence-dnd/10 transition-all group"
                  >
                    <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <span>Log Out</span>
                  </button>
                </div>
              )
            }

            return (
              <div key={tab.label} onClick={() => setMobileShowContent(true)}>
                <TabItem 
                  tab={tab} 
                  activeTab={activeTab} 
                  setActiveTab={setActiveTab} 
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* Main Content Area - hidden on mobile until tab selected */}
      <div className={`${
        mobileShowContent ? 'flex' : 'hidden md:flex'
      } flex-1 bg-surface-lowest relative flex-col overflow-hidden`}>
        {/* Mobile Back Button */}
        <button 
          onClick={() => setMobileShowContent(false)}
          className="md:hidden absolute top-4 left-4 z-50 flex items-center space-x-2 px-4 py-2 bg-surface-low rounded-2xl border border-outline-variant text-text-muted text-[11px] font-black uppercase tracking-widest"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <button 
          onClick={() => setSettingsModalOpen(false)}
          className="absolute top-8 right-8 p-4 bg-noir-accent text-white hover:bg-noir-accent/80 rounded-2xl transition-all group z-50 shadow-2xl shadow-noir-accent/20 scale-110 active:scale-95 hidden md:flex items-center space-x-2"
        >
          <X className="w-5 h-5" />
          <span className="text-[10px] font-black uppercase tracking-widest hidden md:block">Close</span>
        </button>

        <div className="flex-1 overflow-y-auto pt-16 md:pt-24 pb-32 px-6 md:px-24 max-w-4xl no-scrollbar">
          {activeTab === 'My Account' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
              <h1 className="text-3xl font-display font-black uppercase tracking-tight text-text-main">My Account</h1>
              
              {/* Profile Card */}
              <div className="bg-surface-low rounded-[2.5rem] p-8 border border-outline-variant overflow-hidden relative group shadow-sm transition-all duration-500">
                <div className="absolute top-0 left-0 w-full h-24 bg-noir-accent/20" />
                <div className="relative z-10 flex flex-col md:flex-row items-center md:items-end justify-between px-2">
                   <div className="flex flex-col md:flex-row items-center md:items-end space-y-4 md:space-y-0 md:space-x-6">
                      <div className="w-24 h-24 rounded-[2rem] overflow-hidden border-8 border-surface-low relative group/avatar shadow-2xl bg-surface-lowest cursor-pointer">
                        <img src={getAvatarUrl(profile)} alt="" className="w-full h-full object-cover" />
                        <label className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center transition-all opacity-0 group-hover/avatar:opacity-100 cursor-pointer">
                           <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
                           {uploadingAvatar ? (
                             <span className="text-[10px] font-black text-white uppercase tracking-widest mt-2 animate-pulse">Uploading...</span>
                           ) : (
                             <>
                               <Edit2 className="w-5 h-5 text-white mb-1" />
                               <span className="text-[8px] font-black text-white uppercase tracking-tighter">Upload</span>
                             </>
                           )}
                        </label>
                      </div>
                      <div className="pb-2 text-center md:text-left">
                        <h2 className="text-2xl font-display font-black uppercase tracking-tight text-text-main">{profile?.name || 'Nexora User'}</h2>
                        <p className="text-sm font-black text-primary uppercase tracking-widest leading-none">
                          {profile?.username ? `@${profile.username}` : 'Not set'}
                        </p>
                      </div>
                   </div>
                    <button 
                      onClick={() => setIsEditing(!isEditing)}
                      className={`mb-2 px-6 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all shadow-lg
                        ${isEditing 
                          ? 'bg-surface-lowest text-text-main border border-outline-variant hover:bg-surface-low' 
                          : 'bg-primary text-white hover:shadow-primary/30 hover:scale-105 active:scale-95'}`}
                    >
                      {isEditing ? 'Cancel Edit' : 'Edit User Profile'}
                    </button>
                </div>

                {/* Account Details Box */}
                <div className="mt-8 bg-surface-low/80 backdrop-blur-md rounded-[2.5rem] p-8 md:p-12 border border-outline-variant space-y-10">
                    <DetailRow label="Display Name" 
                     value={isEditing ? (
                       <input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Enter display name" className="bg-surface-low border border-outline-variant rounded-xl px-4 py-2 outline-none text-text-main w-full focus:ring-2 ring-primary/20 transition-all font-bold" />
                     ) : (profile?.name || 'Nexora User')} />
                    
                    <DetailRow label="Username" 
                     value={isEditing ? (
                       <div className="relative w-full">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-bold">@</span>
                          <input value={editUsername} onChange={(e) => setEditUsername(e.target.value.toLowerCase())} placeholder="username" className="bg-surface-low border border-outline-variant rounded-xl pl-10 pr-4 py-2 outline-none text-text-main w-full focus:ring-2 ring-primary/20 transition-all font-bold" />
                       </div>
                     ) : (profile?.username ? `@${profile.username}` : 'Not set')} />
                    
                    <DetailRow label="Email" value={profile?.email || 'user@nexora.com'} isPrivate />

                    <DetailRow label="Role / Job Title" 
                     value={isEditing ? (
                       <input value={editJobTitle} onChange={(e) => setEditJobTitle(e.target.value)} placeholder="e.g. UI/UX Designer" className="bg-surface-low border border-outline-variant rounded-xl px-4 py-2 outline-none text-text-main w-full focus:ring-2 ring-primary/20 transition-all font-bold" />
                     ) : (profile?.job_title || 'Nexora User')} />

                    <DetailRow label="Location" 
                     value={isEditing ? (
                       <input value={editLocation} onChange={(e) => setEditLocation(e.target.value)} placeholder="e.g. San Francisco, CA" className="bg-surface-low border border-outline-variant rounded-xl px-4 py-2 outline-none text-text-main w-full focus:ring-2 ring-primary/20 transition-all font-bold" />
                     ) : (profile?.location || 'Not set')} />

                    <DetailRow label="Website" 
                     value={isEditing ? (
                       <input value={editWebsite} onChange={(e) => setEditWebsite(e.target.value)} placeholder="https://..." className="bg-surface-low border border-outline-variant rounded-xl px-4 py-2 outline-none text-text-main w-full focus:ring-2 ring-primary/20 transition-all font-bold" />
                     ) : (profile?.website || 'Not set')} />
                    
                    <DetailRow label="About Me" 
                     value={isEditing ? (
                       <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} placeholder="Tell us about yourself..." className="bg-surface-low border border-outline-variant rounded-xl px-4 py-4 outline-none text-text-main w-full h-32 resize-none focus:ring-2 ring-primary/20 transition-all font-bold" />
                     ) : (profile?.bio || 'No bio yet...')} />
                 </div>
                
                {error && <p className="text-presence-dnd text-xs font-black uppercase tracking-widest mt-4 px-8">{error}</p>}

                {isEditing && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 flex justify-end">
                    <button 
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="bg-primary text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}



          {activeTab === 'Privacy & Safety' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
              <h1 className="text-3xl font-display font-black uppercase tracking-tight text-text-main">Privacy & Safety</h1>
              <div className="space-y-8">
                <AppearanceOption label="Direct Messaging" desc="Control who can message you outside of servers." />
                <div className="space-y-4">
                   <ToggleRow label="Allow direct messages from server members" desc="Automatically permit DMs from people in shared servers." active={settings?.allow_dms ?? true} onClick={() => toggleSetting('allow_dms')} />
                   <ToggleRow label="Safe Direct Messaging" desc="Scan and delete messages that contain explicit content." active={settings?.safe_messaging ?? true} onClick={() => toggleSetting('safe_messaging')} />
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'Appearance' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
               <h1 className="text-3xl font-display font-black uppercase tracking-tight text-text-main">Appearance</h1>
               <div className="space-y-8">
                  <AppearanceOption label="Interface Theme" desc="Choose between a dark or light theme for Nexora." />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <ThemeCard label="Dark" active={theme === 'dark'} onClick={() => setTheme('dark')} bg="bg-slate-900" />
                      <ThemeCard label="Light" active={theme === 'light'} onClick={() => setTheme('light')} bg="bg-slate-50" border />
                      <ThemeCard label="Midnight" active={theme === 'midnight'} onClick={() => setTheme('midnight')} bg="bg-slate-950" shadow="shadow-indigo-500/10" />
                  </div>
                  <AppearanceOption label="Messaging View" desc="Choose how your messages appear in the chat." />
                  <div className="space-y-4">
                     <div className="p-4 bg-surface-low rounded-2xl border border-outline-variant flex items-center justify-between">
                        <span className="font-bold text-sm text-text-main">Compact (Discord Style)</span>
                        <div className="w-5 h-5 rounded-full border-2 border-primary bg-primary flex items-center justify-center">
                           <Check className="w-3 h-3 text-white" />
                        </div>
                     </div>
                  </div>
               </div>
            </motion.div>
          )}

          {activeTab === 'Accessibility' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
              <h1 className="text-3xl font-display font-black uppercase tracking-tight text-text-main">Accessibility</h1>
              <div className="space-y-8">
                <AppearanceOption label="Chat Font Scaling" desc="Adjust the size of text in your conversations." />
                <div className="px-4 py-8 bg-surface-low rounded-3xl border border-outline-variant">
                   <div className="flex items-center justify-between mb-4 px-2">
                      <span className="text-[10px] font-black text-text-muted uppercase">Min</span>
                      <span className="text-sm font-black text-primary uppercase tracking-widest">Normal</span>
                      <span className="text-[10px] font-black text-text-muted uppercase">Max</span>
                   </div>
                   <input 
                      type="range" 
                      className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-primary" 
                      min="12" 
                      max="24" 
                      value={fontSize} 
                      onChange={(e) => setFontSize(parseInt(e.target.value))}
                   />
                   
                   {/* Real-time Preview Box */}
                   <div className="mt-6 p-6 bg-surface-lowest rounded-[1.5rem] border border-outline-variant relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-1 h-full bg-noir-accent/50" />
                      <p className="text-[10px] font-black uppercase text-text-muted tracking-widest mb-3">Live Preview</p>
                      <div className={`p-4 rounded-2xl bg-surface-low border border-outline-variant/30 text-text-main font-bold transition-all duration-200 shadow-sm`} style={{ fontSize: `${fontSize}px` }}>
                         This is how your messages will look on Nexora.
                      </div>
                   </div>
                </div>
                <ToggleRow label="Reduced Motion" desc="Limits the amount of movement in the interface." active={localSettings.reducedMotion} onClick={() => toggleSetting('reducedMotion')} />
              </div>
            </motion.div>
          )}

          {activeTab === 'Notifications' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
              <h1 className="text-3xl font-display font-black uppercase tracking-tight text-text-main">Notifications</h1>
              <div className="space-y-8">
                <AppearanceOption label="Global Settings" desc="Control how you want to be notified." />
                <div className="space-y-4">
                   <ToggleRow label="Enable Desktop Notifications" desc="Get alerts when the browser is backgrounded." active={settings?.notifications_enabled ?? true} onClick={() => toggleSetting('notifications_enabled')} />
                   <ToggleRow label="Enable Sounds" desc="Play audio alerts for messages and calls." active={settings?.sound_enabled ?? true} onClick={() => toggleSetting('sound_enabled')} />
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function DetailRow({ label, value, isPrivate }: any) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between pb-8 border-b border-outline-variant/60 last:border-0 last:pb-0 group/row">
       <div className="mb-3 md:mb-0">
          <span className="text-[11px] font-black uppercase text-text-muted tracking-[0.25em]">{label}</span>
          {isPrivate && <span className="ml-3 bg-primary/10 text-primary text-[9px] font-black px-2 py-0.5 rounded-full uppercase">Private</span>}
       </div>
       <div className="flex items-center space-x-3 w-full md:w-3/5">
          <div className={`text-[15px] font-bold flex-1 truncate transition-all duration-300 ${isPrivate ? 'blur-md select-none hover:blur-none cursor-help' : 'text-text-main'}`}>
             {value}
          </div>
       </div>
    </div>
  )
}

function TabItem({ tab, activeTab, setActiveTab }: any) {
  const Icon = tab.icon
  const isActive = activeTab === tab.label
  return (
    <button
      onClick={() => setActiveTab(tab.label)}
      className={`flex items-center space-x-4 px-5 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all group ${
        isActive 
          ? 'bg-noir-accent text-white shadow-xl shadow-noir-accent/30 scale-[1.02]' 
          : 'text-text-muted hover:bg-surface-high hover:text-white'
      }`}
    >
      <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-text-muted group-hover:text-noir-accent transition-colors'}`} />
      <span className="truncate">{tab.label}</span>
    </button>
  )
}

function AppearanceOption({ label, desc }: any) {
  return (
    <div className="px-2">
      <h3 className="text-lg font-display font-black uppercase tracking-tight text-text-main">{label}</h3>
      <p className="text-xs text-text-muted font-bold mt-1 uppercase tracking-widest">{desc}</p>
    </div>
  )
}

function ThemeCard({ label, active, onClick, bg, border }: any) {
  return (
    <div 
      onClick={onClick}
      className={`p-4 rounded-[1.8rem] border-4 transition-all cursor-pointer ${active ? 'border-primary shadow-xl shadow-primary/20 scale-105' : 'border-outline-variant opacity-60 hover:opacity-100 hover:scale-[1.02]'} ${bg} ${border ? 'border-zinc-100' : ''}`}
    >
       <div className="h-20 w-full bg-primary/10 rounded-xl mb-4 flex items-center justify-center">
          {active && <Check className="w-8 h-8 text-primary" />}
       </div>
       <span className={`text-[10px] font-black uppercase tracking-[0.2em] block text-center ${active ? 'text-primary' : 'text-text-muted'}`}>{label}</span>
    </div>
  )
}

function ToggleRow({ label, desc, active, onClick }: any) {
  return (
    <div className="flex items-center justify-between p-6 bg-surface-low rounded-[1.8rem] border border-outline-variant group hover:border-primary/30 transition-all">
       <div className="flex-1 pr-8">
          <h4 className="text-sm font-black uppercase tracking-tight text-text-main">{label}</h4>
          <p className="text-[10px] text-text-muted font-bold mt-1 uppercase tracking-widest">{desc}</p>
       </div>
       <button 
        onClick={onClick}
        className={`w-12 h-6 rounded-full relative transition-all duration-300 ${active ? 'bg-primary shadow-lg shadow-primary/20' : 'bg-zinc-300'}`}
       >
          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${active ? 'left-7' : 'left-1'}`} />
       </button>
    </div>
  )
}
