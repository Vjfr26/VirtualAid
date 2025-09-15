import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

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

// Simulación de guardado (idéntica a la ruta api/paypal para consistencia)
async function guardarPagoSimulado(orderID: string, status: string) {
  const id = `PAGO_${Date.now()}_${randomUUID().slice(0,8)}`;
  console.log('[capture-order][alt] 💾 Guardando pago simulado', { id, orderID, status });
  return id;
}

function generarTokenSala() {
  return `SALA_${Date.now()}_${randomUUID()}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { orderID, pagoId: pagoIdInput } = body as { orderID?: string; pagoId?: string | number };
    console.log('[capture-order][alt] POST body ->', { orderID, pagoId: pagoIdInput });
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

    // Log PayPal response for debugging (raw response may include buyer/payer info)
    try {
      console.log('[capture-order] PayPal capture response for orderID', orderID, '->', typeof data === 'string' ? data.slice(0, 1000) : data);
    } catch {
      // swallowing logging errors to avoid breaking response
    }

    if (!capRes.ok) {
      return NextResponse.json({ error: 'Error capturando orden PayPal', details: data }, { status: capRes.status });
    }

    // Extraer estado
    let status: string | undefined;
    if (data && typeof data === 'object' && 'status' in data) {
      const record = data as Record<string, unknown>;
      if (typeof record.status === 'string') status = record.status;
    }

    const finalStatus = status || 'COMPLETED';
    let pagoIdFinal: string | number | undefined = pagoIdInput;
    if (!pagoIdFinal) {
      pagoIdFinal = await guardarPagoSimulado(orderID, finalStatus);
    }
    let tokenSala: string | undefined;
    if (finalStatus === 'COMPLETED') {
      tokenSala = generarTokenSala();
    }
    const resp = { status: finalStatus, raw: data, pagoId: pagoIdFinal, tokenSala };
    console.log('[capture-order][alt] Responding ->', { orderID, pagoId: resp.pagoId, status: resp.status, tokenSala });
    return NextResponse.json(resp);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error desconocido';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
