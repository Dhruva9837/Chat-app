import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabaseServer';

export async function POST(req: NextRequest) {
  try {
    const { senderId, receiverId } = await req.json();

    if (!senderId || !receiverId) {
      return NextResponse.json({ error: 'Sender and receiver IDs are required' }, { status: 400 });
    }

    if (senderId === receiverId) {
      return NextResponse.json({ error: "You can't add yourself!" }, { status: 400 });
    }

    const supabase = createServerSupabase();

    // 1. Check if receiver exists
    const { data: receiver, error: receiverError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', receiverId)
      .single();

    if (receiverError || !receiver) {
      return NextResponse.json({ error: 'Receiver not found' }, { status: 404 });
    }

    // 2. Check for existing request (any direction)
    const { data: existingRequest, error: checkError } = await supabase
      .from('friend_requests')
      .select('id, status')
      .or(`and(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`)
      .maybeSingle();

    if (existingRequest) {
      if (existingRequest.status === 'accepted') {
        return NextResponse.json({ error: 'You are already friends' }, { status: 400 });
      }
      return NextResponse.json({ error: 'A friend request is already pending' }, { status: 400 });
    }

    // 3. Send the request
    const { error: sendError } = await supabase
      .from('friend_requests')
      .insert({
        sender_id: senderId,
        receiver_id: receiverId,
        status: 'pending'
      });

    if (sendError) {
      throw sendError;
    }

    return NextResponse.json({ success: true, message: 'Friend request sent' });
  } catch (error: any) {
    console.error('Send Request API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
