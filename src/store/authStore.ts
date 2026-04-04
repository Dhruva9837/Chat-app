import { create } from 'zustand'
import { Profile } from '@/types/database'
import { supabase } from '@/lib/supabase'

interface AuthState {
  user: any | null
  profile: Profile | null
  loading: boolean
  setUser: (user: any | null) => void
  setProfile: (profile: Profile | null) => void
  setLoading: (loading: boolean) => void
  updateProfile: (updates: Partial<Profile>) => Promise<void>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  loading: true,
  setUser: (user) => set({ user, loading: false }),
  setLoading: (loading) => set({ loading }),
  setProfile: (profile) => set({ profile }),
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
  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, profile: null, loading: false })
  },
}))
