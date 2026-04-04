'use client'

import React from 'react'
import { User, BellOff, Star, ShieldAlert, Ban, ChevronRight, X } from 'lucide-react'
import { useChatStore } from '@/store/chatStore'
import { motion, AnimatePresence } from 'framer-motion'

export function DetailSidebar() {
  const { activeChat, showDetailSidebar, toggleDetailSidebar } = useChatStore()

  if (!activeChat) return null

  const sharedMedia = [
    { id: 1, url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=200&h=200&fit=crop' },
    { id: 2, url: 'https://images.unsplash.com/photo-1449156001437-37c02b1b173c?q=80&w=200&h=200&fit=crop' },
    { id: 3, url: 'https://images.unsplash.com/photo-1448630360428-6e931449241f?q=80&w=200&h=200&fit=crop' },
    { id: 4, url: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?q=80&w=200&h=200&fit=crop' },
    { id: 5, url: 'https://images.unsplash.com/photo-1511818966892-d7d671e672a2?q=80&w=200&h=200&fit=crop' },
    { id: 6, label: '+24' },
  ]

  const sharedFiles = [
    { name: 'FloorPlan_V2.pdf', size: '12.4 MB', date: '2 days ago', type: 'pdf' },
    { name: 'Budget_Draft.xlsx', size: '450 KB', date: '24 Oct', type: 'xls' },
  ]

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
              <div className="w-32 h-32 rounded-[2rem] bg-surface-low p-1 ambient-shadow mb-6 overflow-hidden">
                 <img 
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${activeChat.id}`} 
                    alt="" 
                    className="w-full h-full object-cover" 
                 />
              </div>
              <h3 className="font-display font-black text-2xl tracking-tight text-gray-900 leading-none mb-2">
                {activeChat.name || 'Julian Vane'}
              </h3>
              <p className="text-[13px] font-sans text-zinc-400 font-bold uppercase tracking-tight">
                Product Designer
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
                  <button className="text-primary text-[10px] font-bold hover:underline">See all</button>
               </div>
               <div className="grid grid-cols-3 gap-2">
                  {sharedMedia.map((m, i) => (
                    <div key={i} className="aspect-square rounded-xl bg-surface-low overflow-hidden ambient-shadow cursor-pointer hover:opacity-80 transition-opacity">
                       {m.url ? (
                         <img src={m.url} alt="" className="w-full h-full object-cover" />
                       ) : (
                         <div className="w-full h-full bg-[#f8faff] flex items-center justify-center text-primary font-black text-sm">
                            {m.label}
                         </div>
                       )}
                    </div>
                  ))}
               </div>
            </div>

            {/* Shared Files */}
            <div className="space-y-4">
               <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-900 px-2">Recent Documents</h4>
               <div className="space-y-3">
                  {sharedFiles.map((file, i) => (
                    <div key={i} className="flex items-center space-x-4 p-3 bg-[#f8faff] rounded-xl hover:bg-white border border-transparent hover:border-[#f1f1f1] transition-all cursor-pointer group">
                       <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                          {file.type === 'pdf' ? (
                             <div className="text-[10px] font-black text-red-500 uppercase">pdf</div>
                          ) : (
                             <div className="text-[10px] font-black text-emerald-500 uppercase">xls</div>
                          )}
                       </div>
                       <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-bold text-gray-900 truncate tracking-tight">{file.name}</p>
                          <p className="text-[11px] text-zinc-400 font-sans tracking-tight">{file.size} • {file.date}</p>
                       </div>
                    </div>
                  ))}
               </div>
            </div>

            {/* Safety Actions */}
            <div className="pt-6 space-y-2">
               <button className="w-full flex items-center justify-start space-x-3 px-4 py-3 text-zinc-400 hover:text-tertiary-presence hover:bg-tertiary-presence/5 rounded-xl transition-all">
                  <Ban className="w-4 h-4" />
                  <span className="text-xs font-black uppercase tracking-[0.1em]">Block {activeChat.name?.split(' ')[0]}</span>
               </button>
               <button className="w-full flex items-center justify-start space-x-3 px-4 py-3 text-zinc-400 hover:text-red-500 hover:bg-red-500/5 rounded-xl transition-all">
                  <ShieldAlert className="w-4 h-4" />
                  <span className="text-xs font-black uppercase tracking-[0.1em]">Report Contact</span>
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
       <div className="w-12 h-12 bg-[#eef2ff] text-primary rounded-full flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all ambient-shadow group-hover:scale-105 active:scale-95">
          <Icon className="w-5 h-5" />
       </div>
       <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none transition-colors group-hover:text-primary">
          {label}
       </span>
    </button>
  )
}
