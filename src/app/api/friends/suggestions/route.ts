import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabaseServer';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const supabase = createServerSupabase();

    // 1. Get friend IDs
    const { data: friendsData } = await supabase
      .from('friends')
      .select('friend_id')
      .eq('user_id', userId);

    const { data: friendsDataReverse } = await supabase
      .from('friends')
      .select('user_id')
      .eq('friend_id', userId);

    const friendIds = [
      ...(friendsData?.map(f => f.friend_id) || []),
      ...(friendsDataReverse?.map(f => f.user_id) || [])
    ];

    // 2. Get pending request IDs
    const { data: sentRequests } = await supabase
      .from('friend_requests')
      .select('receiver_id')
      .eq('sender_id', userId)
      .eq('status', 'pending');

    const { data: receivedRequests } = await supabase
      .from('friend_requests')
      .select('sender_id')
      .eq('receiver_id', userId)
      .eq('status', 'pending');

    const pendingIds = [
      ...(sentRequests?.map(r => r.receiver_id) || []),
      ...(receivedRequests?.map(r => r.sender_id) || [])
    ];

    // 3. Combined exclusion list
    const excludeIds = [userId, ...friendIds, ...pendingIds];

    // 4. Fetch potential candidates
    // We fetch users who are not in the exclusion list
    // We prioritize online status or recently active
    const { data: suggestions, error } = await supabase
      .from('profiles')
      .select('id, name, username, avatar_url, status, last_seen')
      .not('id', 'in', `(${excludeIds.join(',')})`)
      .order('status', { ascending: false }) // online first
      .order('last_seen', { ascending: false })
      .limit(6);

    if (error) throw error;

    return NextResponse.json({ suggestions });
  } catch (error: any) {
    console.error('Suggestions API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
