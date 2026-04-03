'use client'

import React from 'react'
import { MessageSquare, Phone, Users, Archive, Settings, User, LogOut } from 'lucide-react'
import { useChatStore } from '@/store/chatStore'
import { useAuthStore } from '@/store/authStore'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'

export function GlobalSidebar() {
  const { activeView, setActiveView } = useChatStore()
  const { profile } = useAuthStore()

  const navItems = [
    { id: 'chat', icon: MessageSquare, label: 'Chats' },
    { id: 'calls', icon: Phone, label: 'Calls' },
    { id: 'contacts', icon: Users, label: 'Contacts' },
    { id: 'saved', icon: Archive, label: 'Archive' },
  ] as const

  return (
    <div className="hidden md:flex w-20 h-screen bg-white flex-col items-center py-8 border-r border-[#f1f1f1] shrink-0 z-50">
      {/* Brand Logo */}
      <div className="mb-12">
        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center ambient-shadow overflow-hidden relative border border-[#f1f1f1] rotate-3 hover:rotate-0 transition-transform cursor-pointer">
           <img src="/logo.png" alt="Nexora" className="w-full h-full object-cover scale-150" />
        </div>
      </div>

      {/* Nav Items */}
      <div className="flex-1 flex flex-col items-center space-y-4">
        {navItems.map((item) => {
          const isActive = activeView === item.id
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className="relative group p-3 rounded-2xl transition-all hover:bg-surface-low overflow-hidden"
              title={item.label}
            >
              <Icon className={`w-6 h-6 transition-all duration-300 ${isActive ? 'text-primary scale-110' : 'text-zinc-400 group-hover:text-primary/70'}`} />
              {isActive && (
                <motion.div 
                   layoutId="active-nav-glow"
                   className="absolute inset-0 bg-primary/5 rounded-2xl -z-10"
                />
              )}
              <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full transition-transform duration-300 ${isActive ? 'scale-x-100' : 'scale-x-0'}`} />
            </button>
          )
        })}
      </div>

      {/* Bottom Actions */}
      <div className="flex flex-col items-center space-y-6">
        <button 
          onClick={async () => {
            const { error } = await supabase.auth.signOut()
            if (error) console.error('Sign out error:', error)
            window.location.reload()
          }}
          className="p-3 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all group"
          title="Sign Out"
        >
          <LogOut className="w-6 h-6 group-hover:scale-110 transition-transform" />
        </button>
        
        <button 
           className="p-3 text-zinc-400 hover:text-primary hover:bg-surface-low rounded-2xl transition-all"
           title="Settings"
        >
          <Settings className="w-6 h-6" />
        </button>

        <button 
          onClick={() => setActiveView('profile')}
          className={`w-11 h-11 rounded-2xl overflow-hidden ambient-shadow border-2 transition-all active:scale-95 ${activeView === 'profile' ? 'border-primary ring-4 ring-primary/10' : 'border-white hover:border-primary/20'}`}
          title="Profile"
        >
          <img src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.email || profile?.id || 'default'}`} alt="Profile" className="w-full h-full object-cover" />
        </button>
      </div>
    </div>
  )
}
