import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabaseServer';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const supabase = createServerSupabase();

    // Fetch friends for the given user ID
    // We join with profiles to get friend details
    const { data: friends, error: listError } = await supabase
      .from('friends')
      .select('id, friend_id, created_at, friend_profile:profiles!friends_friend_id_fkey(*)')
      .eq('user_id', userId);

    if (listError) throw listError;

    return NextResponse.json({ friends });
  } catch (error: any) {
    console.error('Friends List API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
