import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateRoom } from '../../_store';

/**
 * GET /api/reunion/[room]/state
 * Devuelve el estado de la sala: roomId, hasOffer, hasAnswer
 * Paso 3 del flujo backend
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ room: string }> }) {
  const { room: roomId } = await params;
  console.log(`\n[API-STATE] 📊 GET /api/reunion/${roomId}/state`);
  
  const rec = getOrCreateRoom(roomId);
  
  const state = {
    roomId: rec.roomId,
    hasOffer: !!rec.offer,
    hasAnswer: !!rec.answer,
  };
  
  console.log(`[API-STATE] 📤 Estado: hasOffer=${state.hasOffer}, hasAnswer=${state.hasAnswer}`);
  
  return NextResponse.json(state);
}
