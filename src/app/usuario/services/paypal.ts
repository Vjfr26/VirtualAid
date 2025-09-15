export interface CreateOrderResponse { orderID: string }
export interface CaptureOrderResponse { status: string; pagoId?: number; tokenSala?: string }

interface ApiError extends Error { status?: number }

function buildError(message: string, status?: number): ApiError {
  const err = new Error(message) as ApiError;
  err.status = status;
  return err;
}

export async function createOrder(pagoId: number | string, userEmail?: string): Promise<CreateOrderResponse> {
  interface Variant { url: string; body: Record<string, unknown>; note: string; }
  // 1. Intento directo a nueva ruta local (servidor Next) que crea orden contra PayPal
  try {
    const directRes = await fetch('/api/paypal/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pagoId, userEmail })
    });
    const dj = await directRes.json().catch(() => ({}));
    if (directRes.ok && dj && typeof dj.orderID === 'string') {
      if (process.env.NODE_ENV !== 'production') console.info('[PayPal][createOrder] usando ruta local Next /api/paypal/create-order');
      return { orderID: dj.orderID };
    }
    if (!directRes.ok && directRes.status !== 404) {
      const msg = dj?.error || 'Error ruta local PayPal';
      throw buildError(`Fallo ruta local /api/paypal/create-order: ${msg}`, directRes.status);
    }
  } catch (err) {
    if (err instanceof Error && (err as ApiError).status && (err as ApiError).status !== 404) {
      throw err; // error configuracion (ej: credenciales) -> no seguir variantes
    }
    if (process.env.NODE_ENV !== 'production') console.warn('[PayPal][createOrder] ruta local no usable, probando variantes backend');
  }
  const prefixEnv = (process.env.NEXT_PUBLIC_PAYPAL_API_PREFIX || '').replace(/\/$/, '');
  const customPrefix = prefixEnv || '/api/paypal';
  const possiblePrefixes = Array.from(new Set([
    customPrefix,
    '/api/v1/paypal',
    '/api/payments/paypal',
    '/api/payment/paypal',
    '/api/pagos/paypal',
    '/api/paypal'
  ]));
  const backendBase = (process.env.NEXT_PUBLIC_BACKEND_BASE || '').replace(/\/$/, ''); // opcional
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const pid = pagoId; // alias
  const variants: Variant[] = [];
  // Construir variantes dinámicamente
  for (const p of possiblePrefixes) {
    variants.push({ url: `${p}/create-order`, note: `POST ${p}/create-order`, body: { pagoId: pid, userEmail } });
    variants.push({ url: `${p}/create-order`, note: `POST ${p}/create-order snake_case`, body: { pago_id: pid, userEmail } });
    variants.push({ url: `${p}/orders/create`, note: `POST ${p}/orders/create`, body: { pagoId: pid, userEmail } });
  }
  // Ruta anidada por pago
  variants.push({ url: `/api/pagos/${encodeURIComponent(String(pid))}/paypal/create-order`, note: 'ruta anidada pagos/:id', body: { userEmail } });
  variants.push({ url: `${customPrefix}/create-order`, note: 'fallback id genérico', body: { id: pid, userEmail } });
  // Si hay backend base explícito, duplicar variantes con dominio completo (para saltar rewrite)
  if (backendBase) {
    const extra: Variant[] = [];
    for (const v of variants) {
      extra.push({ ...v, url: backendBase + v.url });
    }
    variants.push(...extra);
  }
  const attempts: string[] = [];
  for (const v of variants) {
    try {
      const res = await fetch(v.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(userEmail ? { 'X-User-Email': userEmail } : {}), ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify(v.body)
      });
      let parsed: unknown = null;
      const text = await res.text();
      try { parsed = text ? JSON.parse(text) : null; } catch { parsed = text; }
      if (!res.ok) {
        const snippet = typeof text === 'string' ? text.slice(0,140) : '';
        attempts.push(`${v.url} (${v.note}) -> ${res.status} ${res.statusText} body:${snippet}`);
        // 404 continuar probando; otros errores (403/409) también seguimos para capturar variante correcta
        continue;
      }
      const obj = (parsed && typeof parsed === 'object') ? parsed as Record<string, unknown> : {};
      const orderID = (typeof obj.orderID === 'string' && obj.orderID) || (typeof obj.id === 'string' && obj.id);
      if (orderID) {
        if (process.env.NODE_ENV !== 'production') {
          console.info('[PayPal][createOrder] OK variante', v.note, 'orderID=', orderID);
        }
        return { orderID: String(orderID) };
      }
      attempts.push(`${v.url} (${v.note}) -> sin orderID en respuesta (${JSON.stringify(obj).slice(0,120)})`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'error desconocido';
      attempts.push(`${v.url} (${v.note}) -> excepción ${msg}`);
    }
  }
  console.error('[PayPal][createOrder] fallaron todas las variantes:', attempts);
  throw buildError('Error creando orden (HTTP 404) - Verifica ruta backend. Intentos: ' + attempts.join(' | '), 404);
}

