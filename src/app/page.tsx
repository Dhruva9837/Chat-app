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
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8f9ff]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
           <div className="w-24 h-24 bg-white rounded-[2.5rem] ambient-shadow flex items-center justify-center border border-[#f1f1f1] rotate-3">
              <img src="/logo.png" alt="Nexora" className="w-16 h-16 object-cover scale-150" />
           </div>
           <motion.div 
             animate={{ rotate: 360 }}
             transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
             className="absolute -inset-4 border-2 border-primary/10 border-t-primary rounded-[3rem]"
           />
        </motion.div>
        <div className="mt-12 flex flex-col items-center">
           <h2 className="text-[10px] font-bold uppercase tracking-[0.4em] text-gray-500 mb-2">Setting up your workspace</h2>
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
