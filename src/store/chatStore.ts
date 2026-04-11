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
  activeView: 'chat' | 'favorites' | 'profile' | 'settings' | 'groups' | 'calendar'
  showDetailSidebar: boolean
  showInfoPanel: boolean
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
  chatListTab: 'chats' | 'friends'
  fontSize: number
  friendRequests: FriendRequest[]
  friends: any[]
  pinnedChats: string[]
  fetchFriends: (userId: string) => Promise<void>
  fetchRequests: (userId: string) => Promise<void>
  togglePinChat: (chatId: string) => void
  setShowInfoPanel: (show: boolean) => void
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
  updateGlobalMessage: (message: Message) => void
  prependMessages: (messages: Message[], nextCursor: string | null) => void
  setActiveView: (view: 'chat' | 'favorites' | 'profile' | 'settings' | 'groups' | 'calendar') => void
  toggleDetailSidebar: () => void
  setOnlineUsers: (users: Record<string, any>) => void
  setTypingUser: (userId: string, isTyping: boolean) => void
  addChat: (chat: Chat) => void
  updateChat: (chatId: string, updates: Partial<Chat>) => void
  setSidebarTab: (tab: 'message' | 'group') => void
  setChatListTab: (tab: 'chats' | 'friends') => void
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
  showInfoPanel: false,
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
  chatListTab: 'chats',
  fontSize: 16,
  friendRequests: [],
  friends: [],
  pinnedChats: (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('nexora-pinned') || '[]') : []),
  fetchFriends: async (userId) => {
    try {
      const resp = await fetch(`/api/friends/list?userId=${userId}`)
      const data = await resp.json()
      if (resp.ok) set({ friends: data.friends })
    } catch (err) {
      console.error('Failed to fetch friends:', err)
    }
  },
  fetchRequests: async (userId) => {
    try {
      const resp = await fetch(`/api/friends/requests?userId=${userId}`)
      const data = await resp.json()
      if (resp.ok) set({ friendRequests: [...data.incoming, ...data.outgoing] })
    } catch (err) {
      console.error('Failed to fetch requests:', err)
    }
  },
  togglePinChat: (chatId) => set((state) => {
    const isPinned = state.pinnedChats.includes(chatId);
    const newPinned = isPinned 
      ? state.pinnedChats.filter(id => id !== chatId) 
      : [...state.pinnedChats, chatId];
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('nexora-pinned', JSON.stringify(newPinned));
    }
    return { pinnedChats: newPinned };
  }),
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
  setShowInfoPanel: (show: boolean) => set({ showInfoPanel: show }),
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
  updateGlobalMessage: (message) => set((state) => {
    const updatedChats = state.chats.map(chat => {
      if (chat.last_message?.id === message.id) {
        return {
          ...chat,
          last_message: message,
          unread_count: message.is_read ? 0 : chat.unread_count
        }
      }
      return chat
    });

    const updatedMessages = state.messages.map(m => m.id === message.id ? message : m);

    return { chats: updatedChats, messages: updatedMessages };
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
  setChatListTab: (tab) => set({ chatListTab: tab }),
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
