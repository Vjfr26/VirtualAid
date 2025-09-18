import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateRoom } from '../../_store';

export async function POST(req: NextRequest, { params }: { params: Promise<{ room: string }> }) {
  const { room: roomId } = await params;
  const body = await req.json().catch(() => ({}));
  const messages = Array.isArray(body?.messages) ? body.messages : [];
  const room = getOrCreateRoom(roomId);
  // Aquí podrías persistir messages y generar un archivo/registro.
  // Para MVP devolvemos un path simulado.
  // Limpiamos candidatos para no crecer en memoria.
  room.candidates.caller = [];
  room.candidates.callee = [];
  return NextResponse.json({ saved: true, path: `/logs/reunion/${roomId}.json`, messagesCount: messages.length });
}
