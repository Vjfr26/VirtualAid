import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateRoom } from '../../_store';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ room: string }> }) {
  const { room: roomId } = await params;
  const rec = getOrCreateRoom(roomId);
  return NextResponse.json({ roomId: roomId, hasOffer: !!rec.offer, hasAnswer: !!rec.answer });
}
