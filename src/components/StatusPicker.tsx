'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Circle, Moon, MinusCircle, EyeOff } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

export function StatusPicker({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { profile, updateProfile } = useAuthStore()

  const statuses = [
    { id: 'online', label: 'Online', icon: Circle, color: 'text-presence-online', desc: 'Active and available to chat.' },
    { id: 'idle', label: 'Idle', icon: Moon, color: 'text-presence-idle', desc: 'Away for a moment.' },
    { id: 'dnd', label: 'Do Not Disturb', icon: MinusCircle, color: 'text-presence-dnd', desc: 'Mute notifications and focus.' },
    { id: 'invisible', label: 'Invisible', icon: EyeOff, color: 'text-presence-offline', desc: 'Appear offline to everyone.' }
  ]

  const handleSelect = async (status: string) => {
    try {
      await updateProfile({ status: status as any })
      onClose()
    } catch (error: any) {
      alert(error.message)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-[150]" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="absolute bottom-24 left-4 w-[280px] bg-surface-lowest rounded-3xl shadow-2xl border border-outline-variant z-[160] overflow-hidden p-3"
          >
            <div className="space-y-1">
              {statuses.map((s) => {
                const Icon = s.icon as any
                const isActive = profile?.status === s.id
                return (
                  <button
                    key={s.id}
                    onClick={() => handleSelect(s.id)}
                    className="w-full flex items-center p-3 rounded-2xl hover:bg-surface-low transition-all text-left group"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mr-4 ${isActive ? 'bg-primary/10' : 'bg-surface-low group-hover:bg-white'}`}>
                       <Icon className={`w-4 h-4 ${s.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                       <div className="flex items-center justify-between">
                         <span className="text-sm font-black uppercase tracking-tight text-text-main">{s.label}</span>
                         {isActive && <Check className="w-4 h-4 text-primary" />}
                       </div>
                       <p className="text-[10px] text-text-muted font-medium truncate mt-0.5">{s.desc}</p>
                    </div>
                  </button>
                )
              })}
            </div>
            
            <div className="mt-2 p-3 bg-surface-low rounded-2xl">
               <p className="text-[9px] font-black uppercase text-text-muted tracking-widest text-center">Managed by Nexora Core</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
