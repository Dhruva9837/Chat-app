import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useChatStore } from '@/store/chatStore'

export const usePresence = () => {
  const { user, profile } = useAuthStore()
  const { setOnlineUsers } = useChatStore()

  useEffect(() => {
    if (!user || !profile) return

    // Poll for presence via Redis API
    const fetchPresence = async () => {
      try {
        const response = await fetch('/api/presence')
        const { onlineUsers } = await response.json()
        
        const users: Record<string, any> = {}
        onlineUsers.forEach((u: any) => {
          if (u && u.id) users[u.id] = u
        })
        
        setOnlineUsers(users)
      } catch (err) {
        console.error('Presence fetch error:', err)
      }
    }

    const updatePresence = async () => {
      try {
        await fetch('/api/presence', {
          method: 'POST',
          body: JSON.stringify({
            userId: user.id,
            data: {
              id: user.id,
              name: profile.name,
              avatar_url: profile.avatar_url,
            }
          })
        })
      } catch (err) {
        console.error('Presence update error:', err)
      }
    }

    // Initial sync
    updatePresence()
    fetchPresence()

    // Ping every 30 seconds to keep presence alive in Redis
    const updateInterval = setInterval(updatePresence, 30000)
    // Refresh online list every 10 seconds
    const fetchInterval = setInterval(fetchPresence, 10000)

    return () => {
      clearInterval(updateInterval)
      clearInterval(fetchInterval)
    }
  }, [user?.id, profile?.id])
}
