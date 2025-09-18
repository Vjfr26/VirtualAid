import { NextResponse } from 'next/server';
import { getOrCreateRoom } from '../_store';

export async function POST() {
  const roomId = crypto.randomUUID();
  getOrCreateRoom(roomId);
  return NextResponse.json({ roomId });
}
