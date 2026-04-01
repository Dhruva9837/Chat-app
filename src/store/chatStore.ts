import { create } from 'zustand'
import { Chat, Message } from '@/types/database'

interface ChatState {
  chats: Chat[]
  activeChat: Chat | null
  messages: Message[]
  activeView: 'chat' | 'saved' | 'profile' | 'settings' | 'calls' | 'contacts'
  showDetailSidebar: boolean
  onlineUsers: Record<string, any>
  typingUsers: Record<string, boolean>
  setChats: (chats: Chat[]) => void
  setActiveChat: (chat: Chat | null) => void
  setMessages: (messages: Message[]) => void
  addMessage: (message: Message) => void
  setActiveView: (view: 'chat' | 'saved' | 'profile' | 'settings' | 'calls' | 'contacts') => void
  toggleDetailSidebar: () => void
  setOnlineUsers: (users: Record<string, any>) => void
  setTypingUser: (userId: string, isTyping: boolean) => void
}

export const useChatStore = create<ChatState>((set) => ({
  chats: [],
  activeChat: null,
  messages: [],
  activeView: 'chat',
  showDetailSidebar: false,
  onlineUsers: {},
  typingUsers: {},
  setChats: (chats) => set({ chats }),
  setActiveChat: (chat) => set({ activeChat: chat, messages: [], activeView: 'chat' }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({ 
    messages: [...state.messages, message] 
  })),
  setActiveView: (view) => set({ activeView: view }),
  toggleDetailSidebar: () => set((state) => ({ showDetailSidebar: !state.showDetailSidebar })),
  setOnlineUsers: (onlineUsers) => set({ onlineUsers }),
  setTypingUser: (userId, isTyping) => set((state) => ({
    typingUsers: { ...state.typingUsers, [userId]: isTyping }
  })),
}))
