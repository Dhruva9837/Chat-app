import { NextResponse } from 'next/server'
import { setUserPresence, getOnlineUsers } from '@/lib/redis'

export async function POST(req: Request) {
  const body = await req.json()
  const { userId, data } = body

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 })
  }

  try {
    await setUserPresence(userId, data)
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET() {
  try {
    const onlineUsers = await getOnlineUsers()
    return NextResponse.json({ onlineUsers })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
