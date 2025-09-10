import { NextRequest, NextResponse } from 'next/server';

const CLIENT_ID = process.env.PAYPAL_CLIENT_ID || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '';
const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || '';
const PAYPAL_BASE = process.env.PAYPAL_API_BASE || 'https://api-m.sandbox.paypal.com';

async function getAccessToken() {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error('Faltan credenciales');
  }
  const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store'
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error('Error token PayPal: ' + res.status + ' ' + text);
  }
  const json = await res.json();
  return json.access_token as string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { orderID } = body;
    if (!orderID) return NextResponse.json({ error: 'Falta orderID' }, { status: 400 });

    const accessToken = await getAccessToken();

    const capRes = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${orderID}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const text = await capRes.text();
    let data: unknown;
    try { data = JSON.parse(text); } catch { data = text; }

    if (!capRes.ok) {
      return NextResponse.json({ error: 'Error capturando orden PayPal', details: data }, { status: capRes.status });
    }

    // Extraer estado
    let status: string | undefined;
    if (data && typeof data === 'object' && 'status' in data) {
      const record = data as Record<string, unknown>;
      if (typeof record.status === 'string') status = record.status;
    }

    return NextResponse.json({ status: status || 'COMPLETED', raw: data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error desconocido';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
