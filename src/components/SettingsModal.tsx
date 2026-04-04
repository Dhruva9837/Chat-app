'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, User, Settings, Palette, Bell, Shield, LogOut, Check, Edit2, Monitor, Eye, Trash2 } from 'lucide-react'
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
  const { profile, updateProfile, signOut } = useAuthStore()
  const [activeTab, setActiveTab] = useState('My Account')
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(profile?.name || '')
  const [editBio, setEditBio] = useState(profile?.bio || '')
  const [editUsername, setEditUsername] = useState(profile?.username || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Local settings (in a real app, these would come from a user_settings table)
  const [localSettings, setLocalSettings] = useState({
    allowDMs: true,
    safeMessaging: true,
    reducedMotion: false,
    notifications: true,
    sound: true
  })

  const toggleSetting = (key: string) => {
    setLocalSettings(s => ({ ...s, [key]: !s[key as keyof typeof s] }))
  }

  useEffect(() => {
    if (isSettingsModalOpen) {
      setEditName(profile?.name || '')
      setEditBio(profile?.bio || '')
      setEditUsername(profile?.username || '')
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
        username: editUsername 
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
    { label: 'Profiles', icon: Eye },
    { label: 'Privacy & Safety', icon: Shield },
    { label: 'App Settings', type: 'header' },
    { label: 'Appearance', icon: Palette },
    { label: 'Accessibility', icon: Monitor },
    { label: 'Notifications', icon: Bell },
    { label: 'Log Out', icon: LogOut, action: signOut, color: 'text-presence-dnd' }
  ]

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      className="fixed inset-0 z-[200] bg-surface-lowest flex overflow-hidden font-sans"
    >
      {/* Left Sidebar */}
      <div className="w-[280px] md:w-[320px] bg-surface-low border-r border-outline-variant flex flex-col pt-24 pb-12 px-8 overflow-y-auto no-scrollbar">
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
              <TabItem 
                key={tab.label} 
                tab={tab} 
                activeTab={activeTab} 
                setActiveTab={setActiveTab} 
              />
            )
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-surface-lowest relative flex flex-col">
        <button 
          onClick={() => setSettingsModalOpen(false)}
          className="absolute top-8 right-8 p-4 bg-primary text-white hover:bg-primary-container rounded-2xl transition-all group z-50 shadow-2xl shadow-primary/20 scale-110 active:scale-95 flex items-center space-x-2"
        >
          <X className="w-5 h-5" />
          <span className="text-[10px] font-black uppercase tracking-widest hidden md:block">Close</span>
        </button>

        <div className="flex-1 overflow-y-auto pt-24 pb-32 px-12 md:px-24 max-w-4xl no-scrollbar">
          {activeTab === 'My Account' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
              <h1 className="text-3xl font-display font-black uppercase tracking-tight text-text-main">My Account</h1>
              
              {/* Profile Card */}
              <div className="bg-surface-low rounded-[2.5rem] p-8 border border-outline-variant overflow-hidden relative group shadow-sm transition-all duration-500">
                <div className="absolute top-0 left-0 w-full h-24 bg-primary" />
                <div className="relative z-10 flex flex-col md:flex-row items-center md:items-end justify-between px-2">
                   <div className="flex flex-col md:flex-row items-center md:items-end space-y-4 md:space-y-0 md:space-x-6">
                      <div className="w-24 h-24 rounded-[2rem] overflow-hidden border-8 border-surface-low relative group/avatar shadow-2xl bg-white cursor-pointer">
                        <img src={getAvatarUrl(profile)} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center transition-all">
                           <Edit2 className="w-5 h-5 text-white mb-1" />
                           <span className="text-[8px] font-black text-white uppercase tracking-tighter">Change</span>
                        </div>
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
                <div className="mt-8 bg-surface-lowest/40 backdrop-blur-md rounded-[2.5rem] p-8 md:p-12 border border-outline-variant space-y-10">
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

          {activeTab === 'Profiles' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
              <h1 className="text-3xl font-display font-black uppercase tracking-tight text-text-main">Profiles</h1>
              <div className="space-y-8">
                <AppearanceOption label="User Profile" desc="Personalize how you appear to others on Nexora." />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-6">
                      <div>
                         <div className="flex flex-wrap gap-3">
                            {/* None Option */}
                            <button 
                               onClick={() => updateProfile({ avatar_decoration: undefined })}
                               className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${!profile?.avatar_decoration ? 'border-primary bg-primary/10 shadow-lg scale-110' : 'border-outline-variant hover:border-zinc-400'}`}
                            >
                               <X className="w-5 h-5 text-text-muted" />
                            </button>
                            {/* Colors */}
                            {['#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6'].map(color => {
                               const isActive = profile?.avatar_decoration === color
                               return (
                               <button 
                               key={color} 
                               onClick={() => updateProfile({ avatar_decoration: color })}
                               className={`w-10 h-10 rounded-full border-4 border-white shadow-md transition-all relative group ${isActive ? 'scale-125 ring-4 ring-primary translate-y-[-4px] z-10' : 'hover:scale-110 hover:translate-y-[-2px]'}`} 
                               style={{ backgroundColor: color }}
                             >
                                {isActive && (
                                   <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute inset-0 flex items-center justify-center">
                                      <Check className="w-5 h-5 text-white drop-shadow-md" />
                                   </motion.div>
                                )}
                             </button>
                               )
                            })}
                         </div>
                      </div>
                      <div className="p-6 bg-surface-low rounded-[1.8rem] border border-outline-variant">
                         <h4 className="text-xs font-black uppercase tracking-tight text-text-main mb-2">Profile Theme</h4>
                         <p className="text-[10px] text-text-muted font-bold mb-4 uppercase tracking-widest">Choose between dark and custom profile themes.</p>
                         <div className="w-full h-8 bg-primary rounded-lg shadow-lg border border-white" />
                      </div>
                   </div>
                   {/* Preview Card */}
                   <div className="bg-surface-low rounded-[2.5rem] p-8 border border-outline-variant relative overflow-hidden h-fit shadow-xl">
                      <div className="absolute top-0 left-0 w-full h-16 bg-primary/20" />
                       <div className="relative z-10 flex flex-col items-center">
                          <div className="relative group/preview mb-4">
                             <div className="w-24 h-24 rounded-3xl overflow-hidden border-4 border-surface-low shadow-2xl bg-white transition-transform group-hover/preview:scale-105">
                                <img src={getAvatarUrl(profile)} alt="" className="w-full h-full object-cover" />
                             </div>
                             <button 
                               onClick={() => setActiveTab('My Account')}
                               className="absolute -bottom-2 -right-2 bg-primary text-white p-2 rounded-xl shadow-lg border-2 border-surface-low hover:scale-110 active:scale-95 transition-all"
                             >
                                <Edit2 className="w-3.5 h-3.5" />
                             </button>
                          </div>
                          <h3 className="font-display font-black text-xl uppercase tracking-tight text-text-main">{profile?.name || 'Nexora User'}</h3>
                          <p className="text-xs font-black text-primary uppercase tracking-widest mt-1">@{profile?.username || 'user'}</p>
                          <div className="w-full h-px bg-outline-variant my-5" />
                          <p className="text-[11px] text-text-muted text-center font-bold uppercase tracking-wider leading-relaxed px-4">
                             {profile?.bio || 'Customize your digital identity in the Nexus Nebula.'}
                          </p>
                       </div>
                    </div>
                 </div>

                 {/* New Action Bar in Profiles */}
                 <div className="mt-8 flex flex-col md:flex-row items-center justify-between p-8 bg-surface-low rounded-[2.5rem] border border-outline-variant gap-6">
                    <div className="flex items-center space-x-4">
                       <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                          <Palette className="w-6 h-6 text-primary" />
                       </div>
                       <div>
                          <h4 className="text-sm font-black uppercase text-text-main tracking-tight">Profile Decoration</h4>
                          <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Your changes are synced in real-time.</p>
                       </div>
                    </div>
                    <button 
                       onClick={() => setActiveTab('My Account')}
                       className="w-full md:w-auto bg-primary text-white px-8 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center space-x-3"
                    >
                       <span>Save & Edit Identity</span>
                       <User className="w-4 h-4" />
                    </button>
                 </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'Privacy & Safety' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
              <h1 className="text-3xl font-display font-black uppercase tracking-tight text-text-main">Privacy & Safety</h1>
              <div className="space-y-8">
                <AppearanceOption label="Direct Messaging" desc="Control who can message you outside of servers." />
                <div className="space-y-4">
                   <ToggleRow label="Allow direct messages from server members" desc="Automatically permit DMs from people in shared servers." active={localSettings.allowDMs} onClick={() => toggleSetting('allowDMs')} />
                   <ToggleRow label="Safe Direct Messaging" desc="Scan and delete messages that contain explicit content." active={localSettings.safeMessaging} onClick={() => toggleSetting('safeMessaging')} />
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
                      <div className="absolute top-0 left-0 w-1 h-full bg-primary/20" />
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
                   <ToggleRow label="Enable Desktop Notifications" desc="Get alerts when the browser is backgrounded." active={localSettings.notifications} onClick={() => toggleSetting('notifications')} />
                   <ToggleRow label="Enable Sounds" desc="Play audio alerts for messages and calls." active={localSettings.sound} onClick={() => toggleSetting('sound')} />
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
          ? 'bg-primary text-white shadow-xl shadow-primary/30 scale-[1.02]' 
          : 'text-text-muted hover:bg-surface-low hover:text-text-main'
      }`}
    >
      <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-text-muted group-hover:text-primary transition-colors'}`} />
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
