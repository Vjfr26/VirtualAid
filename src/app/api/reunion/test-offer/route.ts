import { NextRequest, NextResponse } from 'next/server';

console.log('🔥🔥🔥 [TEST-OFFER ROUTE] Módulo cargado 🔥🔥🔥');

export async function GET() {
  console.log('[TEST-OFFER] GET /api/reunion/test-offer');
  return NextResponse.json({ method: 'GET', endpoint: 'test-offer' });
}

export async function POST(req: NextRequest) {
  console.log('[TEST-OFFER] POST /api/reunion/test-offer');
  const body = await req.json().catch(() => ({}));
  console.log('[TEST-OFFER] Body:', body);
  return NextResponse.json({ method: 'POST', endpoint: 'test-offer', received: body });
}
