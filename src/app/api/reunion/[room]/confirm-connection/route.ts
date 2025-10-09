import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateRoom } from '../../_store';

/**
 * POST /api/reunion/[room]/confirm-connection
 * 
 * Confirma que la conexión WebRTC se estableció exitosamente.
 * El backend puede usar esto para marcar asistencia automática.
 */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ room: string }> }) {
  const { room: roomId } = await params;
  console.log(`\n[API-CONFIRM] ✅ POST /api/reunion/${roomId}/confirm-connection`);
  
  const rec = getOrCreateRoom(roomId);
  
  // Marcar conexión como confirmada
  rec.connectionConfirmed = true;
  
  console.log(`[API-CONFIRM] 🎉 Conexión WebRTC confirmada para sala ${roomId}`);
  console.log(`[API-CONFIRM] 📊 Estado: offer=${!!rec.offer}, answer=${!!rec.answer}, confirmed=${rec.connectionConfirmed}`);
  
  // TODO: Aquí el backend podría marcar asistencia en la base de datos
  
  return NextResponse.json({ ok: true });
}
