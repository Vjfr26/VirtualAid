import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '../_store';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ room: string }> }) {
  const { room: roomId } = await params;
  const store = getStore();
  const existed = store.rooms.delete(roomId);
  return NextResponse.json({ ok: true, deleted: existed });
}
