'use client'

import React, { useEffect } from 'react'
import { useChatStore } from '@/store/chatStore'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useChatStore()

  useEffect(() => {
    const root = document.documentElement
    // Remove all theme classes
    root.classList.remove('theme-light', 'theme-midnight')
    
    // Add active theme class (dark is base, so no class needed)
    if (theme === 'light') {
      root.classList.add('theme-light')
    } else if (theme === 'midnight') {
      root.classList.add('theme-midnight')
    }
    
    // Update color-scheme meta for browser scrollbars etc
    root.style.colorScheme = theme === 'light' ? 'light' : 'dark'
  }, [theme])

  return <>{children}</>
}
