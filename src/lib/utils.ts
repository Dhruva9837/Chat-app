export function getAvatarUrl(profile: any, chatId?: string) {
  if (!profile) return `https://api.dicebear.com/7.x/avataaars/svg?seed=${chatId || 'default'}`
  
  if (profile.avatar_url) return profile.avatar_url

  // Use gender-based logic as a default for missing avatars
  if (profile.gender === 'female') {
    return `https://api.dicebear.com/7.x/adventurer/svg?seed=${profile.email || profile.id}`
  }
  
  if (profile.gender === 'male') {
    return `https://api.dicebear.com/7.x/pixel-art/svg?seed=${profile.email || profile.id}`
  }

  // Final fallback
  return `https://unavatar.io/${profile.email}?fallback=https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.email || profile.id}`
}

export function formatTime(dateString: string | Date) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(date)
}
