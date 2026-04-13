'use client'

import React from 'react'
import { GlobalSidebar } from './chat/GlobalSidebar'
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
import { MobileBottomNav } from './chat/MobileBottomNav'
import { usePresence } from '@/lib/hooks/usePresence'
import { motion, AnimatePresence } from 'framer-motion'

import { GroupsView } from './chat/GroupsView'
import { CalendarView } from './chat/CalendarView'
import { StartChatModal } from './chat/StartChatModal'

export function ChatLayout() {
  const { activeChat, activeView } = useChatStore()
  
  // Initialize Presence
  usePresence()

  const renderView = () => {
    switch (activeView) {
      case 'chat':
        return (
          <div 
            key="chat"
            className="flex flex-1 overflow-hidden h-full"
          >
            {/* Chat List - hidden on mobile when activeChat is set */}
            <div className={`${activeChat ? 'hidden md:flex' : 'flex'} w-full md:w-[320px] lg:w-[320px] shrink-0 h-full`}>
              <CleanChatList />
            </div>

            {/* Chat Window - always rendered, shows placeholder when no activeChat */}
            <div className={`${activeChat ? 'flex' : 'hidden md:flex'} flex-1 h-full w-full md:w-auto`}>
              <CleanChatWindow />
            </div>

            <CleanInfoPanel />
          </div>
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
      case 'calendar':
        return (
          <motion.div 
            key="calendar"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            className="flex-1 overflow-hidden"
          >
            <CalendarView />
          </motion.div>
        )
      default:
        return null
    }
  }

  return (
    <div className="flex h-[100dvh] bg-noir-bg overflow-hidden text-text-main font-sans selection:bg-primary/30">
      {/* 1. Slim Utility Sidebar */}
      <GlobalSidebar />

      {/* 2. Main Content Area (Chat List + Chat Window + Info Panel) */}
      <main className={`flex-1 flex overflow-hidden relative ${(!activeChat || activeView !== 'chat') ? 'pb-[72px] md:pb-0' : ''}`}>
        {renderView()}
      </main>

      {/* 3. Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* Modals & Overlays */}
      <AddFriendModal />
      <SettingsModal />
      <NewGroupModal />
      <StartChatModal />
    </div>
  )
}
