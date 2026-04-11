import { create } from 'zustand'
import { Profile, UserSettings } from '@/types/database'
import { supabase } from '@/lib/supabase'

interface AuthState {
  user: any | null
  profile: Profile | null
  settings: UserSettings | null
  loading: boolean
  setUser: (user: any | null) => void
  setProfile: (profile: Profile | null) => void
  setSettings: (settings: UserSettings | null) => void
  setLoading: (loading: boolean) => void
  updateProfile: (updates: Partial<Profile>) => Promise<void>
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  settings: null,
  loading: true,
  setUser: (user) => set({ user, loading: false }),
  setLoading: (loading) => set({ loading }),
  setProfile: (profile) => set({ profile }),
  setSettings: (settings) => set({ settings }),
  updateProfile: async (updates) => {
    const profile = useAuthStore.getState().profile
    if (!profile) return

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', profile.id)

    if (error) throw error
    set({ profile: { ...profile, ...updates } })
  },
  updateSettings: async (updates) => {
    const profile = useAuthStore.getState().profile
    const settings = useAuthStore.getState().settings
    if (!profile || !settings) return

    const { error } = await supabase
      .from('user_settings')
      .update(updates)
      .eq('id', profile.id)

    if (error) throw error
    set({ settings: { ...settings, ...updates } })
  },
  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, profile: null, settings: null, loading: false })
  },
}))
