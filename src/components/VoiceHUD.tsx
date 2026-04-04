'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, Headphones, PhoneOff, SignalHigh, Info, Settings } from 'lucide-react'
import { useChatStore } from '@/store/chatStore'

export function VoiceHUD() {
  const { activeVoiceChannelId, leaveVoiceChannel, chats } = useChatStore()
  const [isMuted, setIsMuted] = useState(false)
  const [isDeafened, setIsDeafened] = useState(false)

  if (!activeVoiceChannelId) return null

  const channelName = chats.find(c => c.id === activeVoiceChannelId)?.name || 'General'

  return (
    <motion.div 
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      exit={{ y: 100 }}
      className="absolute bottom-20 left-4 right-4 bg-surface-lowest border border-outline-variant rounded-2xl shadow-2xl z-40 overflow-hidden"
    >
      {/* Connection Status */}
      <div className="px-4 py-3 bg-primary/5 flex items-center justify-between border-b border-outline-variant">
        <div className="flex items-center space-x-3">
          <div className="w-2 h-2 bg-presence-online rounded-full animate-pulse" />
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-presence-online leading-none">Voice Connected</span>
            <span className="text-xs font-bold text-text-main truncate max-w-[120px] mt-1">{channelName}</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
            <SignalHigh className="w-4 h-4 text-presence-online" />
            <Settings className="w-4 h-4 text-text-muted hover:text-primary cursor-pointer transition-colors" />
        </div>
      </div>

      {/* Controls */}
      <div className="p-3 flex items-center justify-between">
        <div className="flex items-center space-x-1">
          <HUDButton 
            icon={isMuted ? MicOff : Mic} 
            active={isMuted} 
            onClick={() => setIsMuted(!isMuted)} 
            color={isMuted ? 'text-presence-dnd bg-presence-dnd/10' : 'text-text-muted hover:bg-surface-low'}
          />
          <HUDButton 
            icon={Headphones} 
            active={isDeafened} 
            onClick={() => setIsDeafened(!isDeafened)} 
            color={isDeafened ? 'text-presence-dnd bg-presence-dnd/10' : 'text-text-muted hover:bg-surface-low'}
          />
        </div>

        <button 
          onClick={() => leaveVoiceChannel()}
          className="bg-presence-dnd hover:bg-presence-dnd/90 text-white p-2.5 rounded-xl transition-all active:scale-95 shadow-lg shadow-presence-dnd/20"
        >
          <PhoneOff className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  )
}

function HUDButton({ icon: Icon, onClick, active, color }: { icon: any, onClick: () => void, active: boolean, color: string }) {
  return (
    <button 
      onClick={onClick}
      className={`p-2.5 rounded-xl transition-all active:scale-90 ${color}`}
    >
      <Icon className="w-5 h-5" />
    </button>
  )
}
