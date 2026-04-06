import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabaseServer'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, members, icon, created_by } = body

    if (!name || !members || !Array.isArray(members) || !created_by) {
      return NextResponse.json({ error: 'Missing required fields: name, members, or created_by' }, { status: 400 })
    }

    const supabase = createServerSupabase()

    // 1. Create the Group Chat
    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .insert([{ 
        name, 
        type: 'group', 
        group_icon: icon || null,
        created_by: created_by
      }])
      .select()
      .single()

    if (chatError) throw chatError

    // 2. Add Participants
    // Creator is Admin, others are Member
    const participants = [
      { chat_id: chat.id, user_id: created_by, role: 'admin' },
      ...members.map(memberId => ({
        chat_id: chat.id,
        user_id: memberId,
        role: 'member'
      }))
    ]

    const { error: partError } = await supabase
      .from('chat_participants')
      .insert(participants)

    if (partError) throw partError

    // 3. Return the full chat object with participants (matching types/database.ts)
    const { data: fullChat, error: fullError } = await supabase
      .from('chats')
      .select(`
        *,
        chat_participants (
          *,
          profiles:user_id (*)
        )
      `)
      .eq('id', chat.id)
      .single()

    if (fullError) throw fullError

    return NextResponse.json(fullChat)
  } catch (error: any) {
    console.error('Group creation error:', error)
    return NextResponse.json({ error: error.message || 'Failed to create group' }, { status: 500 })
  }
}
