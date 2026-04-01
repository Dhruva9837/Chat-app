'use client'

import React, { useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { ChatWindow } from './ChatWindow'
import { GlobalSidebar } from './GlobalSidebar'
import { DetailSidebar } from './DetailSidebar'
import { BottomNav } from './BottomNav'
import { useChatStore } from '@/store/chatStore'
import { ProfileView } from './ProfileView'
import { CallsView } from './CallsView'
import { ContactsView } from './ContactsView'
import { SavedView } from './SavedView'
import { usePresence } from '@/lib/hooks/usePresence'
import { motion, AnimatePresence } from 'framer-motion'

export function ChatLayout() {
  const { activeChat, activeView } = useChatStore()
  
  // Initialize Presence
  usePresence()

  const renderView = () => {
    switch (activeView) {
      case 'chat':
        return (
          <motion.div 
            key="chat"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-1 overflow-hidden h-full"
          >
            {/* 2. Chat List (Medium) */}
            <div className={`${activeChat ? 'hidden lg:flex' : 'flex'} w-full md:w-[320px] lg:w-[380px] shrink-0`}>
              <Sidebar />
            </div>

            {/* 3. Conversation (Flexible) */}
            <div className={`${activeChat ? 'flex' : 'hidden md:flex'} flex-1 h-full`}>
              <ChatWindow />
            </div>

            {/* 4. Contextual Sidebar (Right/Medium) */}
            <DetailSidebar />
          </motion.div>
        )
      case 'calls':
        return (
          <motion.div 
            key="calls"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            className="flex-1 overflow-hidden"
          >
            <CallsView />
          </motion.div>
        )
      case 'contacts':
        return (
          <motion.div 
            key="contacts"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex-1 overflow-hidden"
          >
            <ContactsView />
          </motion.div>
        )
      case 'saved':
        return (
          <motion.div 
            key="saved"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 overflow-hidden"
          >
            <SavedView />
          </motion.div>
        )
      case 'profile':
        return (
          <motion.div 
            key="profile"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 overflow-hidden"
          >
            <ProfileView />
          </motion.div>
        )
      default:
        return null
    }
  }

  return (
    <div className="flex h-screen bg-[#f8f9ff] overflow-hidden">
      {/* 1. Global Navigation (Narrow) */}
      <GlobalSidebar />

      <main className="flex-1 flex overflow-hidden relative">
        <AnimatePresence mode="wait">
          {renderView()}
        </AnimatePresence>
      </main>

      {/* Mobile Interaction Layer */}
      <BottomNav />
    </div>
  )
}
