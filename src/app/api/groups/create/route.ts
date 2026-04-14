import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabaseServer'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { chat_id, members, created_by } = body

    if (!chat_id || !members || !Array.isArray(members) || !created_by) {
      return NextResponse.json({ error: 'Missing required fields: chat_id, members, or created_by' }, { status: 400 })
    }

    const supabase = createServerSupabase()

    // 1. Add Participants
    const participants = [
      { chat_id: chat_id, user_id: created_by, role: 'admin' },
      ...members.map(memberId => ({
        chat_id: chat_id,
        user_id: memberId,
        role: 'member'
      }))
    ]

    const { error: partError } = await supabase
      .from('chat_participants')
      .insert(participants)

    if (partError) throw partError

    // 2. Return the full chat object with participants
    const { data: fullChat, error: fullError } = await supabase
      .from('chats')
      .select(`
        *,
        chat_participants (
          *,
          profiles:user_id (*)
        )
      `)
      .eq('id', chat_id)
      .single()

    if (fullError) throw fullError

    return NextResponse.json(fullChat)
  } catch (error: any) {
    console.error('Group creation error:', error)
    return NextResponse.json({ error: error.message || 'Failed to create group' }, { status: 500 })
  }
}
