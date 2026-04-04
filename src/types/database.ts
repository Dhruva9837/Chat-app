export type Profile = {
  id: string
  name: string
  username: string
  email: string
  avatar_url?: string
  bio?: string
  status: 'online' | 'idle' | 'dnd' | 'offline' | 'typing'
  last_seen: string
  gender?: 'male' | 'female' | 'other' | 'unspecified'
  avatar_decoration?: string
}

export type Chat = {
  id: string
  type: 'private' | 'group'
  name?: string
  created_at: string
  last_message?: Message
  unread_count?: number
}

export type Participant = {
  id: string
  chat_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member'
  joined_at: string
}

export type Message = {
  id: string
  chat_id: string
  sender_id: string
  content: string
  message_type: 'text' | 'image'
  image_url?: string
  created_at: string
  is_read: boolean
}
