import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateRoom } from '../../_store';

export async function POST(req: NextRequest, { params }: { params: Promise<{ room: string }> }) {
  const { room: roomId } = await params;
  const body = await req.json().catch(() => ({}));
  const from = (body?.from || '').toLowerCase();
  const candidate = body?.candidate;
  if ((from !== 'caller' && from !== 'callee') || !candidate) {
    return NextResponse.json({ message: 'Invalid payload' }, { status: 400 });
  }
  const room = getOrCreateRoom(roomId);
  if (from === 'caller') room.candidates.caller.push(candidate);
  else room.candidates.callee.push(candidate);
  return NextResponse.json({ ok: true });
}
