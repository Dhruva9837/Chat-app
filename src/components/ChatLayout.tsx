'use client'

import React from 'react'
import { CleanSidebar } from './chat/CleanSidebar'
import { CleanChatList } from './chat/CleanChatList'
import { CleanChatWindow } from './chat/CleanChatWindow'
import { CleanInfoPanel } from './chat/CleanInfoPanel'
import { useChatStore } from '@/store/chatStore'
import { ProfileView } from './ProfileView'
import { FavoritesView } from './FavoritesView'
import { SettingsView } from './SettingsView'
import { AddFriendModal } from './AddFriendModal'
import { SettingsModal } from './SettingsModal'
import { NewGroupModal } from './NewGroupModal'
import { usePresence } from '@/lib/hooks/usePresence'
import { motion, AnimatePresence } from 'framer-motion'

import { GroupsView } from './chat/GroupsView'

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
            <div className={`${activeChat ? 'hidden lg:flex' : 'flex'} w-full md:w-[320px] lg:w-[320px] shrink-0`}>
              <CleanChatList />
            </div>

            <div className={`${activeChat ? 'flex' : 'hidden md:flex'} flex-1 h-full`}>
              <CleanChatWindow />
            </div>

            <CleanInfoPanel />
          </motion.div>
        )
      case 'groups':
        return (
          <motion.div 
            key="groups"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            className="flex-1 overflow-hidden"
          >
            <GroupsView />
          </motion.div>
        )
      case 'favorites':
        return (
          <motion.div 
            key="favorites"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            className="flex-1 overflow-hidden"
          >
            <FavoritesView />
          </motion.div>
        )
      case 'settings':
        return (
          <motion.div 
            key="settings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex-1 overflow-hidden"
          >
            <SettingsView />
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
    <div className="flex flex-col md:flex-row h-[100dvh] bg-white overflow-hidden">
      <div className="hidden md:flex">
         <CleanSidebar />
      </div>

      <main className="flex-1 flex overflow-hidden relative">
        <AnimatePresence mode="wait">
          {renderView()}
        </AnimatePresence>
      </main>

      <div className="md:hidden">
        {/* We can update BottomNav later if needed */}
        {/* <BottomNav /> */}
      </div>

      {/* Modals & Overlays */}
      <AddFriendModal />
      <SettingsModal />
      <NewGroupModal />
    </div>
  )
}
