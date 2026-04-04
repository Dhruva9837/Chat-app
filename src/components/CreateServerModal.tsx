'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Camera, ChevronRight, Users, MessageSquare, Globe, Shield, Plus } from 'lucide-react'
import { useChatStore } from '@/store/chatStore'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'

export function CreateServerModal() {
  const { isCreateServerModalOpen, setCreateServerModalOpen, addChat } = useChatStore()
  const { user } = useAuthStore()
  const [step, setStep] = useState(1) // 1: Template, 2: Details
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isCreateServerModalOpen) return null

  const handleClose = () => {
    setCreateServerModalOpen(false)
    setStep(1)
    setName('')
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !user) return
    setLoading(true)

    try {
      // 1. Create the server (group chat)
      const { data: chat, error: chatError } = await supabase
        .from('chats')
        .insert([{ 
          name, 
          type: 'group' 
        }])
        .select()
        .single()

      if (chatError) throw chatError

      // 2. Add creator as 'owner'
      const { error: partError } = await supabase
        .from('chat_participants')
        .insert([{
          chat_id: chat.id,
          user_id: user.id,
          role: 'owner'
        }])

      if (partError) throw partError

      addChat(chat)
      handleClose()
    } catch (error) {
      console.error('Error creating server:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-[440px] bg-surface-lowest rounded-2xl overflow-hidden shadow-2xl flex flex-col border border-outline-variant"
        >
          {/* Header */}
          <div className="p-4 flex justify-end">
            <button onClick={handleClose} className="p-1 text-text-muted hover:bg-surface-low rounded-full transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="px-10 pb-8 text-center flex-1 overflow-y-auto no-scrollbar">
            {step === 1 ? (
              <>
                <h2 className="text-2xl font-display font-black text-text-main mb-2">Create Your Server</h2>
                <p className="text-text-muted text-sm mb-8 leading-relaxed">
                  Your server is where you and your friends hang out. Make yours and start talking.
                </p>

                <div className="space-y-3">
                  <TemplateButton 
                    icon={<Users className="w-8 h-8 text-blue-500" />}
                    title="Create My Own"
                    onClick={() => {
                        setName(`${user?.email?.split('@')[0]}'s Server`)
                        setStep(2)
                    }}
                  />
                  
                  <div className="py-4 text-[11px] font-black uppercase text-text-muted tracking-widest">
                    Start from a template
                  </div>

                  <TemplateButton 
                    icon={<Globe className="w-8 h-8 text-primary" />}
                    title="Gaming"
                    onClick={() => {
                        setName("Gaming Lounge")
                        setStep(2)
                    }}
                  />
                  
                  <TemplateButton 
                    icon={<Shield className="w-8 h-8 text-purple-500" />}
                    title="School Club"
                    onClick={() => {
                        setName("Study Group")
                        setStep(2)
                    }}
                  />
                </div>
              </>
            ) : (
              <form onSubmit={handleCreate} className="text-left">
                <h2 className="text-2xl font-display font-black text-text-main mb-2 text-center">Customize Your Server</h2>
                <p className="text-text-muted text-sm mb-8 text-center">
                  Give your new server a personality with a name and an icon. You can always change it later.
                </p>

                {/* Icon selection placeholder */}
                <div className="flex justify-center mb-8">
                  <div className="relative group cursor-pointer">
                    <div className="w-20 h-20 bg-surface-low rounded-3xl flex flex-col items-center justify-center border-2 border-dashed border-outline-variant group-hover:bg-primary/5 group-hover:border-primary transition-all">
                      <Camera className="w-8 h-8 text-text-muted group-hover:text-primary mb-1" />
                      <span className="text-[10px] font-black uppercase text-text-muted group-hover:text-primary">Upload</span>
                    </div>
                    <div className="absolute -top-1 -right-1 bg-primary text-white p-1 rounded-full shadow-lg">
                        <Plus className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase text-text-muted tracking-widest block">Server Name</label>
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="My Awesome Server"
                      className="w-full bg-surface-low border border-outline-variant rounded-xl py-3 px-4 text-text-main focus:ring-2 focus:ring-primary/40 outline-none transition-all font-medium"
                    />
                  </div>
                </div>
              </form>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-surface-low flex justify-between items-center px-10">
            {step === 2 ? (
              <>
                <button 
                  onClick={() => setStep(1)}
                  className="text-sm font-bold text-text-main hover:underline"
                >
                  Back
                </button>
                <button 
                  onClick={handleCreate}
                  disabled={loading}
                  className="bg-primary hover:opacity-90 text-white font-black px-8 py-3 rounded-lg transition-all active:scale-95 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Server'}
                </button>
              </>
            ) : (
                <div className="w-full text-center">
                    <p className="text-sm text-text-muted">
                        Have an invite already? <button className="text-primary font-bold hover:underline">Join a Server</button>
                    </p>
                </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

function TemplateButton({ icon, title, onClick }: { icon: React.ReactNode, title: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center justify-between p-3 rounded-xl border border-outline-variant hover:bg-surface-low transition-all group"
    >
      <div className="flex items-center space-x-4">
        {icon}
        <span className="font-bold text-text-main text-lg">{title}</span>
      </div>
      <ChevronRight className="w-5 h-5 text-text-muted group-hover:text-text-main transition-colors" />
    </button>
  )
}
