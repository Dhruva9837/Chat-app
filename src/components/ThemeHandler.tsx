'use client'

import { useEffect } from 'react'
import { useChatStore } from '@/store/chatStore'

export function ThemeHandler() {
  const { theme } = useChatStore()

  useEffect(() => {
    // Apply initial theme
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  return null
}
