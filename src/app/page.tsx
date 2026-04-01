'use client'

import { ChatLayout } from '../components/ChatLayout'
import { Auth } from '../components/Auth'
import { useAuthStore } from '@/store/authStore'
import { useChatStore } from '@/store/chatStore'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const { user, setUser, setProfile, loading, setLoading } = useAuthStore()
  const { setChats } = useChatStore()

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('Checking auth session...')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) throw error
        
        if (session?.user) {
          setUser(session.user)
          // Fetch profile
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
          
          if (!profileError) setProfile(profile)

          // Fetch initial chats with participant profiles
          const { data: chats, error: chatsError } = await supabase
            .from('chats')
            .select(`
              *,
              chat_participants (
                user_id,
                profiles:user_id (id, name, avatar_url)
              ),
              messages (
                content,
                created_at,
                is_read,
                sender_id
              )
            `)
            .order('created_at', { ascending: false })
          
          if (!chatsError && chats) {
            // Sort messages to get the last one easily
            const processedChats = chats.map(chat => ({
              ...chat,
              last_message: chat.messages?.[chat.messages.length - 1],
              unread_count: chat.messages?.filter((m: any) => !m.is_read && m.sender_id !== session.user.id).length || 0
            }))
            setChats(processedChats as any)
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

    // Keep in sync with auth changes
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

    return () => subscription.unsubscribe()
  }, [])

  // Still loading session – show nothing to prevent flash
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <Auth />
  }

  return <ChatLayout />
}
