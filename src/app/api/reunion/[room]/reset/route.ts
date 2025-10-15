import { NextRequest, NextResponse } from 'next/server';

// In-memory cache para las salas de reunión
const rooms = new Map<string, {
  roomId: string;
  offer: string | null;
  answer: string | null;
  candidates: { caller: RTCIceCandidateInit[]; callee: RTCIceCandidateInit[] };
  messages: any[];
  createdAt: Date;
  lastHeartbeat: Date;
}>();

/**
 * POST /api/reunion/[room]/reset
 * Resetea la negociación de una sala (limpia offer, answer, candidates)
 * Útil para reconexión limpia después de desconexión
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ room: string }> }
) {
  try {
    const params = await context.params;
    const rid = params.room;

    if (!rid) {
      return NextResponse.json({ error: 'roomId requerido' }, { status: 400 });
    }

    const room = rooms.get(rid);
    
    if (!room) {
      // Si la sala no existe, crearla vacía (para que pueda iniciar negociación)
      console.log(`[API Reset] Sala ${rid} no existe, creando nueva`);
      rooms.set(rid, {
        roomId: rid,
        offer: null,
        answer: null,
        candidates: { caller: [], callee: [] },
        messages: [],
        createdAt: new Date(),
        lastHeartbeat: new Date()
      });
      return NextResponse.json({ ok: true, created: true });
    }

    // Limpiar solo la negociación, mantener la sala y mensajes
    console.log(`[API Reset] 🧹 Limpiando negociación de sala ${rid}`);
    console.log(`[API Reset] Antes: offer=${!!room.offer}, answer=${!!room.answer}, candidates=${room.candidates.caller.length + room.candidates.callee.length}`);
    
    room.offer = null;
    room.answer = null;
    room.candidates.caller = [];
    room.candidates.callee = [];
    room.lastHeartbeat = new Date();

    console.log(`[API Reset] ✅ Sala ${rid} reseteada y lista para nueva negociación`);

    return NextResponse.json({ 
      ok: true, 
      reset: true,
      roomId: rid
    });

  } catch (error) {
    console.error('[API Reset] Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Exportar rooms para que otros endpoints lo usen
export { rooms };
