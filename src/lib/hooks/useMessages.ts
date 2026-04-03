import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '../supabase'
import { useAuthStore } from '@/store/authStore'
import { useChatStore } from '@/store/chatStore'
import { Message } from '@/types/database'

export const useMessages = (chatId: string | undefined) => {
  const { user } = useAuthStore()
  const { 
    messages, 
    setMessages, 
    addMessage, 
    prependMessages, 
    nextCursor, 
    hasMore,
    setTypingUser
  } = useChatStore()
  
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const isTypingRef = useRef(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 1. Initial Fetch
  const fetchInitialMessages = useCallback(async () => {
    if (!chatId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/messages?chatId=${chatId}&limit=50`)
      const data = await res.json()
      if (data.messages) {
        setMessages(data.messages.reverse()) // Reverse for bottom-to-top display
        useChatStore.setState({ nextCursor: data.nextCursor, hasMore: !!data.nextCursor })
      }
    } catch (err) {
      console.error('Fetch messages error:', err)
    } finally {
      setLoading(false)
    }
  }, [chatId, setMessages])

  // 2. Fetch More (Pagination)
  const fetchMore = useCallback(async () => {
    if (!chatId || !nextCursor || !hasMore || loadingMore) return
    setLoadingMore(true)
    try {
      const res = await fetch(`/api/messages?chatId=${chatId}&cursor=${nextCursor}&limit=50`)
      const data = await res.json()
      if (data.messages) {
        prependMessages(data.messages, data.nextCursor)
      }
    } catch (err) {
      console.error('Fetch more error:', err)
    } finally {
      setLoadingMore(false)
    }
  }, [chatId, nextCursor, hasMore, loadingMore, prependMessages])

  // 3. Real-time Subscription
  useEffect(() => {
    if (!chatId || !user) return

    fetchInitialMessages()

    const channel = supabase
      .channel(`chat:${chatId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `chat_id=eq.${chatId}`
      }, (payload) => {
        const newMessage = payload.new as Message
        // Only add if not already there (optimistic)
        addMessage(newMessage)
      })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        // Handle custom presence if needed, or rely on our global presence hook
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [chatId, user?.id, fetchInitialMessages, addMessage])

  // 4. Send Message (Optimistic)
  const sendMessage = async (content: string, type: 'text' | 'image' = 'text', imageUrl?: string) => {
    if (!chatId || !user || !content.trim()) return

    const tempId = `temp-${Date.now()}`
    const optimisticMsg: Message = {
      id: tempId,
      chat_id: chatId,
      sender_id: user.id,
      content: content.trim(),
      message_type: type,
      image_url: imageUrl,
      is_read: false,
      created_at: new Date().toISOString()
    }

    // Add optimistically
    addMessage(optimisticMsg)

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          sender_id: user.id,
          content: content.trim(),
          message_type: type,
          image_url: imageUrl
        })
      })
      
      const realMsg = await res.json()
      
      // Replace optimistic message with real one in store
      useChatStore.setState((state) => ({
        messages: state.messages.map(m => m.id === tempId ? realMsg : m)
      }))
    } catch (err) {
      console.error('Send message error:', err)
      // Remove optimistic message on failure
      useChatStore.setState((state) => ({
        messages: state.messages.filter(m => m.id !== tempId)
      }))
    }
  }

  // 5. Typing Indicators
  const handleTyping = useCallback(async (content: string) => {
    if (!chatId || !user) return

    if (!isTypingRef.current) {
      isTypingRef.current = true
      await fetch('/api/presence', {
        method: 'POST',
        body: JSON.stringify({ userId: user.id, data: { id: user.id, typing: true, chatId } })
      })
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    
    typingTimeoutRef.current = setTimeout(async () => {
      isTypingRef.current = false
      await fetch('/api/presence', {
        method: 'POST',
        body: JSON.stringify({ userId: user.id, data: { id: user.id, typing: false, chatId: null } })
      })
    }, 2000)
  }, [chatId, user?.id])

  return {
    messages,
    loading,
    loadingMore,
    hasMore,
    fetchMore,
    sendMessage,
    handleTyping
  }
}
