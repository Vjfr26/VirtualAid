import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CLIENT_ID = process.env.PAYPAL_CLIENT_ID || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '';
const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || '';
const PAYPAL_BASE = process.env.PAYPAL_API_BASE || 'https://api-m.sandbox.paypal.com';

// Interfaces
interface PayPalCaptureResponse {
  status: string;
  id: string;
  purchase_units?: Array<{
    amount: {
      value: string;
      currency_code: string;
    };
    payments?: {
      captures?: Array<{
        id: string;
        status: string;
        amount: {
          value: string;
          currency_code: string;
        };
      }>;
    };
  }>;
  payer?: {
    email_address?: string;
    name?: {
      given_name?: string;
      surname?: string;
    };
  };
}

async function getAccessToken() {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error('Credenciales PayPal faltantes (define PAYPAL_CLIENT_ID y PAYPAL_CLIENT_SECRET en .env.local para sandbox)');
  }
  
  const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: { 
      Authorization: `Basic ${auth}`, 
      'Content-Type': 'application/x-www-form-urlencoded' 
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store'
  });
  
  if (!res.ok) {
    throw new Error(`Error obteniendo token PayPal: ${res.status}`);
  }
  
  const json = await res.json();
  return json.access_token as string;
}

// Función para guardar pago en base de datos (simulada)
async function guardarPagoEnBaseDatos(paypalData: PayPalCaptureResponse): Promise<string> {
  // TODO: Implementar conexión real a base de datos
  // Por ahora generamos un ID único
  const pagoId = `PAGO_${Date.now()}_${randomUUID().substring(0, 8)}`;
  
  console.log('💾 Guardando pago en BD:', {
    pagoId,
    paypalOrderId: paypalData.id,
    status: paypalData.status,
    amount: paypalData.purchase_units?.[0]?.amount,
    payer: paypalData.payer?.email_address,
  });
  
  // Aquí iría la lógica real de base de datos:
  // const result = await db.pagos.create({
  //   id: pagoId,
  //   paypal_order_id: paypalData.id,
  //   status: paypalData.status,
  //   amount: paypalData.purchase_units?.[0]?.amount?.value,
  //   currency: paypalData.purchase_units?.[0]?.amount?.currency_code,
  //   payer_email: paypalData.payer?.email_address,
  //   created_at: new Date(),
  // });
  
  return pagoId;
}

// Función para generar token de sala
function generarTokenSala(): string {
  return `SALA_${Date.now()}_${randomUUID()}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
  const { orderID, pagoId: pagoIdInput } = body as Record<string, unknown>;
    
    if (!orderID || typeof orderID !== 'string') {
      return NextResponse.json({ error: 'Falta orderID' }, { status: 400 });
    }

    console.log('🔄 Capturando orden PayPal:', orderID);
    
    // 1. Obtener token de acceso
    const accessToken = await getAccessToken();
    
    // 2. Capturar orden en PayPal
    const capRes = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${orderID}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      }
    });
    
    const text = await capRes.text();
    let paypalData: PayPalCaptureResponse;
    
    try {
      paypalData = JSON.parse(text);
    } catch {
      throw new Error('Respuesta inválida de PayPal');
    }
    
    if (!capRes.ok) {
      console.error('❌ Error capturando en PayPal:', paypalData);
      return NextResponse.json({ 
        error: 'Error capturando orden PayPal', 
        details: paypalData 
      }, { status: capRes.status });
    }

    console.log('✅ Orden capturada en PayPal:', {
      orderId: orderID,
      status: paypalData.status,
      captureId: paypalData.purchase_units?.[0]?.payments?.captures?.[0]?.id,
    });

    // 3. Verificar que el pago esté completado
    if (paypalData.status !== 'COMPLETED') {
      return NextResponse.json({
        status: paypalData.status,
        pagoId: undefined,
        tokenSala: undefined,
        orderID,
        message: 'Pago no completado'
      });
    }

    // 4. Guardar pago en base de datos (si el cliente ya manda un pagoId lo reutilizamos para correlación, sino generamos uno)
    let pagoId: string;
    if (pagoIdInput && typeof pagoIdInput === 'string') {
      pagoId = pagoIdInput;
      console.log('💾 Reutilizando pagoId proporcionado por el cliente:', pagoId);
    } else if (pagoIdInput && typeof pagoIdInput === 'number') {
      pagoId = String(pagoIdInput);
      console.log('💾 Reutilizando pagoId numérico del cliente:', pagoId);
    } else {
      pagoId = await guardarPagoEnBaseDatos(paypalData);
    }
    
    // 5. Generar token de sala para reunión
    const tokenSala = generarTokenSala();
    
    console.log('🎉 Pago procesado completamente:', {
      pagoId,
      tokenSala,
      orderID,
      status: paypalData.status,
    });

    // 6. Retornar respuesta completa
    return NextResponse.json({
      status: paypalData.status,
      pagoId,
      tokenSala,
      orderID,
      amount: paypalData.purchase_units?.[0]?.amount,
      payer: paypalData.payer,
    });

  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error desconocido';
    console.error('❌ Error en capture-order:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