export async function captureOrder(orderID: string, pagoIdOrEmail?: number | string, maybeEmail?: string): Promise<CaptureOrderResponse> {
  // Soportar retrocompatibilidad: antes la firma era (orderID, userEmail?)
  let pagoId: number | string | undefined;
  let userEmail: string | undefined;
  if (typeof pagoIdOrEmail === 'number') {
    pagoId = pagoIdOrEmail;
    userEmail = maybeEmail;
  } else if (typeof pagoIdOrEmail === 'string') {
    // Heurística: si parece email (contiene '@' y un punto) lo tratamos como userEmail legado
    if (pagoIdOrEmail.includes('@') && !maybeEmail) {
      userEmail = pagoIdOrEmail;
    } else {
      pagoId = pagoIdOrEmail; // puede ser string id
      userEmail = maybeEmail;
    }
  }

  // Intento directo a ruta local Next primero
  try {
    const directRes = await fetch('/api/paypal/capture-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderID, pagoId, userEmail })
    });
    console.log('directRes', directRes);
    const dj = await directRes.json().catch(() => ({}));
    console.log('dj', dj);
    if (directRes.ok && dj && typeof dj.status === 'string') {
      if (process.env.NODE_ENV !== 'production') console.info('[PayPal][captureOrder] usando ruta local Next /api/paypal/capture-order');
      const result: CaptureOrderResponse = { status: dj.status, pagoId: (typeof dj.pagoId === 'number' || typeof dj.pagoId === 'string' ? Number(dj.pagoId) || undefined : undefined), tokenSala: (typeof dj.tokenSala === 'string' ? dj.tokenSala : undefined) };
      // Si el estado es COMPLETED intentamos marcar el pago como pagado
      if (result.status.toUpperCase() === 'COMPLETED' && result.pagoId != null) {
        try {
          const putRes = await fetch(`/api/pagos/${encodeURIComponent(String(result.pagoId))}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: 'pagado', metodo: 'paypal' })
          });
            if (!putRes.ok) {
              if (process.env.NODE_ENV !== 'production') console.warn('[PayPal][captureOrder] PUT estado pagado falló', putRes.status, await (async () => { try { return (await putRes.text()).slice(0,120); } catch { return 'no-body'; } })());
            } else if (process.env.NODE_ENV !== 'production') {
              console.info('[PayPal][captureOrder] Pago actualizado a pagado (PUT local)');
            }
        } catch (e) {
          if (process.env.NODE_ENV !== 'production') console.warn('[PayPal][captureOrder] Error intentando PUT pago pagado:', e);
        }
      }
      return result;
    }
    if (!directRes.ok && directRes.status !== 404) {
      const msg = dj?.error || 'Error ruta local PayPal';
      throw buildError(`Fallo ruta local /api/paypal/capture-order: ${msg}`, directRes.status);
    }
  } catch (err) {
    if (err instanceof Error && (err as ApiError).status && (err as ApiError).status !== 404) {
      throw err;
    }
    if (process.env.NODE_ENV !== 'production') console.warn('[PayPal][captureOrder] ruta local no usable, probando variantes backend');
  }
  const prefixEnv = (process.env.NEXT_PUBLIC_PAYPAL_API_PREFIX || '').replace(/\/$/, '');
  const customPrefix = prefixEnv || '/api/paypal';
  const possiblePrefixes = Array.from(new Set([
    customPrefix,
    '/api/v1/paypal',
    '/api/payments/paypal',
    '/api/payment/paypal',
    '/api/pagos/paypal',
    '/api/paypal'
  ]));
  const backendBase = (process.env.NEXT_PUBLIC_BACKEND_BASE || '').replace(/\/$/, '');
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const variants: { url: string; body: Record<string, unknown>; note: string }[] = [];
  for (const p of possiblePrefixes) {
    variants.push({ url: `${p}/capture-order`, body: { orderID, pagoId, userEmail }, note: `POST ${p}/capture-order` });
    variants.push({ url: `${p}/capture-order`, body: { orderId: orderID, pagoId, userEmail }, note: `POST ${p}/capture-order orderId` });
    variants.push({ url: `${p}/orders/capture`, body: { orderID, pagoId, userEmail }, note: `POST ${p}/orders/capture` });
    variants.push({ url: `${p}/capture/${encodeURIComponent(orderID)}`, body: { pagoId, userEmail }, note: `POST ${p}/capture/:id` });
  }
  if (backendBase) {
    const extra: { url: string; body: Record<string, unknown>; note: string }[] = [];
    for (const v of variants) extra.push({ ...v, url: backendBase + v.url });
    variants.push(...extra);
  }
  const attempts: string[] = [];
  for (const v of variants) {
    try {
      const res = await fetch(v.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(userEmail ? { 'X-User-Email': userEmail } : {}), ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify(v.body)
      });
      const text = await res.text();
      let parsed: unknown = null; try { parsed = text ? JSON.parse(text) : null; } catch { parsed = text; }
      if (!res.ok) {
        attempts.push(`${v.url} (${v.note}) -> ${res.status}`);
        continue;
      }
      if (parsed && typeof parsed === 'object' && 'status' in parsed) {
        const d = parsed as { status: string; pagoId?: number | string; tokenSala?: string };
        if (process.env.NODE_ENV !== 'production') console.info('[PayPal][captureOrder] OK variante', v.note, d.status);
        const result: CaptureOrderResponse = { status: d.status, pagoId: typeof d.pagoId === 'string' ? Number(d.pagoId) || undefined : d.pagoId, tokenSala: d.tokenSala };
        if (result.status.toUpperCase() === 'COMPLETED' && result.pagoId != null) {
          try {
            const putRes = await fetch(`/api/pagos/${encodeURIComponent(String(result.pagoId))}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ estado: 'pagado' })
            });
            if (!putRes.ok) {
              if (process.env.NODE_ENV !== 'production') console.warn('[PayPal][captureOrder] PUT estado pagado falló (variante)', putRes.status);
            } else if (process.env.NODE_ENV !== 'production') {
              console.info('[PayPal][captureOrder] Pago actualizado a pagado (PUT variante)');
            }
          } catch (e) {
            if (process.env.NODE_ENV !== 'production') console.warn('[PayPal][captureOrder] Error PUT pago pagado (variante):', e);
          }
        }
        return result;
      }
      attempts.push(`${v.url} (${v.note}) -> sin status válido (${text.slice(0,120)})`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'error';
      attempts.push(`${v.url} (${v.note}) -> excepción ${msg}`);
    }
  }
  console.error('[PayPal][captureOrder] fallaron variantes:', attempts);
  throw buildError('Error capturando orden - Intentos: ' + attempts.join(' | '));
}
