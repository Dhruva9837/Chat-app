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

  // 3. Real-time Subscription (Postgres Changes + Presence + Broadcast)
  useEffect(() => {
    if (!chatId || !user) return

    fetchInitialMessages()

    const channel = supabase
      .channel(`chat:${chatId}`, {
        config: {
          presence: {
            key: user.id,
          },
        },
      })
      // 3.1 Listen for New Messages (Persistence Sync)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `chat_id=eq.${chatId}`
      }, (payload) => {
        const newMessage = payload.new as Message
        addMessage(newMessage)
      })
      // 3.2 Listen for Typing Indicators (Presence)
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        Object.keys(state).forEach((userId) => {
          if (userId !== user.id) {
            const isTyping = (state[userId][0] as any)?.typing || false
            setTypingUser(userId, isTyping)
          }
        })
      })
      // 3.3 Listen for Read Receipts (Broadcast)
      .on('broadcast', { event: 'message_seen' }, ({ payload }) => {
        const { messageIds, userId } = payload
        if (userId !== user.id) {
          // Update store messages status
          useChatStore.setState((state) => ({
            messages: state.messages.map(m => messageIds.includes(m.id) ? { ...m, is_read: true } : m)
          }))
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [chatId, user?.id, fetchInitialMessages, addMessage, setTypingUser])

  // 4. Send Message (Optimistic)
  const sendMessage = async (content: string, type: 'text' | 'image' = 'text', imageUrl?: string) => {
    if (!chatId || !user || (!content.trim() && !imageUrl)) return

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
      
      if (!res.ok) throw new Error(realMsg.error || 'Failed to send')
      
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

  // 5. Interaction Feedback (Typing & Seen)
  const handleTyping = useCallback(async (isTyping: boolean) => {
    if (!chatId || !user) return

    // Avoid double-tracking the same state
    if (isTyping === isTypingRef.current) return
    isTypingRef.current = isTyping

    const channel = supabase.channel(`chat:${chatId}`)
    
    if (isTyping) {
      await channel.track({
        userId: user.id,
        typing: true,
        last_active: new Date().toISOString()
      })

      // Auto-stop typing after 3 seconds of inactivity
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = setTimeout(() => {
        handleTyping(false)
      }, 3000)
    } else {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
      await channel.track({
        userId: user.id,
        typing: false,
        last_active: new Date().toISOString()
      })
    }
  }, [chatId, user?.id])

  const markAsSeen = useCallback(async (messageIds: string[]) => {
    if (!chatId || !user || messageIds.length === 0) return

    // 1. Broadcast to other participants for instant UI update
    const channel = supabase.channel(`chat:${chatId}`)
    channel.send({
      type: 'broadcast',
      event: 'message_seen',
      payload: { messageIds, userId: user.id }
    })

    // 2. Persist to DB
    await supabase
      .from('messages')
      .update({ is_read: true })
      .in('id', messageIds)
  }, [chatId, user?.id])

  return {
    messages,
    loading,
    loadingMore,
    hasMore,
    fetchMore,
    sendMessage,
    handleTyping,
    markAsSeen
  }
}

