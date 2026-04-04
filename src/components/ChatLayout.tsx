'use client'

import React from 'react'
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
import { CreateServerModal } from './CreateServerModal'
import { AddFriendModal } from './AddFriendModal'
import { SettingsModal } from './SettingsModal'
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
    <div className="flex flex-col md:flex-row h-[100dvh] bg-[#f8f9ff] overflow-hidden">
      {/* 1. Global Navigation (Narrow) - Hidden on Mobile */}
      <div className="hidden md:flex">
         <GlobalSidebar />
      </div>

      <main className="flex-1 flex overflow-hidden relative">
        <AnimatePresence mode="wait">
          {renderView()}
        </AnimatePresence>
      </main>

      {/* Modals & Overlays */}
      <CreateServerModal />
      <AddFriendModal />
      <SettingsModal />

      {/* Mobile Interaction Layer - Hidden when deep in a chat */}
      <div className={`md:hidden shrink-0 ${activeChat && activeView === 'chat' ? 'hidden' : 'block'}`}>
        <BottomNav />
      </div>
    </div>
  )
}
