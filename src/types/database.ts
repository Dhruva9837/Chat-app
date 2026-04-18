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
  // Extended Details
  full_name?: string
  phone_number?: string
  website?: string
  location?: string
  birth_date?: string
  job_title?: string
  is_verified?: boolean
  account_tier?: 'free' | 'pro' | 'enterprise'
}

export type UserSettings = {
  id: string
  theme: 'dark' | 'light' | 'midnight'
  font_size: number
  allow_dms: boolean
  safe_messaging: boolean
  reduced_motion: boolean
  notifications_enabled: boolean
  sound_enabled: boolean
  read_receipts: boolean
  online_status_visible: boolean
  updated_at: string
}

export type Chat = {
  id: string
  type: 'private' | 'group'
  name?: string
  group_icon?: string
  created_by?: string
  created_at: string
  last_message?: Message
  unread_count?: number
  chat_participants?: (Participant & { profiles: Profile })[]
}

export type Participant = {
  id: string
  chat_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member'
  joined_at: string
  profiles?: Profile
  // UI helper
  sender_profile?: Profile 
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
  sender_profile?: Profile
  // UI helpers
  sending?: boolean
}
