'use client'

import React from 'react'
import { Sun, Moon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useChatStore } from '@/store/chatStore'

export function ThemeToggle() {
  const { theme, toggleTheme } = useChatStore()

  return (
    <button
      onClick={toggleTheme}
      className="relative w-14 h-14 rounded-2xl bg-surface-low ghost-border flex items-center justify-center overflow-hidden group transition-all active:scale-90"
    >
      <AnimatePresence mode="wait" initial={false}>
        {theme === 'light' ? (
          <motion.div
            key="light"
            initial={{ y: 20, opacity: 0, rotate: 45 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: -20, opacity: 0, rotate: -45 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <Sun className="w-6 h-6 text-yellow-500 fill-yellow-500/10" />
          </motion.div>
        ) : (
          <motion.div
            key="dark"
            initial={{ y: 20, opacity: 0, rotate: 45 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: -20, opacity: 0, rotate: -45 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <Moon className="w-6 h-6 text-primary fill-primary/10" />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Subtle background glow */}
      <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  )
}
