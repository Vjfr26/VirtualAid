import { NextResponse } from 'next/server';

console.log('🔥 TEST ROUTE LOADED 🔥');

export async function GET() {
  console.log('[TEST] GET /api/test');
  return NextResponse.json({ test: 'working' });
}

export async function POST() {
  console.log('[TEST] POST /api/test');
  return NextResponse.json({ test: 'post working' });
}
