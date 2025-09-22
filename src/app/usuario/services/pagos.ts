import { fetchJSON } from './api';
import type { Cita } from './citas';

export type Pago = {
  id: number;
  cita_id: number | string;
  monto: number;
  estado: string;
  metodo?: string;
  fecha_pago?: string | null;
  // Opcionales: backend puede retornar identificadores de sala tras el pago
  tokenSala?: string;
  idRoom?: string;
};

export async function getPagosDeUsuario(email: string): Promise<({ pago: Pago; cita: Cita | null })[]> {
  const [pagos, citas] = await Promise.all([
    fetchJSON<Pago[]>(`/api/pagos`),
    fetchJSON<Cita[]>(`/api/cita/${encodeURIComponent(email)}`),
  ]);
  const citasById = new Map(citas.map((c) => [String(c.id), c]));
  return pagos
    .filter((p) => citasById.has(String(p.cita_id)))
    .map((p) => ({ pago: p, cita: citasById.get(String(p.cita_id)) || null }));
}

/**
 * Marca un pago como pagado en backend cuando el monto es 0.
 * Intenta varias rutas comunes por compatibilidad.
 */
export async function marcarPagoGratis(pagoId: number | string): Promise<{ status: string } | undefined> {
  // Intento 1: POST /api/pagos/:id/marcar-pagado
  try {
    return await fetchJSON<{ status: string }>(`/api/pagos/${encodeURIComponent(String(pagoId))}/marcar-pagado`, { method: 'POST' });
  } catch {
    // Intento 2: POST /api/pagos/:id/mark-paid
    try {
      return await fetchJSON<{ status: string }>(`/api/pagos/${encodeURIComponent(String(pagoId))}/mark-paid`, { method: 'POST' });
    } catch {
      // Intento 3: PUT /api/pagos/:id con body estado: Pagado (fallback)
      try {
        return await fetchJSON<{ status: string }>(`/api/pagos/${encodeURIComponent(String(pagoId))}`, {
          method: 'PUT',
          body: JSON.stringify({ estado: 'Pagado' }),
        });
      } catch (e3) {
        // Re-lanzar último error para manejo en UI
        throw e3;
      }
    }
  }
}

/**
 * Intenta descargar el recibo/factura del pago. Usa las nuevas rutas PDF que no entran en conflicto con el backend.
 */
export async function descargarRecibo(pagoId: number | string): Promise<Blob> {
  try {
    const res = await fetch(`/pdf/recibo?id=${encodeURIComponent(String(pagoId))}`, { 
      headers: { Accept: 'application/pdf' } 
    });
    if (res.ok) {
      const blob = await res.blob();
      if (blob.size > 0) return blob;
    }
    throw new Error(`HTTP ${res.status}`);
  } catch (e) {
    throw e instanceof Error ? e : new Error('No se pudo descargar el recibo');
  }
}
