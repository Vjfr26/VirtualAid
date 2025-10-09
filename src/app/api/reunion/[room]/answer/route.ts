import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateRoom } from '../../_store';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ room: string }> }) {
  const { room: roomId } = await params;
  const rec = getOrCreateRoom(roomId);
  
  console.log(`[API-ANSWER] 📥 GET /api/reunion/${roomId}/answer`);
  console.log(`[API-ANSWER] Answer existe: ${!!rec.answer}`);
  if (rec.answer) {
    try {
      const parsed = JSON.parse(rec.answer);
      console.log(`[API-ANSWER] Answer válida: type=${parsed.type}, sdp length=${parsed.sdp?.length || 0}`);
    } catch {
      console.warn(`[API-ANSWER] ⚠️ Answer existe pero no es JSON válido`);
    }
  }
  
  return NextResponse.json({ answer: rec.answer || null });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ room: string }> }) {
  const { room: roomId } = await params;
  console.log(`\n[API-ANSWER] 📤 POST /api/reunion/${roomId}/answer`);
  
  const body = await req.json().catch(() => ({}));
  const sdp = typeof body?.sdp === 'string' ? body.sdp : null;
  
  if (!sdp) {
    console.error(`[API-ANSWER] ❌ ERROR: Missing sdp in body`);
    console.error(`[API-ANSWER] Body received:`, body);
    return NextResponse.json({ message: 'Missing sdp' }, { status: 400 });
  }
  
  // Validar que es JSON válido
  try {
    const parsed = JSON.parse(sdp);
    console.log(`[API-ANSWER] ✅ SDP parseado correctamente: type=${parsed.type}, sdp length=${parsed.sdp?.length || 0}`);
    
    if (parsed.type !== 'answer') {
      console.warn(`[API-ANSWER] ⚠️ Tipo inesperado: ${parsed.type} (esperado 'answer')`);
    }
  } catch (e) {
    console.error(`[API-ANSWER] ❌ ERROR: SDP no es JSON válido`);
    console.error(`[API-ANSWER] Error:`, e);
    console.error(`[API-ANSWER] SDP (primeros 100 chars):`, sdp.substring(0, 100));
    return NextResponse.json({ message: 'Invalid SDP format' }, { status: 400 });
  }
  
  const rec = getOrCreateRoom(roomId);
  
  // Verificar que hay offer antes de aceptar answer
  if (!rec.offer) {
    console.error(`[API-ANSWER] ❌ ERROR: No hay offer en la sala. El médico debe iniciar primero.`);
    return NextResponse.json({ message: 'No offer found. Caller must create offer first.' }, { status: 400 });
  }
  
  rec.answer = sdp;
  
  console.log(`[API-ANSWER] ✅ Answer guardada exitosamente en sala ${roomId}`);
  console.log(`[API-ANSWER] Sala ahora contiene:`);
  console.log(`  - Offer: ${!!rec.offer}`);
  console.log(`  - Answer: ${!!rec.answer}`);
  console.log(`  - Caller candidates: ${rec.candidates.caller?.length || 0}`);
  console.log(`  - Callee candidates: ${rec.candidates.callee?.length || 0}`);
  console.log(`[API-ANSWER] 🎉 NEGOCIACIÓN SDP COMPLETA (offer + answer)\n`);
  
  return NextResponse.json({ ok: true });
}
