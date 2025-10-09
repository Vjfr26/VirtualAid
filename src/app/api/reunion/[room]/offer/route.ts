import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateRoom } from '../../_store';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ room: string }> }) {
  const { room: roomId } = await params;
  const rec = getOrCreateRoom(roomId);
  
  console.log(`[API-OFFER] 📥 GET /api/reunion/${roomId}/offer`);
  console.log(`[API-OFFER] Offer existe: ${!!rec.offer}`);
  if (rec.offer) {
    try {
      const parsed = JSON.parse(rec.offer);
      console.log(`[API-OFFER] Offer válida: type=${parsed.type}, sdp length=${parsed.sdp?.length || 0}`);
    } catch {
      console.warn(`[API-OFFER] ⚠️ Offer existe pero no es JSON válido`);
    }
  }
  
  return NextResponse.json({ offer: rec.offer || null });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ room: string }> }) {
  const { room: roomId } = await params;
  console.log(`\n[API-OFFER] 📤 POST /api/reunion/${roomId}/offer`);
  
  const body = await req.json().catch(() => ({}));
  const sdp = typeof body?.sdp === 'string' ? body.sdp : null;
  const clientId = typeof body?.clientId === 'string' ? body.clientId : undefined;
  
  if (clientId) {
    console.log(`[API-OFFER] 👤 ClientId: ${clientId}`);
  }
  
  if (!sdp) {
    console.error(`[API-OFFER] ❌ ERROR: Missing sdp in body`);
    console.error(`[API-OFFER] Body received:`, body);
    return NextResponse.json({ message: 'Missing sdp' }, { status: 400 });
  }
  
  // Validar que es JSON válido
  try {
    const parsed = JSON.parse(sdp);
    console.log(`[API-OFFER] ✅ SDP parseado correctamente: type=${parsed.type}, sdp length=${parsed.sdp?.length || 0}`);
    
    if (parsed.type !== 'offer') {
      console.warn(`[API-OFFER] ⚠️ Tipo inesperado: ${parsed.type} (esperado 'offer')`);
    }
  } catch (e) {
    console.error(`[API-OFFER] ❌ ERROR: SDP no es JSON válido`);
    console.error(`[API-OFFER] Error:`, e);
    console.error(`[API-OFFER] SDP (primeros 100 chars):`, sdp.substring(0, 100));
    return NextResponse.json({ message: 'Invalid SDP format' }, { status: 400 });
  }
  
  const rec = getOrCreateRoom(roomId);
  rec.offer = sdp;
  
  console.log(`[API-OFFER] ✅ Offer guardada exitosamente en sala ${roomId}`);
  console.log(`[API-OFFER] Sala ahora contiene:`);
  console.log(`  - Offer: ${!!rec.offer}`);
  console.log(`  - Answer: ${!!rec.answer}`);
  console.log(`  - Caller candidates: ${rec.candidates.caller?.length || 0}`);
  console.log(`  - Callee candidates: ${rec.candidates.callee?.length || 0}\n`);
  
  return NextResponse.json({ ok: true });
}
