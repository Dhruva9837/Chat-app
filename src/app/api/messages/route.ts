import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabaseServer'
import redis, { cacheRecentMessages, getCachedMessages } from '@/lib/redis'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const chatId = searchParams.get('chatId')
  const cursor = searchParams.get('cursor') // Timestamp for cursor-based pagination
  const limit = parseInt(searchParams.get('limit') || '50')

  if (!chatId) {
    return NextResponse.json({ error: 'chatId is required' }, { status: 400 })
  }

  // 1. Try to fetch from Redis if it's the first page (no cursor)
  if (!cursor) {
    const cached = await getCachedMessages(chatId)
    if (cached) {
      const cachedMessagesArray = cached as any[]
      return NextResponse.json({ messages: cachedMessagesArray, nextCursor: cachedMessagesArray[0]?.created_at })
    }
  }

  // 2. Fetch from Supabase
  const supabase = createServerSupabase()
  let query = supabase
    .from('messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (cursor) {
    query = query.lt('created_at', cursor)
  }

  const { data: messages, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // 3. Cache the first page in Redis
  if (!cursor && messages && messages.length > 0) {
    await cacheRecentMessages(chatId, messages)
  }

  const nextCursor = messages.length === limit ? messages[messages.length - 1].created_at : null

  return NextResponse.json({ messages, nextCursor })
}

export async function POST(req: Request) {
  const body = await req.json()
  const { chat_id, sender_id, content, message_type } = body

  if (!chat_id || !sender_id || !content) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = createServerSupabase()
  
  // 1. Persist to Supabase
  const { data: message, error } = await supabase
    .from('messages')
    .insert([{ chat_id, sender_id, content, message_type: message_type || 'text' }])
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // 2. Invalidate/Update Redis Cache for this chat
  // For simplicity, we just clear the cache so the next GET fetches fresh data
  await redis.del(`chat_messages:${chat_id}`)

  return NextResponse.json(message)
}
