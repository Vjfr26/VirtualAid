import { NextRequest, NextResponse } from 'next/server';

console.log('🔥🔥🔥 [TEST-DYNAMIC ROUTE] Módulo cargado 🔥🔥🔥');

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ testId: string }> }
) {
  const { testId } = await params;
  console.log(`[TEST-DYNAMIC] GET /api/reunion/test-dynamic/${testId}`);
  return NextResponse.json({ method: 'GET', testId });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ testId: string }> }
) {
  const { testId } = await params;
  console.log(`[TEST-DYNAMIC] POST /api/reunion/test-dynamic/${testId}`);
  const body = await req.json().catch(() => ({}));
  console.log('[TEST-DYNAMIC] Body:', body);
  return NextResponse.json({ method: 'POST', testId, received: body });
}
