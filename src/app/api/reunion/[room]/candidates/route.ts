import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateRoom } from '../../_store';

export async function GET(req: NextRequest, { params }: { params: Promise<{ room: string }> }) {
  const { room: roomId } = await params;
  const who = (new URL(req.url).searchParams.get('for') || '').toLowerCase();
  if (who !== 'caller' && who !== 'callee') {
    return NextResponse.json({ message: 'Invalid role' }, { status: 400 });
  }
  const room = getOrCreateRoom(roomId);
  const cands = who === 'caller' ? room.candidates.caller : room.candidates.callee;
  const out = [...cands];
  // Opcional: limpiar después de leer para minimizar duplicados
  if (who === 'caller') room.candidates.caller = [];
  else room.candidates.callee = [];
  return NextResponse.json({ candidates: out });
}

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
