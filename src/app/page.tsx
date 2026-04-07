'use client'

import { ChatLayout } from '../components/ChatLayout'
import { Auth } from '../components/Auth'
import { useAuthStore } from '@/store/authStore'
import { useChatStore } from '@/store/chatStore'
import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const { user, setUser, setProfile, loading, setLoading } = useAuthStore()
  const { setChats, setFriendRequests, addFriendRequest } = useChatStore()

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true)
        console.log('Checking auth session...')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) throw error
        
        if (session?.user) {
          setUser(session.user)
          
          // Parallel fetch for profile and initial chats
          const [profileRes, chatsRes, requestsRes] = await Promise.all([
            supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single(),
            supabase
              .from('chats')
              .select(`
                *,
                chat_participants (
                  user_id,
                  profiles:user_id (id, name, avatar_url, email, gender)
                ),
                messages (
                  content,
                  created_at,
                  is_read,
                  sender_id
                )
              `)
              .order('created_at', { ascending: false }),
            supabase
              .from('friend_requests')
              .select(`
                *,
                sender_profile:profiles!friend_requests_sender_id_fkey(id, name, username, avatar_url),
                receiver_profile:profiles!friend_requests_receiver_id_fkey(id, name, username, avatar_url)
              `)
          ])

          if (profileRes.data) setProfile(profileRes.data)
          if (chatsRes.data) {
            const processedChats = chatsRes.data.map(chat => ({
              ...chat,
              last_message: chat.messages?.[chat.messages.length - 1],
              unread_count: chat.messages?.filter((m: any) => !m.is_read && m.sender_id !== session.user.id).length || 0
            }))
            
            // Sort by latest message or chat creation
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
        } else {
          setUser(null)
          setProfile(null)
        }
      } catch (e) {
        console.error('Auth initialization error:', e)
        setUser(null)
        setProfile(null)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    // 1. Auth Subscription
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('Auth state change:', _event, !!session)
      if (session?.user) {
        setUser(session.user)
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        if (profile) setProfile(profile)
      } else {
        setUser(null)
        setProfile(null)
      }
    })

    // 2. Global Message Listener for Sidebar & Unread Counts
    const globalChannel = supabase
      .channel('global-messages')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages' 
      }, (payload) => {
        const newMessage = payload.new as any
        const { user: currentUser } = useAuthStore.getState()
        if (currentUser) {
           useChatStore.getState().receiveGlobalMessage(newMessage, currentUser.id)
        }
      })
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'messages' 
      }, (payload) => {
        const newMessage = payload.new as any
        // Instead of typical receive, use update global to fix last_msg references
        useChatStore.getState().updateGlobalMessage(newMessage)
      })
      .subscribe()

    // 3. Friend Requests Listener
    const requestsChannel = supabase
      .channel('friend-requests')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'friend_requests'
      }, async (payload) => {
        // We re-fetch the friend requests list if something changes 
        // to securely grab the joined profiles without repeating SQL logic
        const { user: currentUser } = useAuthStore.getState()
        if (currentUser) {
          const { data } = await supabase
            .from('friend_requests')
            .select(`
              *,
              sender_profile:profiles!friend_requests_sender_id_fkey(id, name, username, avatar_url),
              receiver_profile:profiles!friend_requests_receiver_id_fkey(id, name, username, avatar_url)
            `)
          if (data) {
            useChatStore.getState().setFriendRequests(data as any[])
          }
        }
      })
      .subscribe()

    // 4. Global Presence Listener
    const presenceChannel = supabase.channel('global_presence')
    
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState()
        const onlineUsersMap: Record<string, any> = {}
        for (const [key, stateArray] of Object.entries(state)) {
           if (stateArray.length > 0) {
              const payload = stateArray[0] as any
              onlineUsersMap[payload.userId] = { status: 'online', ...payload }
           }
        }
        useChatStore.getState().setOnlineUsers(onlineUsersMap)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
           const { user: currentUser } = useAuthStore.getState()
           if (currentUser) {
              await presenceChannel.track({
                 userId: currentUser.id,
                 onlineAt: new Date().toISOString()
              })
           }
        }
      })

    return () => {
      subscription.unsubscribe()
      supabase.removeChannel(globalChannel)
      supabase.removeChannel(requestsChannel)
      supabase.removeChannel(presenceChannel)
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
           <h2 className="text-[10px] font-bold uppercase tracking-[0.4em] text-text-muted mb-2">Setting up your workspace</h2>
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
