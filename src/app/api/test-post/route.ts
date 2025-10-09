import { NextResponse } from 'next/server';

console.log('🔥🔥🔥 [TEST-POST ROUTE] Módulo cargado 🔥🔥🔥');

export async function GET() {
  console.log('[TEST-POST] GET /api/test-post');
  return NextResponse.json({ method: 'GET', works: true });
}

export async function POST() {
  console.log('[TEST-POST] POST /api/test-post');
  return NextResponse.json({ method: 'POST', works: true });
}
