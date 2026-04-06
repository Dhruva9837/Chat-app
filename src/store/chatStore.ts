import { create } from 'zustand'
import { Chat, Message, Profile, Participant } from '@/types/database'
import { useAuthStore } from './authStore'

export type FriendRequest = {
  id: string
  sender_id: string
  receiver_id: string
  status: 'pending' | 'accepted' | 'declined'
  sender_profile: Profile
  receiver_profile: Profile
}

interface ChatState {
  chats: Chat[]
  activeChat: Chat | null
  messages: Message[]
  nextCursor: string | null
  hasMore: boolean
  activeView: 'chat' | 'favorites' | 'profile' | 'settings' | 'groups'
  showDetailSidebar: boolean
  isAddFriendModalOpen: boolean
  isSettingsModalOpen: boolean
  isProfileModalOpen: boolean
  isNewGroupModalOpen: boolean
  theme: 'dark' | 'light' | 'midnight'
  activeVoiceChannelId: string | null
  voiceParticipants: Record<string, string[]>
  onlineUsers: Record<string, any>
  typingUsers: Record<string, boolean>
  sidebarTab: 'message' | 'group'
  fontSize: number
  friendRequests: FriendRequest[]
  setChats: (chats: Chat[]) => void
  setActiveChat: (chat: Chat | null) => void
  setIsAddFriendModalOpen: (open: boolean) => void
  setSettingsModalOpen: (open: boolean) => void
  setProfileModalOpen: (open: boolean) => void
  setNewGroupModalOpen: (open: boolean) => void
  setTheme: (theme: 'dark' | 'light' | 'midnight') => void
  joinVoiceChannel: (id: string) => void
  leaveVoiceChannel: () => void
  setMessages: (messages: Message[]) => void
  addMessage: (message: Message) => void
  receiveGlobalMessage: (message: Message, currentUserId: string) => void
  prependMessages: (messages: Message[], nextCursor: string | null) => void
  setActiveView: (view: 'chat' | 'favorites' | 'profile' | 'settings') => void
  toggleDetailSidebar: () => void
  setOnlineUsers: (users: Record<string, any>) => void
  setTypingUser: (userId: string, isTyping: boolean) => void
  addChat: (chat: Chat) => void
  updateChat: (chatId: string, updates: Partial<Chat>) => void
  setSidebarTab: (tab: 'message' | 'group') => void
  setFontSize: (size: number) => void
  setFriendRequests: (requests: FriendRequest[]) => void
  addFriendRequest: (request: FriendRequest) => void
  removeFriendRequest: (id: string) => void
}

export const useChatStore = create<ChatState>((set) => ({
  chats: [],
  activeChat: null,
  messages: [],
  nextCursor: null,
  hasMore: true,
  activeView: 'chat',
  showDetailSidebar: false,
  isAddFriendModalOpen: false,
  isSettingsModalOpen: false,
  isProfileModalOpen: false,
  isNewGroupModalOpen: false,
  theme: (typeof window !== 'undefined' ? localStorage.getItem('nexora-theme') as any : 'dark') || 'dark',
  activeVoiceChannelId: null,
  voiceParticipants: {},
  onlineUsers: {},
  typingUsers: {},
  sidebarTab: 'message',
  fontSize: 16,
  friendRequests: [],
  setNewGroupModalOpen: (open) => set({ isNewGroupModalOpen: open }),
  setChats: (chats) => set({ chats }),
  setActiveChat: (chat) => set({ 
    activeChat: chat, 
    messages: [], 
    nextCursor: null, 
    hasMore: true,
    activeView: 'chat' 
  }),
  setActiveView: (view) => set({ activeView: view }),
  setIsAddFriendModalOpen: (open) => set({ isAddFriendModalOpen: open }),
  setSettingsModalOpen: (open) => set({ isSettingsModalOpen: open }),
  setProfileModalOpen: (open) => set({ isProfileModalOpen: open }),
  setTheme: (theme) => {
    localStorage.setItem('nexora-theme', theme)
    set({ theme })
  },
  joinVoiceChannel: (id) => set((state) => {
    const currentUserId = useAuthStore.getState().user?.id
    if (!currentUserId) return state
    
    return {
      activeVoiceChannelId: id,
      voiceParticipants: {
        ...state.voiceParticipants,
        [id]: [...(state.voiceParticipants[id] || []), currentUserId]
      }
    }
  }),
  leaveVoiceChannel: () => set((state) => {
    const currentUserId = useAuthStore.getState().user?.id
    if (!currentUserId || !state.activeVoiceChannelId) return state
    
    return {
      activeVoiceChannelId: null,
      voiceParticipants: {
        ...state.voiceParticipants,
        [state.activeVoiceChannelId]: state.voiceParticipants[state.activeVoiceChannelId].filter(id => id !== currentUserId)
      }
    }
  }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => {
    if (state.messages.some(m => m.id === message.id)) return state
    return { messages: [...state.messages, message] }
  }),
  receiveGlobalMessage: (message, currentUserId) => set((state) => {
    const isForActiveChat = state.activeChat?.id === message.chat_id
    
    const updatedChats = state.chats.map(chat => {
      if (chat.id === message.chat_id) {
        const isUnread = !isForActiveChat && message.sender_id !== currentUserId
        return {
          ...chat,
          last_message: message,
          unread_count: isUnread ? (chat.unread_count || 0) + 1 : (chat.unread_count || 0)
        }
      }
      return chat
    }).sort((a, b) => {
      const timeA = new Date(a.last_message?.created_at || a.created_at).getTime()
      const timeB = new Date(b.last_message?.created_at || b.created_at).getTime()
      return timeB - timeA
    })

    if (isForActiveChat) {
      if (state.messages.some(m => m.id === message.id)) return { chats: updatedChats }
      return { 
        chats: updatedChats,
        messages: [...state.messages, message] 
      }
    }

    return { chats: updatedChats }
  }),
  prependMessages: (newMessages, nextCursor) => set((state) => ({
    messages: [...newMessages.reverse(), ...state.messages],
    nextCursor,
    hasMore: !!nextCursor
  })),
  toggleDetailSidebar: () => set((state) => ({ showDetailSidebar: !state.showDetailSidebar })),
  setOnlineUsers: (onlineUsers) => set({ onlineUsers }),
  setTypingUser: (userId, isTyping) => set((state) => ({
    typingUsers: { ...state.typingUsers, [userId]: isTyping }
  })),
  addChat: (chat) => set((state) => {
    if (state.chats.some(c => c.id === chat.id)) return state
    return { chats: [chat, ...state.chats] }
  }),
  updateChat: (chatId, updates) => set((state) => ({
    chats: state.chats.map(c => c.id === chatId ? { ...c, ...updates } : c)
  })),
  setSidebarTab: (tab) => set({ sidebarTab: tab }),
  setFontSize: (size: number) => set({ fontSize: size }),
  setFriendRequests: (reqs) => set({ friendRequests: reqs }),
  addFriendRequest: (req) => set((state) => {
    if (state.friendRequests.some(r => r.id === req.id)) return state
    return { friendRequests: [req, ...state.friendRequests] }
  }),
  removeFriendRequest: (id) => set((state) => ({
    friendRequests: state.friendRequests.filter(r => r.id !== id)
  }))
}))
