import { useEffect } from 'react'
import { supabase } from '../supabase'
import { useAuthStore } from '@/store/authStore'
import { useChatStore } from '@/store/chatStore'

export const usePresence = () => {
  const { user, profile } = useAuthStore()
  const { setOnlineUsers } = useChatStore()

  useEffect(() => {
    if (!user || !profile) return

    const channel = supabase.channel('online-users', {
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
        
        Object.keys(newState).forEach((key) => {
          users[key] = newState[key][0]
        })
        
        setOnlineUsers(users)
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('join', key, newPresences)
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('leave', key, leftPresences)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            id: user.id,
            name: profile.name,
            avatar_url: profile.avatar_url,
            online_at: new Date().toISOString(),
          })
        }
      })

    return () => {
      channel.unsubscribe()
    }
  }, [user?.id, profile?.id])
}
