import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateRoom, getStore } from '../../_store';

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

    const store = getStore();
    let room = store.rooms.get(rid);
    
    if (!room) {
      // Si la sala no existe, crearla vacía (para que pueda iniciar negociación)
      console.log(`[API Reset] Sala ${rid} no existe, creando nueva`);
      room = getOrCreateRoom(rid);
      room.offer = null;
      room.answer = null;
      room.candidates.caller = [];
      room.candidates.callee = [];
      room.messages = [];
      room.lastHeartbeat = Date.now();
      return NextResponse.json({ ok: true, created: true });
    }

    // Limpiar solo la negociación, mantener la sala y mensajes
    console.log(`[API Reset] 🧹 Limpiando negociación de sala ${rid}`);
    console.log(`[API Reset] Antes: offer=${!!room.offer}, answer=${!!room.answer}, candidates=${room.candidates.caller.length + room.candidates.callee.length}`);
    
    room.offer = null;
    room.answer = null;
    room.candidates.caller = [];
    room.candidates.callee = [];
    room.lastHeartbeat = Date.now();
    if (!room.messages) {
      room.messages = [];
    }

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
