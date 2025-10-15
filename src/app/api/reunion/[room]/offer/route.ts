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
  
  // 🔒 PROTECCIÓN CONTRA SOBRESCRITURA: First-come-first-served
  if (rec.offer && !rec.answer) {
    // Ya hay una offer sin answer - verificar si es del mismo cliente
    try {
      const existingOffer = JSON.parse(rec.offer);
      const existingClientId = existingOffer.clientId;
      
      if (existingClientId && clientId && existingClientId !== clientId) {
        // Hay offer de OTRO cliente - rechazar esta offer
        console.warn(`[API-OFFER] ⚠️ RECHAZADO: Ya hay offer de ${existingClientId}`);
        console.warn(`[API-OFFER] Nuevo cliente ${clientId} debe ser CALLEE`);
        return NextResponse.json({ 
          message: 'Offer already exists from another client',
          existingClientId,
          shouldBeCallee: true 
        }, { status: 409 }); // 409 Conflict
      }
      
      // Es del mismo cliente (reintento) - permitir sobrescritura
      console.log(`[API-OFFER] ℹ️ Sobrescribiendo offer del mismo cliente ${clientId}`);
    } catch {
      // Offer antigua sin clientId - permitir sobrescritura
      console.log(`[API-OFFER] ℹ️ Sobrescribiendo offer antigua sin clientId`);
    }
  }
  
  rec.offer = sdp;
  
  console.log(`[API-OFFER] ✅ Offer guardada exitosamente en sala ${roomId}`);
  console.log(`[API-OFFER] Sala ahora contiene:`);
  console.log(`  - Offer: ${!!rec.offer}`);
  console.log(`  - Answer: ${!!rec.answer}`);
  console.log(`  - Caller candidates: ${rec.candidates.caller?.length || 0}`);
  console.log(`  - Callee candidates: ${rec.candidates.callee?.length || 0}\n`);
  
  return NextResponse.json({ ok: true });
}
