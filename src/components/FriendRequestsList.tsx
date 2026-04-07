'use client'

import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, UserPlus, Clock, ShieldCheck } from 'lucide-react'
import { useChatStore } from '@/store/chatStore'
import { useAuthStore } from '@/store/authStore'
import { getAvatarUrl } from '@/lib/utils'

export function FriendRequestsList() {
  const { friendRequests, fetchRequests, fetchFriends } = useChatStore()
  const { user } = useAuthStore()

  useEffect(() => {
    if (user?.id) {
      fetchRequests(user.id)
    }
  }, [user?.id, fetchRequests])

  const handleRequest = async (requestId: string, action: 'accept' | 'reject') => {
    if (!user?.id) return

    try {
      const resp = await fetch('/api/friends/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action, userId: user.id })
      })

      if (resp.ok) {
        // Refresh requests and friends list
        fetchRequests(user.id)
        fetchFriends(user.id)
      } else {
        const data = await resp.json()
        alert(data.error || 'Failed to process request')
      }
    } catch (err) {
      console.error('Error processing request:', err)
    }
  }

  const incomingRequests = friendRequests.filter(r => r.receiver_id === user?.id)

  if (incomingRequests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center opacity-30 select-none h-full">
        <Clock className="w-12 h-12 mb-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em]">No incoming requests</p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4 overflow-y-auto max-h-[400px] custom-scrollbar">
      <div className="flex items-center justify-between mb-4 px-2">
         <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Pending Invites</h3>
         <div className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[9px] font-black">
            {incomingRequests.length}
         </div>
      </div>
      
      <AnimatePresence>
        {incomingRequests.map((req) => (
          <motion.div
            key={req.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="group relative bg-surface-low border border-outline-variant p-4 rounded-[2rem] hover:bg-white hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-md">
                  <img src={getAvatarUrl(req.sender_profile)} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center border-2 border-white">
                  <UserPlus className="w-2 h-2 text-white" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-display font-black uppercase tracking-tight text-text-main truncate">
                  {req.sender_profile?.name}
                </h4>
                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest truncate">
                  @{req.sender_profile?.username}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleRequest(req.id, 'accept')}
                  className="w-10 h-10 bg-presence-online text-white rounded-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg shadow-presence-online/20"
                  title="Accept"
                >
                  <Check className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleRequest(req.id, 'reject')}
                  className="w-10 h-10 bg-surface-lowest text-text-muted border border-outline-variant rounded-2xl flex items-center justify-center hover:bg-presence-dnd hover:text-white hover:scale-110 active:scale-95 transition-all shadow-md"
                  title="Decline"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Subtle verification badge */}
            <div className="absolute -top-1.5 -left-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-white rounded-full p-1 shadow-sm border border-outline-variant">
                    <ShieldCheck className="w-3 h-3 text-primary" />
                </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
