'use client'

import React, { useState } from 'react'
import { 
  Settings, 
  Palette, 
  Bell, 
  Shield, 
  Monitor, 
  Volume2, 
  Eye, 
  Moon, 
  Sun,
  ChevronRight,
  LogOut,
  User,
  Lock,
  Globe,
  Trash2,
  HelpCircle,
  Info
} from 'lucide-react'
import { useChatStore } from '@/store/chatStore'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'

export function SettingsView() {
  const { fontSize, setFontSize, theme, setTheme } = useChatStore()
  const { user, profile } = useAuthStore()
  const [notif, setNotif] = useState(true)
  const [sound, setSound] = useState(true)
  const [readReceipts, setReadReceipts] = useState(true)
  const [onlineStatus, setOnlineStatus] = useState(true)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
    <button 
      onClick={onChange}
      className={`w-11 h-6 rounded-full relative transition-all duration-300 ${
        value ? 'bg-noir-accent shadow-md shadow-noir-accent/30' : 'bg-surface-highest'
      }`}
    >
      <motion.div 
        animate={{ x: value ? 20 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
      />
    </button>
  )

  const SettingRow = ({ 
    icon: Icon, 
    label, 
    description, 
    toggle, 
    value, 
    onChange, 
    onClick,
    danger 
  }: {
    icon: any
    label: string
    description?: string
    toggle?: boolean
    value?: boolean
    onChange?: () => void
    onClick?: () => void
    danger?: boolean
  }) => (
    <button
      onClick={onClick || onChange}
      className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all group ${
        danger 
          ? 'hover:bg-red-500/10 text-red-400' 
          : 'hover:bg-[#1E1E20]'
      }`}
    >
      <div className={`w-10 h-10 rounded-[1rem] flex items-center justify-center shrink-0 ${
        danger 
          ? 'bg-red-500/10 text-red-400' 
          : 'bg-surface-high text-text-muted group-hover:text-noir-accent group-hover:bg-noir-accent/10'
      } transition-colors`}>
        <Icon size={18} />
      </div>
      <div className="flex-1 text-left">
        <span className={`text-sm font-bold block ${danger ? 'text-red-400' : 'text-white'}`}>{label}</span>
        {description && (
          <span className="text-[11px] text-text-muted font-medium">{description}</span>
        )}
      </div>
      {toggle && onChange ? (
        <Toggle value={value!} onChange={onChange} />
      ) : (
        !danger && <ChevronRight size={16} className="text-text-muted opacity-0 group-hover:opacity-100 transition-all" />
      )}
    </button>
  )

  return (
    <div className="flex-1 overflow-y-auto bg-surface-lowest flex flex-col h-[100dvh] font-sans no-scrollbar">
      {/* Header */}
      <div className="px-10 py-12 border-b border-outline-variant bg-surface-lowest/80 backdrop-blur-md z-10 sticky top-0 shrink-0">
        <h1 className="text-4xl font-black font-display tracking-tight text-white mb-2">Settings</h1>
        <p className="text-text-muted font-bold text-sm tracking-wide">Manage your account, privacy, and preferences</p>
      </div>

      <div className="flex-1 px-10 py-8 max-w-2xl w-full space-y-6">
        
        {/* Profile Card */}
        <div className="bg-surface-low rounded-[2rem] p-6 border border-outline-variant flex items-center gap-5">
          <div className="w-16 h-16 rounded-[1.5rem] overflow-hidden border-2 border-outline-variant shrink-0 bg-surface-high">
            <img 
              src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`} 
              alt="Profile" 
              className="w-full h-full object-cover" 
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-white truncate">{profile?.name || 'User'}</h3>
            <p className="text-text-muted text-sm font-medium truncate">{user?.email}</p>
          </div>
          <button 
            onClick={() => useChatStore.getState().setActiveView('profile')}
            className="px-5 py-2.5 bg-surface-high border border-outline-variant text-white text-xs font-bold rounded-xl hover:border-noir-accent hover:text-noir-accent transition-all"
          >
            Edit Profile
          </button>
        </div>

        {/* Appearance Section */}
        <div className="bg-surface-low rounded-[2rem] border border-outline-variant overflow-hidden">
          <div className="flex items-center gap-3 px-6 pt-6 pb-2">
            <Palette size={16} className="text-noir-accent" />
            <h2 className="text-xs font-black uppercase text-text-muted tracking-widest">Appearance</h2>
          </div>
          <div className="p-2">
            <SettingRow 
              icon={theme !== 'light' ? Moon : Sun} 
              label="Dark Mode" 
              description="Use the dark theme across the app"
              toggle 
              value={theme !== 'light'} 
              onChange={() => setTheme(theme === 'light' ? 'dark' : 'light')} 
            />
            
            {/* Font Size Slider */}
            <div className="px-4 py-3">
              <div className="p-4 bg-surface-lowest rounded-2xl border border-outline-variant">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[1rem] bg-surface-high flex items-center justify-center text-text-muted">
                      <Monitor size={18} />
                    </div>
                    <span className="text-sm font-bold text-white">Chat Font Size</span>
                  </div>
                  <span className="text-xs font-black text-noir-accent bg-noir-accent/10 px-3 py-1 rounded-full">{fontSize}px</span>
                </div>
                <input 
                  type="range" 
                  min="12" 
                  max="24" 
                  value={fontSize} 
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full accent-[#4F8CFF] h-1 appearance-none bg-surface-highest rounded-full cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-noir-accent [&::-webkit-slider-thumb]:shadow-lg" 
                />
                <div className="flex justify-between mt-2">
                  <span className="text-[10px] text-text-muted font-bold">Small</span>
                  <span className="text-[10px] text-text-muted font-bold">Large</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="bg-surface-low rounded-[2rem] border border-outline-variant overflow-hidden">
          <div className="flex items-center gap-3 px-6 pt-6 pb-2">
            <Bell size={16} className="text-noir-accent" />
            <h2 className="text-xs font-black uppercase text-text-muted tracking-widest">Notifications</h2>
          </div>
          <div className="p-2">
            <SettingRow 
              icon={Bell} 
              label="Push Notifications" 
              description="Get notified about new messages"
              toggle 
              value={notif} 
              onChange={() => setNotif(!notif)} 
            />
            <SettingRow 
              icon={Volume2} 
              label="Sound Effects" 
              description="Play sounds for incoming messages"
              toggle 
              value={sound} 
              onChange={() => setSound(!sound)} 
            />
          </div>
        </div>

        {/* Privacy Section */}
        <div className="bg-surface-low rounded-[2rem] border border-outline-variant overflow-hidden">
          <div className="flex items-center gap-3 px-6 pt-6 pb-2">
            <Shield size={16} className="text-noir-accent" />
            <h2 className="text-xs font-black uppercase text-text-muted tracking-widest">Privacy & Security</h2>
          </div>
          <div className="p-2">
            <SettingRow 
              icon={Eye} 
              label="Read Receipts" 
              description="Let others know when you've read messages"
              toggle 
              value={readReceipts} 
              onChange={() => setReadReceipts(!readReceipts)} 
            />
            <SettingRow 
              icon={Globe} 
              label="Online Status" 
              description="Show when you're active on the platform"
              toggle 
              value={onlineStatus} 
              onChange={() => setOnlineStatus(!onlineStatus)} 
            />
            <SettingRow 
              icon={Lock} 
              label="Change Password" 
              description="Update your account credentials"
            />
          </div>
        </div>

        {/* Help & About */}
        <div className="bg-surface-low rounded-[2rem] border border-outline-variant overflow-hidden">
          <div className="flex items-center gap-3 px-6 pt-6 pb-2">
            <Info size={16} className="text-noir-accent" />
            <h2 className="text-xs font-black uppercase text-text-muted tracking-widest">Support</h2>
          </div>
          <div className="p-2">
            <SettingRow 
              icon={HelpCircle} 
              label="Help Center" 
              description="Get answers to common questions"
            />
            <SettingRow 
              icon={Info} 
              label="About Nexora" 
              description="Version 1.0.0 — Built with precision"
            />
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-surface-low rounded-[2rem] border border-red-500/20 overflow-hidden">
          <div className="p-2">
            <SettingRow 
              icon={LogOut} 
              label="Log Out" 
              description="Sign out of your account"
              danger
              onClick={handleLogout}
            />
            <SettingRow 
              icon={Trash2} 
              label="Delete Account" 
              description="Permanently remove your account and data"
              danger
            />
          </div>
        </div>

        {/* Bottom Padding */}
        <div className="h-12"></div>
      </div>
    </div>
  )
}
