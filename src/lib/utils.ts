export function getAvatarUrl(data: any, chatId?: string) {
  if (!data) return `https://api.dicebear.com/7.x/avataaars/svg?seed=${chatId || 'default'}`
  
  if (data.group_icon) return data.group_icon
  if (data.avatar_url) return data.avatar_url

  // Use gender-based logic as a default for missing avatars
  if (data.gender === 'female') {
    return `https://api.dicebear.com/7.x/adventurer/svg?seed=${data.email || data.id}`
  }
  
  if (data.gender === 'male') {
    return `https://api.dicebear.com/7.x/pixel-art/svg?seed=${data.email || data.id}`
  }

  // Final fallback
  return `https://unavatar.io/${data.email}?fallback=https://api.dicebear.com/7.x/avataaars/svg?seed=${data.email || data.id}`
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
