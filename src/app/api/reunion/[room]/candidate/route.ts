import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateRoom } from '../../_store';

/**
 * POST /api/reunion/[room]/candidate
 * 
 * Publica un candidato ICE de caller o callee.
 * Endpoint singular para compatibilidad con el flujo del backend.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ room: string }> }) {
  const { room: roomId } = await params;
  console.log(`\n[API-CANDIDATE] 📤 POST /api/reunion/${roomId}/candidate`);
  
  const body = await req.json().catch(() => ({}));
  const from = (body?.from || '').toLowerCase();
  const candidate = body?.candidate;
  
  if ((from !== 'caller' && from !== 'callee') || !candidate) {
    console.error(`[API-CANDIDATE] ❌ Payload inválido: from=${from}, candidate=${!!candidate}`);
    return NextResponse.json({ message: 'Invalid payload' }, { status: 400 });
  }
  
  const room = getOrCreateRoom(roomId);
  
  // Agregar timestamp al candidato para soporte del filtro `since`
  const candidateWithTimestamp = {
    ...candidate,
    timestamp: Date.now() // Timestamp en milisegundos
  };
  
  if (from === 'caller') {
    room.candidates.caller.push(candidateWithTimestamp);
    console.log(`[API-CANDIDATE] ✅ Candidato de CALLER guardado (total: ${room.candidates.caller.length})`);
  } else {
    room.candidates.callee.push(candidateWithTimestamp);
    console.log(`[API-CANDIDATE] ✅ Candidato de CALLEE guardado (total: ${room.candidates.callee.length})`);
  }
  
  return NextResponse.json({ ok: true });
}
