import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateRoom } from '../../_store';

/**
 * GET /api/reunion/[room]/candidates?for=caller|callee&since=<ISO_TIMESTAMP>
 * 
 * Obtiene los candidatos ICE para el rol especificado.
 * El parámetro `since` filtra solo candidatos añadidos después de ese timestamp.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ room: string }> }) {
  const { room: roomId } = await params;
  const url = new URL(req.url);
  const who = (url.searchParams.get('for') || '').toLowerCase();
  const sinceParam = url.searchParams.get('since'); // ISO timestamp: "2025-10-09T15:45:00Z"
  
  if (who !== 'caller' && who !== 'callee') {
    return NextResponse.json({ message: 'Invalid role' }, { status: 400 });
  }
  
  const room = getOrCreateRoom(roomId);
  // CRÍTICO: caller recibe candidates DEL callee, y viceversa
  const cands = who === 'caller' ? room.candidates.callee : room.candidates.caller;
  
  let out = [...cands];
  
  // Filtrar por timestamp si se proporciona `since`
  if (sinceParam) {
    try {
      const sinceTimestamp = new Date(sinceParam).getTime();
      // Los candidatos deberían tener un timestamp, pero si no lo tienen, los incluimos
      out = out.filter((c: any) => {
        if (c.timestamp) {
          const candTimestamp = typeof c.timestamp === 'number' ? c.timestamp : new Date(c.timestamp).getTime();
          return candTimestamp > sinceTimestamp;
        }
        return true; // Incluir candidatos sin timestamp
      });
      console.log(`[API-CANDIDATES] 📥 GET con filtro since=${sinceParam}: ${out.length}/${cands.length} candidatos`);
    } catch (e) {
      console.warn(`[API-CANDIDATES] ⚠️ Timestamp 'since' inválido: ${sinceParam}`);
    }
  }
  
  // Limpiar los candidates que ya se leyeron (del otro peer)
  if (who === 'caller') room.candidates.callee = [];
  else room.candidates.caller = [];
  
  return NextResponse.json({ candidates: out });
}

/**
 * POST /api/reunion/[room]/candidate
 * 
 * Publica un candidato ICE de caller o callee.
 * Endpoint singular para compatibilidad con backend.
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
