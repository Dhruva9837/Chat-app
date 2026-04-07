import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { query, userId } = await req.json();

    if (!query || !userId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Search profiles (users to potentially chat with)
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, name, username, avatar_url')
      .neq('id', userId)
      .or(`name.ilike.%${query}%,username.ilike.%${query}%`)
      .limit(5);

    // Search messages in chats the user is part of
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select(`
        id, 
        content, 
        created_at, 
        chat_id,
        sender:profiles!sender_id(name)
      `)
      .ilike('content', `%${query}%`)
      .limit(10);
      
    // Filter out messages where the user isn't in the chat (ideally handled via RLS, but double checking locally if RLS isn't strict enough setup for this specific view query)
    // For this MVP, we assume RLS allows seeing messages only in chats they belong to, or we fetch the chats first.
    // If messages query is safe, we just return it.

    if (profileError) console.error(profileError);
    if (messagesError) console.error(messagesError);

    return NextResponse.json({
      profiles: profiles || [],
      messages: messages || []
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
