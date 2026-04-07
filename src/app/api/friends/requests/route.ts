import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabaseServer';

// GET: Fetch incoming and outgoing friend requests
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const supabase = createServerSupabase();

    // Fetch incoming requests
    const { data: incoming, error: inError } = await supabase
      .from('friend_requests')
      .select('id, status, created_at, sender_id, sender_profile:profiles!friend_requests_sender_id_fkey(*)')
      .eq('receiver_id', userId)
      .eq('status', 'pending');

    if (inError) throw inError;

    // Fetch outgoing requests
    const { data: outgoing, error: outError } = await supabase
      .from('friend_requests')
      .select('id, status, created_at, receiver_id, receiver_profile:profiles!friend_requests_receiver_id_fkey(*)')
      .eq('sender_id', userId)
      .eq('status', 'pending');

    if (outError) throw outError;

    return NextResponse.json({ incoming, outgoing });
  } catch (error: any) {
    console.error('Fetch Requests API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Accept or Reject a request
export async function POST(req: NextRequest) {
  try {
    const { requestId, action, userId } = await req.json();

    if (!requestId || !action || !userId) {
      return NextResponse.json({ error: 'Request ID, Action, and User ID are required' }, { status: 400 });
    }

    const supabase = createServerSupabase();

    // 1. Get request detail
    const { data: request, error: reqError } = await supabase
      .from('friend_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (reqError || !request) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    if (request.receiver_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (action === 'accept') {
      // Create friendships (bidirectional) and update request status
      const { error: updateError } = await supabase
        .from('friend_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Add to friends table (bidirectional logic: we store one record or two?
      // For simplicity, we'll store TWO records to make search easier OR just one.
      // User design says: user_id, friend_id.
      // We'll insert TWO records for bidirectional lookup.
      const { error: friendError } = await supabase
        .from('friends')
        .insert([
          { user_id: request.sender_id, friend_id: request.receiver_id },
          { user_id: request.receiver_id, friend_id: request.sender_id }
        ]);

      if (friendError) throw friendError;

      return NextResponse.json({ success: true, message: 'Friendship accepted' });
    } else if (action === 'reject') {
      const { error: rejectError } = await supabase
        .from('friend_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId);

      if (rejectError) throw rejectError;

      return NextResponse.json({ success: true, message: 'Friendship rejected' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Manage Requests API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
