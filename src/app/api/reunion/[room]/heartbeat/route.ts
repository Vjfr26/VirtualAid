import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateRoom } from '../../_store';

/**
 * POST /api/reunion/[room]/heartbeat
 * 
 * Mantiene la sala viva y respalda mensajes de chat periódicamente.
 * El backend puede usar esto para limpiar salas inactivas.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ room: string }> }) {
  const { room: roomId } = await params;
  console.log(`\n[API-HEARTBEAT] 💓 POST /api/reunion/${roomId}/heartbeat`);
  
  const body = await req.json().catch(() => ({}));
  const messages = Array.isArray(body?.messages) ? body.messages : [];
  
  const rec = getOrCreateRoom(roomId);
  
  // Actualizar timestamp de última actividad
  rec.lastHeartbeat = Date.now();
  
  // Opcionalmente guardar mensajes temporales
  if (messages.length > 0) {
    console.log(`[API-HEARTBEAT] 📨 Respaldando ${messages.length} mensajes`);
    // TODO: Implementar almacenamiento temporal si es necesario
  }
  
  console.log(`[API-HEARTBEAT] ✅ Heartbeat registrado`);
  
  return NextResponse.json({ ok: true });
}
