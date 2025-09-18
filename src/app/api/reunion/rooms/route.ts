import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '../_store';

export async function GET(req: NextRequest) {
  const { rooms } = getStore();
  const params = new URL(req.url).searchParams;
  const openOnly = params.get('open') === 'true';
  const list = Array.from(rooms.values()).map(r => ({
    roomId: r.roomId,
    createdAt: new Date(r.createdAt).toISOString(),
    hasOffer: !!r.offer,
    hasAnswer: !!r.answer,
  })).filter(r => !openOnly || (r.hasOffer && !r.hasAnswer));
  return NextResponse.json({ rooms: list });
}
