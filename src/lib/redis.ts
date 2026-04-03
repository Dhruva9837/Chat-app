import { Redis } from '@upstash/redis'

// Configuration for Upstash Redis (serverless-friendly)
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export default redis

/**
 * Presence Helpers
 */
export async function setUserPresence(userId: string, data: any) {
  const key = `user_presence:${userId}`
  // Set presence with a TTL (e.g., 60 seconds)
  await redis.set(key, JSON.stringify({ ...data, last_seen: new Date().toISOString() }), { ex: 60 })
  // Add to active users set
  await redis.sadd('active_users', userId)
}

export async function getOnlineUsers() {
  const userIds = await redis.smembers('active_users')
  if (userIds.length === 0) return []

  const pipeline = redis.pipeline()
  userIds.forEach(id => pipeline.get(`user_presence:${id}`))
  const results = await pipeline.exec()

  const onlineUsers = []
  const expiredUsers = []

  for (let i = 0; i < userIds.length; i++) {
    if (results[i]) {
      onlineUsers.push(results[i])
    } else {
      expiredUsers.push(userIds[i])
    }
  }

  // Cleanup expired users from the set
  if (expiredUsers.length > 0) {
    await redis.srem('active_users', ...expiredUsers)
  }

  return onlineUsers
}

/**
 * Message Caching Helpers
 */
export async function cacheRecentMessages(chatId: string, messages: any[]) {
  const key = `chat_messages:${chatId}`
  // Cache the last 50 messages
  await redis.set(key, JSON.stringify(messages.slice(-50)), { ex: 3600 }) // 1 hour cache
}

export async function getCachedMessages(chatId: string) {
  const key = `chat_messages:${chatId}`
  return await redis.get(key)
}

/**
 * Rate Limiting Helper (Generic)
 */
export async function checkRateLimit(identifier: string, limit: number, windowSeconds: number) {
  const key = `rate_limit:${identifier}`
  const count = await redis.incr(key)
  if (count === 1) {
    await redis.expire(key, windowSeconds)
  }
  return count <= limit
}
