'use client'

import React from 'react'
import { Phone, PhoneForwarded, PhoneIncoming, PhoneOff, Video, MoreVertical, Search, Plus } from 'lucide-react'
import { motion } from 'framer-motion'

export function CallsView() {
  const calls = [
    { id: 1, name: 'Julian Vane', type: 'incoming', time: '12:45 PM', status: 'completed', video: false },
    { id: 2, name: 'Alex Rivers', type: 'outgoing', time: 'Yesterday', status: 'missed', video: true },
    { id: 3, name: 'Design Team', type: 'incoming', time: 'Oct 24', status: 'completed', video: true },
    { id: 4, name: 'ArchiStudio Mono', type: 'outgoing', time: 'Oct 22', status: 'completed', video: false },
  ]

  return (
    <div className="flex-1 flex bg-bg-base overflow-hidden font-sans">
      {/* Calls List */}
      <div className="w-full md:w-[350px] lg:w-[400px] bg-white border-r border-[#f1f1f1] flex flex-col shrink-0 overflow-hidden">
        <div className="p-8 flex items-center justify-between pb-6">
          <h1 className="font-display font-black text-3xl tracking-tight text-gray-900 leading-none">Calls</h1>
          <button className="p-2.5 bg-[#eef2ff] text-primary rounded-xl hover:bg-primary hover:text-white transition-all shadow-sm">
             <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="px-8 mb-6">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Search call history..." 
              className="w-full bg-[#f8faff] rounded-xl py-3.5 pl-11 pr-4 text-sm focus:bg-white outline-none transition-all placeholder:text-zinc-300 border border-transparent focus:border-primary/10"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-2 pb-24">
           {calls.map((call) => (
             <button key={call.id} className="w-full p-4 rounded-2xl flex items-center space-x-4 hover:bg-surface-low/50 transition-all group">
                <div className="w-12 h-12 rounded-xl bg-surface-low overflow-hidden shrink-0 shadow-sm border border-white">
                   <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${call.name}`} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 text-left min-w-0">
                   <h3 className="font-display font-black text-[15px] text-gray-900 truncate leading-none mb-1.5">{call.name}</h3>
                   <div className="flex items-center space-x-1.5">
                      {call.type === 'incoming' ? <PhoneIncoming className={`w-3 h-3 ${call.status === 'missed' ? 'text-red-500' : 'text-zinc-400'}`} /> : <PhoneForwarded className="w-3 h-3 text-emerald-500" />}
                      <span className="text-[11px] font-bold text-zinc-400 tracking-tight">{call.time}</span>
                   </div>
                </div>
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   {call.video ? <Video className="w-4 h-4 text-primary" /> : <Phone className="w-4 h-4 text-primary" />}
                </div>
             </button>
           ))}
        </div>
      </div>

      {/* Detail/Stats Perspective */}
      <div className="hidden md:flex flex-1 items-center justify-center p-12 bg-[#f8faff] relative overflow-hidden">
         <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4" />
         <div className="text-center max-w-[320px] z-10">
            <div className="w-24 h-24 bg-white rounded-[2rem] shadow-xl mx-auto flex items-center justify-center mb-8 rotate-3 border border-[#f1f1f1]">
               <Phone className="w-10 h-10 text-primary" />
            </div>
            <h2 className="font-display font-black text-2xl text-gray-900 tracking-tight uppercase tracking-widest mb-3">Recent Calls</h2>
            <p className="text-zinc-400 font-sans tracking-tight leading-relaxed text-sm">
               Your complete history of incoming and outgoing calls. Select a record to view details.
            </p>
         </div>
      </div>
    </div>
  )
}
