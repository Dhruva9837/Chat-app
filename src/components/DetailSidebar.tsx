'use client'

import React from 'react'
import { User, BellOff, Star, ShieldAlert, Ban, ChevronRight, X } from 'lucide-react'
import { useChatStore } from '@/store/chatStore'
import { useAuthStore } from '@/store/authStore'
import { motion, AnimatePresence } from 'framer-motion'
import { getAvatarUrl } from '@/lib/utils'

export function DetailSidebar() {
  const { activeChat, showDetailSidebar, toggleDetailSidebar, messages } = useChatStore()
  const { user } = useAuthStore()

  if (!activeChat) return null

  const isGroup = (activeChat as any).type === 'group'
  const allParticipants = (activeChat as any).chat_participants || []
  const otherParticipant = allParticipants.find((p: any) => p.user_id !== user?.id) || allParticipants[0]
  const participantProfile = otherParticipant?.profiles

  const chatName = isGroup ? (activeChat as any).name : (participantProfile?.name || 'User')
  const chatAvatar = isGroup 
    ? `https://api.dicebear.com/7.x/initials/svg?seed=${chatName}&backgroundColor=00a3ff&fontFamily=monospace&bold=true`
    : getAvatarUrl(participantProfile)

  const imageMessages = messages.filter(m => m.message_type === 'image')
  const sharedMedia = imageMessages.map(m => ({
    id: m.id,
    url: m.image_url
  })).slice(0, 6)

  return (
    <AnimatePresence>
      {showDetailSidebar && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 350, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          className="hidden lg:flex flex-col h-screen bg-white border-l border-[#f1f1f1] overflow-hidden sticky top-0 shrink-0"
        >
          <div className="p-6 flex items-center justify-between">
             <h2 className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-400">Chat Details</h2>
             <button onClick={toggleDetailSidebar} className="p-2 text-zinc-400 hover:text-primary transition-colors">
                <X className="w-5 h-5" />
             </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-24 space-y-10 no-scrollbar">
            {/* Identity Card */}
            <div className="flex flex-col items-center text-center mt-4">
              <div 
                className="w-32 h-32 rounded-[2rem] bg-surface-low p-1 ambient-shadow mb-6 overflow-hidden border-4"
                style={!isGroup && participantProfile?.avatar_decoration ? { 
                  borderColor: participantProfile.avatar_decoration,
                  boxShadow: `0 0 25px ${participantProfile.avatar_decoration}50`
                } : { borderColor: 'white' }}
              >
                 <img 
                    src={chatAvatar} 
                    alt="" 
                    className="w-full h-full object-cover rounded-[1.8rem]" 
                 />
              </div>
              <h3 className="font-display font-black text-2xl tracking-tight text-gray-900 leading-none mb-2">
                {chatName}
              </h3>
              <p className="text-[13px] font-sans text-zinc-400 font-bold uppercase tracking-tight">
                {isGroup ? `${allParticipants.length} Members` : (participantProfile?.bio || 'Nexora User')}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex justify-center space-x-4">
               <ActionButton icon={User} label="Profile" />
               <ActionButton icon={BellOff} label="Mute" />
               <ActionButton icon={Star} label="Saved" />
            </div>

            {/* Shared Media */}
            <div className="space-y-4">
               <div className="flex items-center justify-between px-2">
                  <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-900">Shared Media</h4>
                  <button className="text-primary text-[10px] font-bold hover:underline">See all ({imageMessages.length})</button>
               </div>
               {sharedMedia.length > 0 ? (
                 <div className="grid grid-cols-3 gap-2">
                    {sharedMedia.map((m, i) => (
                      <div key={i} className="aspect-square rounded-xl bg-surface-low overflow-hidden ambient-shadow cursor-pointer hover:opacity-80 transition-opacity border border-black/5">
                        <img src={m.url} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                 </div>
               ) : (
                 <div className="py-8 text-center bg-surface-low rounded-2xl border-2 border-dashed border-outline-variant">
                    <p className="text-[10px] font-black uppercase text-text-muted tracking-widest">No shared media</p>
                 </div>
               )}
            </div>

            {/* Placeholder for Files */}
            <div className="space-y-4">
               <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-900 px-2">Recent Documents</h4>
               <div className="py-8 text-center bg-surface-low rounded-2xl border-2 border-dashed border-outline-variant">
                  <p className="text-[10px] font-black uppercase text-text-muted tracking-widest">No documents shared</p>
               </div>
            </div>

            {/* Safety Actions */}
            <div className="pt-6 space-y-2">
               {!isGroup && (
                 <button className="w-full flex items-center justify-start space-x-3 px-4 py-3 text-zinc-400 hover:text-presence-dnd hover:bg-presence-dnd/5 rounded-xl transition-all">
                    <Ban className="w-4 h-4" />
                    <span className="text-xs font-black uppercase tracking-[0.1em]">Block {chatName.split(' ')[0]}</span>
                 </button>
               )}
               <button className="w-full flex items-center justify-start space-x-3 px-4 py-3 text-zinc-400 hover:text-presence-dnd hover:bg-presence-dnd/5 rounded-xl transition-all">
                  <ShieldAlert className="w-4 h-4" />
                  <span className="text-xs font-black uppercase tracking-[0.1em]">Report {isGroup ? 'Server' : 'Contact'}</span>
               </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function ActionButton({ icon: Icon, label }: any) {
  return (
    <button className="flex flex-col items-center space-y-2 group">
       <div className="w-12 h-12 bg-surface-low text-text-muted rounded-full flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all ambient-shadow group-hover:scale-105 active:scale-95">
          <Icon className="w-5 h-5" />
       </div>
       <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none transition-colors group-hover:text-primary">
          {label}
       </span>
    </button>
  )
}
