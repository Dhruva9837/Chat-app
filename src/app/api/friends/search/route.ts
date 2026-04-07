import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabaseServer';

export async function POST(req: NextRequest) {
  try {
    const { username } = await req.json();
    
    if (!username || typeof username !== 'string') {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const supabase = createServerSupabase();
    
    // Search for user by exact username
    const { data: profile, error: searchError } = await supabase
      .from('profiles')
      .select('id, name, username, avatar_url, status')
      .eq('username', username.trim().toLowerCase())
      .single();

    if (searchError || !profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ profile });
  } catch (error: any) {
    console.error('Search API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
