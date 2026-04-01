'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { User, LogOut, Shield, Bell, Monitor, Search, MoreVertical, Menu, CheckCircle, Sparkles, Globe, Briefcase } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'

export function ProfileView() {
  const { profile, signOut } = useAuthStore()

  return (
    <div className="flex-1 bg-[#f8faff] overflow-y-auto flex flex-col h-screen font-sans">
      {/* Top Bar (Inspired by reference) */}
      <div className="h-20 px-8 flex items-center justify-between sticky top-0 bg-[#f8faff]/80 backdrop-blur-md z-50">
         <div className="flex items-center space-x-6">
            <button className="p-2 text-gray-900 hover:bg-surface-low rounded-lg transition-colors">
               <Menu className="w-6 h-6" />
            </button>
            <h1 className="font-display font-black text-xl text-gray-900 tracking-tight">Profile Details</h1>
         </div>
         <div className="flex items-center space-x-4">
            <button className="p-2 text-zinc-400 hover:text-primary transition-colors">
               <Search className="w-5 h-5" />
            </button>
            <button className="p-2 text-zinc-400 hover:text-primary transition-colors">
               <MoreVertical className="w-5 h-5" />
            </button>
         </div>
      </div>

      <div className="flex-1 px-6 pb-24 flex flex-col items-center">
         <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-[480px] bg-white rounded-[2.5rem] p-10 pb-16 ambient-shadow mt-4 relative overflow-hidden"
         >
            {/* Main Profile Info */}
            <div className="flex flex-col items-center text-center">
               <div className="relative mb-8">
                  <div className="w-48 h-48 rounded-[2rem] bg-surface-low p-1.5 ambient-shadow rotate-3 hover:rotate-0 transition-transform duration-500 overflow-hidden">
                     <img 
                        src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.id || 'alex'}`} 
                        alt="Profile" 
                        className="w-full h-full object-cover rounded-[1.8rem]" 
                     />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-[#006c49] border-4 border-white flex items-center justify-center text-white ambient-shadow">
                     <CheckCircle className="w-5 h-5" />
                  </div>
               </div>

               <div className="flex items-center space-x-3 mb-4">
                  <h2 className="font-display font-black text-4xl text-gray-900 tracking-tight leading-none">
                     {profile?.name || 'Alex Rivers'}
                  </h2>
                  <span className="bg-[#bbf7d0] text-[#006c49] text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest">
                     Online
                  </span>
               </div>

               <p className="text-[#71717a] font-sans leading-relaxed text-[15px] mb-10 max-w-sm">
                  {profile?.bio || "Product Lead at Catalyst Labs. Building high-stakes communication tools for remote-first architectural teams."}
               </p>

               {/* Skill Pills (Reference Style) */}
               <div className="flex flex-wrap justify-center gap-3 mb-12">
                  <SkillTag icon={Sparkles} label="STRATEGY" />
                  <SkillTag icon={Globe} label="UX DESIGN" />
                  <SkillTag icon={Briefcase} label="REMOTE OPS" />
               </div>

               {/* Stats (Reference Style) */}
               <div className="w-full pt-10 border-t border-zinc-100/80 flex items-center justify-between px-2">
                  <StatItem label="PROJECTS" value="42" />
                  <div className="w-px h-10 bg-zinc-100" />
                  <StatItem label="RATING" value="4.9" />
                  <div className="w-px h-10 bg-zinc-100" />
                  <StatItem label="JOINED" value="2021" />
               </div>
            </div>
         </motion.div>
         
         <button 
           onClick={() => signOut()}
           className="mt-12 group flex items-center space-x-3 text-tertiary-presence hover:bg-tertiary-presence/5 px-6 py-3 rounded-xl transition-all"
         >
            <LogOut className="w-5 h-5" />
            <span className="text-xs font-black uppercase tracking-[0.2em]">Terminate Session</span>
         </button>
      </div>
    </div>
  )
}

function SkillTag({ icon: Icon, label }: any) {
  return (
    <div className="flex items-center space-x-2 bg-[#f8faff] ghost-border border-[#eef2ff] px-5 py-3 rounded-xl hover:bg-white transition-all ambient-shadow shadow-none hover:shadow-lg">
       <Icon className="w-4 h-4 text-primary" />
       <span className="text-[10px] font-black tracking-widest text-[#1b1b1b] uppercase">{label}</span>
    </div>
  )
}

function StatItem({ label, value }: any) {
  return (
    <div className="flex flex-col items-center text-center">
       <span className="text-[10px] font-black text-zinc-400 tracking-[0.2em] mb-2 uppercase">{label}</span>
       <span className="text-2xl font-display font-black text-gray-900 tracking-tight">{value}</span>
    </div>
  )
}
