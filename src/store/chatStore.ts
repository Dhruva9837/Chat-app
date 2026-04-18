import { create } from 'zustand'
import { Chat, Message, Profile, Participant } from '@/types/database'
import { useAuthStore } from './authStore'
import { supabase } from '@/lib/supabase'

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
  isStartChatModalOpen: boolean
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
  setIsStartChatModalOpen: (open: boolean) => void
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
  resolveOptimisticMessage: (tempId: string, realMessage: Message) => void
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
  blockedUsers: string[]
  blockUser: (userId: string) => Promise<void>
  unblockUser: (userId: string) => Promise<void>
  deleteChat: (chatId: string) => Promise<void>
  fetchBlockedUsers: (userId: string) => Promise<void>
  startPrivateChat: (otherUserId: string) => Promise<void>
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
  isStartChatModalOpen: false,
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
  blockedUsers: [],
  pinnedChats: (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('nexora-pinned') || '[]') : []),
  fetchFriends: async (userId) => {
    try {
      const { data: friends, error } = await supabase
        .from('friends')
        .select(`
          id, 
          friend_id, 
          user_id, 
          created_at, 
          friend_profile:profiles!friend_id(*)
        `)
        .eq('user_id', userId);
      if (error) throw error;
      set({ friends: friends || [] })
    } catch (err) {
      console.error('Failed to fetch friends:', err)
    }
  },
  fetchBlockedUsers: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('blocks')
        .select('blocked_id')
        .eq('blocker_id', userId);
      if (error) throw error;
      set({ blockedUsers: data?.map((b: any) => b.blocked_id) || [] });
    } catch (err) {
      console.error('Failed to fetch blocked users:', err);
    }
  },
  blockUser: async (blockedId) => {
    const { user } = useAuthStore.getState();
    if (!user) return;
    try {
      const { error } = await supabase
        .from('blocks')
        .insert({ blocker_id: user.id, blocked_id: blockedId });
      if (error) throw error;
      set(s => ({ blockedUsers: [...s.blockedUsers, blockedId] }));
    } catch (err) {
      console.error('Failed to block user:', err);
    }
  },
  unblockUser: async (blockedId) => {
    const { user } = useAuthStore.getState();
    if (!user) return;
    try {
      const { error } = await supabase
        .from('blocks')
        .delete()
        .eq('blocker_id', user.id)
        .eq('blocked_id', blockedId);
      if (error) throw error;
      set(s => ({ blockedUsers: s.blockedUsers.filter(id => id !== blockedId) }));
    } catch (err) {
      console.error('Failed to unblock user:', err);
    }
  },
  fetchRequests: async (userId) => {
    try {
      const { data: incoming, error: inError } = await supabase
        .from('friend_requests')
        .select('id, status, created_at, sender_id, receiver_id, sender_profile:profiles!sender_id(*)')
        .eq('receiver_id', userId)
        .eq('status', 'pending');
        
      const { data: outgoing, error: outError } = await supabase
        .from('friend_requests')
        .select('id, status, created_at, sender_id, receiver_id, receiver_profile:profiles!receiver_id(*)')
        .eq('sender_id', userId)
        .eq('status', 'pending');

      if (inError) throw inError;
      if (outError) throw outError;

      set({ friendRequests: [...(incoming || []), ...(outgoing || [])] as any[] })
    } catch (err) {
      // Failed to fetch requests
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
  setActiveChat: (chat) => {
    set((state) => ({ 
      activeChat: chat, 
      messages: [], 
      nextCursor: null, 
      hasMore: true,
      activeView: 'chat',
      chats: state.chats.map(c => c.id === chat?.id ? { ...c, unread_count: 0 } : c)
    }));
  },
  setActiveView: (view) => set({ activeView: view }),
  setShowInfoPanel: (show: boolean) => set({ showInfoPanel: show }),
  setIsAddFriendModalOpen: (open) => set({ isAddFriendModalOpen: open }),
  setIsStartChatModalOpen: (open) => set({ isStartChatModalOpen: open }),
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
    // 1. Update the message list if it belongs to active chat
    const updatedMessages = state.messages.map(m => {
      if (m.id === message.id) {
        return { ...m, ...message };
      }
      return m;
    });

    // 2. Update the chat list (for last_message and unread counts)
    const updatedChats = state.chats.map(chat => {
      if (chat.id === message.chat_id) {
        const isCurrentLast = chat.last_message?.id === message.id;
        return {
          ...chat,
          last_message: isCurrentLast ? { ...chat.last_message, ...message } : chat.last_message,
          // If a message we are receiving an update for is now read, or vice versa
          // we don't manually tick unread_count here as that's complex, 
          // usually best to let the specific "mark as read" logic handle it.
        };
      }
      return chat;
    });

    return { chats: updatedChats, messages: updatedMessages };
  }),
  resolveOptimisticMessage: (tempId, realMessage) => set((state) => {
    const updatedMessages = state.messages.map(m => 
      m.id === tempId ? { ...realMessage, sending: false } : m
    );
    
    const updatedChats = state.chats.map(chat => {
      if (chat.id === realMessage.chat_id) {
        return { ...chat, last_message: realMessage };
      }
      return chat;
    });

    return { messages: updatedMessages, chats: updatedChats };
  }),
  receiveGlobalMessage: (message, currentUserId) => set((state) => {
    const isForActiveChat = state.activeChat?.id === message.chat_id;
    const isMe = message.sender_id === currentUserId;

    // 1. Try to find the profile for this message if it's missing sender_profile
    let enhancedMessage = { ...message };
    if (!enhancedMessage.sender_profile) {
      // Look in participants of all chats for this user's profile
      for (const chat of state.chats) {
        const participant = chat.chat_participants?.find(p => p.user_id === message.sender_id);
        if (participant?.profiles) {
          enhancedMessage.sender_profile = participant.profiles;
          break;
        }
      }
    }

    // 2. Update Chat List (last_message, order, and unread count)
    const updatedChats = state.chats.map(chat => {
      if (chat.id === message.chat_id) {
        const isUnread = !isForActiveChat && !isMe;
        return {
          ...chat,
          last_message: enhancedMessage,
          unread_count: isUnread ? (chat.unread_count || 0) + 1 : (chat.unread_count || 0)
        }
      }
      return chat
    }).sort((a, b) => {
      const timeA = new Date(a.last_message?.created_at || a.created_at).getTime()
      const timeB = new Date(b.last_message?.created_at || b.created_at).getTime()
      return timeB - timeA
    });

    // 3. Update Message List if active
    if (isForActiveChat) {
      // Prevent duplicates (e.g. from both global and local listeners, or optimistic return)
      if (state.messages.some(m => m.id === message.id)) {
        return { chats: updatedChats };
      }

      // Check if this message was an optimistic one (same content/sender)
      // This is a fallback in case the local component didn't handle it
      const optimisticIndex = state.messages.findIndex(m => 
        m.sending && 
        m.sender_id === message.sender_id && 
        m.content === message.content
      );

      if (optimisticIndex !== -1) {
        const newMessages = [...state.messages];
        newMessages[optimisticIndex] = enhancedMessage;
        return { 
          chats: updatedChats,
          messages: newMessages 
        };
      }

      return { 
        chats: updatedChats,
        messages: [...state.messages, enhancedMessage] 
      };
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
  })),
  deleteChat: async (chatId) => {
    try {
      const { error } = await supabase
        .from('chats')
        .delete()
        .eq('id', chatId);
      if (error) throw error;
      set((state) => ({
        chats: state.chats.filter(c => c.id !== chatId),
        activeChat: state.activeChat?.id === chatId ? null : state.activeChat
      }));
    } catch (err) {
      console.error('Failed to delete chat:', err);
    }
  },
  startPrivateChat: async (otherUserId) => {
    const { user } = useAuthStore.getState();
    if (!user) {
      return;
      return;
    }


    // 1. Check if chat exists locally first
    const state = useChatStore.getState();
    const existingChat = state.chats.find(chat => 
      chat.type === 'private' && 
      chat.chat_participants?.some(p => p.user_id === otherUserId)
    );

    if (existingChat) {
      set({ 
        activeChat: { ...existingChat },
        messages: [],
        nextCursor: null,
        hasMore: true,
        activeView: 'chat'
      });
      return;
    }

    // 2. Switch view and set pending state to provide immediate feedback
    set({ activeView: 'chat', activeChat: { id: 'pending', type: 'private' } as any });

    try {
      
      // Find a private chat where both users are participants
      const { data: participationData, error: findError } = await supabase
        .from('chat_participants')
        .select('chat_id')
        .eq('user_id', user.id);
        
      if (findError) throw findError;
      
      const chatIds = participationData?.map(p => p.chat_id) || [];
      
      if (chatIds.length > 0) {
        const { data: matchData, error: matchError } = await supabase
          .from('chat_participants')
          .select('chat_id')
          .in('chat_id', chatIds)
          .eq('user_id', otherUserId)
          .maybeSingle(); // Use maybeSingle to avoid error if none found
          
        if (matchError) throw matchError;

        if (matchData) {
          const { data: fullChat, error: fullChatError } = await supabase
            .from('chats')
            .select(`
              *,
              chat_participants (
                user_id,
                profiles (*)
              ),
              messages (
                content,
                created_at,
                is_read,
                sender_id
              )
            `)
            .eq('id', matchData.chat_id)
            .single();
            
          if (fullChatError) throw fullChatError;

          if (fullChat) {
             const processedChat = { 
               ...fullChat, 
               last_message: (fullChat as any).messages?.[(fullChat as any).messages.length - 1], 
               unread_count: 0 
             };
             set(s => ({
               chats: s.chats.some(c => c.id === processedChat.id) ? s.chats : [processedChat as any, ...s.chats],
               activeChat: processedChat as any,
               activeView: 'chat'
             }));
             return;
          }
        }
      }

      // 3. Create new if truly doesn't exist
      const { data: newChat, error: chatError } = await supabase
        .from('chats')
        .insert([{ type: 'private', created_by: user.id }])
        .select()
        .single();

      if (chatError) throw chatError;

      const { error: partError } = await supabase
        .from('chat_participants')
        .insert([
          { chat_id: newChat.id, user_id: user.id, role: 'owner' },
          { chat_id: newChat.id, user_id: otherUserId, role: 'member' }
        ]);

      if (partError) throw partError;

      // Fetch the full chat data to ensure consistency
      const { data: completeChat, error: completeError } = await supabase
        .from('chats')
        .select(`
          *,
          chat_participants (
            user_id,
            profiles (*)
          )
        `)
        .eq('id', newChat.id)
        .single();
      
      if (completeError) throw completeError;

      const processedChat = { ...completeChat, last_message: null, unread_count: 0 };
      
      set((s) => ({
        chats: [processedChat as any, ...s.chats],
        activeChat: processedChat as any,
        activeView: 'chat'
      }));

    } catch (err: any) {
      console.error('[startPrivateChat] CRITICAL FAILURE:', err);
      // Reset activeChat on failure so the UI doesn't stay stuck on "Establishing..."
      set({ activeChat: null });
      alert(`Connection failed: ${err.message || 'The network peer is currently unreachable.'}`);
    }
  }
}))

