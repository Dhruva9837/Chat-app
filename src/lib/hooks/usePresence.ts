import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useChatStore } from '@/store/chatStore'
import { supabase } from '@/lib/supabase'

export const usePresence = () => {
  const { user, profile } = useAuthStore()
  const { setOnlineUsers } = useChatStore()

  useEffect(() => {
    if (!user || !profile) return

    const channel = supabase.channel('global-presence', {
      config: {
        presence: {
          key: user.id,
        },
      },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState()
        const users: Record<string, any> = {}
        
        // Flatten presence state
        Object.keys(newState).forEach((key) => {
          const presence = newState[key][0] as any
          if (presence) {
            users[key] = presence
          }
        })
        
        setOnlineUsers(users)
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('Joined:', key, newPresences)
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('Left:', key, leftPresences)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            id: user.id,
            name: profile.name,
            username: profile.username,
            avatar_url: profile.avatar_url,
            status: profile.status || 'online',
            online_at: new Date().toISOString(),
          })
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, profile?.id])
}
