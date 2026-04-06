import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabaseServer'

export async function POST(req: Request) {
  try {
    const { chatId, userIds } = await req.json()
    if (!chatId || !userIds || !Array.isArray(userIds)) {
      return NextResponse.json({ error: 'chatId and userIds array are required' }, { status: 400 })
    }

    const supabase = createServerSupabase()
    
    const participants = userIds.map(userId => ({
      chat_id: chatId,
      user_id: userId,
      role: 'member'
    }))

    const { error } = await supabase
      .from('chat_participants')
      .insert(participants)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const chatId = searchParams.get('chatId')
    const userId = searchParams.get('userId')

    if (!chatId || !userId) {
      return NextResponse.json({ error: 'chatId and userId are required' }, { status: 400 })
    }

    const supabase = createServerSupabase()

    const { error } = await supabase
      .from('chat_participants')
      .delete()
      .match({ chat_id: chatId, user_id: userId })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
