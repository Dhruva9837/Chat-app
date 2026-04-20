'use client'

import { ChatLayout } from '../components/ChatLayout'
import { Auth } from '../components/Auth'
import { useAuthStore } from '@/store/authStore'
import { useChatStore } from '@/store/chatStore'
import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const { user, setUser, setProfile, setSettings, loading, setLoading } = useAuthStore()
  const { setChats, setFriendRequests, addFriendRequest } = useChatStore()

  useEffect(() => {
    const fetchUserData = async (userId: string) => {
      try {
        const [profileRes, settingsRes, chatsRes, requestsRes] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', userId).single(),
          supabase.from('user_settings').select('*').eq('id', userId).single(),
          supabase.from('chats').select(`
            *,
            chat_participants (
              user_id,
              profiles (*)
            ),
            messages (
              id,
              content,
              created_at,
              is_read,
              sender_id,
              chat_id,
              message_type,
              image_url
            )
          `).order('created_at', { ascending: false }),
          supabase.from('friend_requests').select(`
            *,
            sender_profile:profiles!sender_id(*),
            receiver_profile:profiles!receiver_id(*)
          `)
        ])

        if (profileRes.data) setProfile(profileRes.data)
        if (settingsRes.data) setSettings(settingsRes.data)
        if (chatsRes.data) {
          const processedChats = chatsRes.data.map(chat => {
            const lastMsg = chat.messages?.[chat.messages.length - 1];
            if (lastMsg) {
              // Attach sender profile from participants if missing
              const sender = chat.chat_participants?.find((p: any) => p.user_id === lastMsg.sender_id);
              if (sender?.profiles) {
                (lastMsg as any).sender_profile = sender.profiles;
              }
            }
            
            return {
              ...chat,
              last_message: lastMsg,
              unread_count: chat.messages?.filter((m: any) => !m.is_read && m.sender_id !== userId).length || 0
            }
          })
          
          processedChats.sort((a, b) => {
            const timeA = new Date(a.last_message?.created_at || a.created_at).getTime()
            const timeB = new Date(b.last_message?.created_at || b.created_at).getTime()
            return timeB - timeA
          })
          
          setChats(processedChats as any)
        }

        if (requestsRes.data) {
          setFriendRequests(requestsRes.data as any[])
        }

        // Fetch blocked users and friends
        const store = useChatStore.getState()
        store.fetchBlockedUsers(userId)
        store.fetchFriends(userId)
      } catch (err) {
        console.error('Failed to fetch user data:', err)
      }
    }

    const initializeAuth = async () => {
      try {
        setLoading(true)
        console.log('[Auth] Initializing session...')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) throw error
        
        if (session?.user) {
          console.log('[Auth] Session found for user:', session.user.id)
          setUser(session.user)
          await fetchUserData(session.user.id)
        } else {
          console.log('[Auth] No active session found.')
          setUser(null)
          setProfile(null)
        }
      } catch (e: any) {
        console.error('Auth initialization error:', e)
        if (e.message?.includes('Refresh Token') || e.status === 400) {
          await supabase.auth.signOut()
          localStorage.clear()
        }
        setUser(null)
        setProfile(null)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[Auth] State changed: ${event}`, session?.user?.id)
      if (session?.user) {
        setUser(session.user)
        await fetchUserData(session.user.id)
      } else {
        setUser(null)
        setProfile(null)
        setSettings(null)
      }
    })

    // 2a. Global DB Changes Listener (new/updated messages)
    const globalChannel = supabase
      .channel('global-db-changes')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages' 
      }, async (payload) => {
        const newMsg = payload.new as any
        const { user: currentUser } = useAuthStore.getState()
        if (currentUser) {
           useChatStore.getState().receiveGlobalMessage(newMsg, currentUser.id)
           // Auto-mark as read if we're in this chat and we didn't send it
           const { activeChat } = useChatStore.getState()
           if (activeChat?.id === newMsg.chat_id && newMsg.sender_id !== currentUser.id) {
             supabase.from('messages').update({ is_read: true }).eq('id', newMsg.id).then()
           }
        }
      })
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'messages' 
      }, (payload) => {
        useChatStore.getState().updateGlobalMessage(payload.new as any)
      })
      .subscribe((status, err) => {
        if (err) console.error('[Realtime] DB channel error:', err)
      })

    // 3. Friend Requests Listener
    const requestsChannel = supabase
      .channel('friend-requests')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'friend_requests'
      }, async () => {
        const { user: currentUser } = useAuthStore.getState()
        if (currentUser) {
          useChatStore.getState().fetchRequests(currentUser.id)
          useChatStore.getState().fetchFriends(currentUser.id)
        }
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
      supabase.removeChannel(globalChannel)
      supabase.removeChannel(requestsChannel)
    }
  }, [])

  // Still loading session – show nothing to prevent flash
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-bg-base transition-colors duration-500">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
           <div className="w-24 h-24 bg-surface-lowest rounded-[2.5rem] ambient-shadow flex items-center justify-center border border-outline-variant rotate-3 transition-colors">
              <img src="/logo.png" alt="Nexora" className="w-16 h-16 object-cover scale-150" />
           </div>
           <motion.div 
             animate={{ rotate: 360 }}
             transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
             className="absolute -inset-4 border-2 border-primary/10 border-t-primary rounded-[3rem]"
           />
        </motion.div>
        <div className="mt-12 flex flex-col items-center">
           <h2 className="text-[10px] font-bold uppercase tracking-[0.4em] text-text-muted mb-2">Loading your chats...</h2>
           <div className="flex space-x-1.5">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                  className="w-1.5 h-1.5 bg-primary rounded-full"
                />
              ))}
           </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Auth />
  }

  return <ChatLayout />
}
