import { NextRequest, NextResponse } from 'next/server';

// Usa variables de entorno privadas (definir en .env.local) PAYPAL_CLIENT_ID y PAYPAL_CLIENT_SECRET
const CLIENT_ID = process.env.PAYPAL_CLIENT_ID || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '';
const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || '';
const PAYPAL_BASE = process.env.PAYPAL_API_BASE || 'https://api-m.sandbox.paypal.com';

async function getAccessToken() {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error('Faltan credenciales PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET');
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
    throw new Error('Error obteniendo token PayPal: ' + res.status + ' ' + text);
  }
  const json = await res.json();
  return json.access_token as string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { monto = '10.00', currency = process.env.NEXT_PUBLIC_PAYPAL_CURRENCY || 'EUR', description = 'Pago' } = body || {};

    const accessToken = await getAccessToken();

    const orderRes = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: { currency_code: currency, value: monto },
            description,
          },
        ],
      }),
    });

    const text = await orderRes.text();
  let data: unknown;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }

    if (!orderRes.ok) {
      return NextResponse.json({ error: 'Error creando orden PayPal', details: data }, { status: orderRes.status });
    }

    let orderID: string | undefined;
    if (data && typeof data === 'object' && 'id' in data) {
      orderID = String((data as Record<string, unknown>).id);
    }
    if (!orderID) {
      return NextResponse.json({ error: 'Respuesta sin id de orden', details: data }, { status: 502 });
    }
    return NextResponse.json({ orderID });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error desconocido';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
