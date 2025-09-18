import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateRoom } from '../../_store';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ room: string }> }) {
  const { room: roomId } = await params;
  const rec = getOrCreateRoom(roomId);
  return NextResponse.json({ answer: rec.answer || null });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ room: string }> }) {
  const { room: roomId } = await params;
  const body = await req.json().catch(() => ({}));
  const sdp = typeof body?.sdp === 'string' ? body.sdp : null;
  if (!sdp) return NextResponse.json({ message: 'Missing sdp' }, { status: 400 });
  const rec = getOrCreateRoom(roomId);
  rec.answer = sdp;
  return NextResponse.json({ ok: true });
}
