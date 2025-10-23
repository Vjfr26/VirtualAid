import { fetchJSON } from './api';

export interface Pago {
  id: number;
  cita_id: number;
  monto: number;
  estado: 'pendiente' | 'completado' | 'pagado' | 'confirmado' | 'cancelado';
  metodo: string;
  fecha_pago: string;
  created_at: string;
  updated_at: string;
  cita?: {
    id: number;
    medico_id: string;
    usuario_id: string;
    fecha: string;
    hora: string;
  };
}

export interface PagosResponse {
  pagos: Pago[];
  total_ingresos: number;
  cantidad_pagos: number;
}

export interface SaldoMedicoResponse {
  saldo: number;
  total_citas_pagadas: number;
  ultimo_pago?: {
    fecha: string;
    monto: number;
  };
}

/**
 * Obtiene los pagos completados de un médico
 */
export async function getPagosMedico(medicoId: string): Promise<PagosResponse> {
  try {
    // Temporalmente devolvemos datos de prueba hasta que el backend esté funcionando
    const mockPagos: Pago[] = [
      {
        id: 1,
        cita_id: 1,
        monto: 150.00,
        estado: 'completado',
        metodo: 'tarjeta',
        fecha_pago: '2025-08-20',
        created_at: '2025-08-20 10:00:00',
        updated_at: '2025-08-20 10:00:00',
        cita: {
          id: 1,
          medico_id: medicoId,
          usuario_id: 'paciente1@email.com',
          fecha: '2025-08-20',
          hora: '10:00'
        }
      },
      {
        id: 2,
        cita_id: 2,
        monto: 200.00,
        estado: 'pagado',
        metodo: 'efectivo',
        fecha_pago: '2025-08-22',
        created_at: '2025-08-22 14:00:00',
        updated_at: '2025-08-22 14:00:00',
        cita: {
          id: 2,
          medico_id: medicoId,
          usuario_id: 'paciente2@email.com',
          fecha: '2025-08-22',
          hora: '14:00'
        }
      },
      {
        id: 3,
        cita_id: 3,
        monto: 175.00,
        estado: 'confirmado',
        metodo: 'transferencia',
        fecha_pago: '2025-08-25',
        created_at: '2025-08-25 09:00:00',
        updated_at: '2025-08-25 09:00:00',
        cita: {
          id: 3,
          medico_id: medicoId,
          usuario_id: 'paciente3@email.com',
          fecha: '2025-08-25',
          hora: '09:00'
        }
      }
    ];

    const totalIngresos = mockPagos.reduce((total, pago) => total + pago.monto, 0);

    // Simular una pequeña demora de red
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      pagos: mockPagos,
      total_ingresos: totalIngresos,
      cantidad_pagos: mockPagos.length
    };

    // Código real para cuando el backend funcione:
    // const data = await fetchJSON<PagosResponse>(`/api/medico/${medicoId}/pagos`);
    // return data;
  } catch (error) {
    console.error('Error al obtener pagos del médico:', error);
    throw error;
  }
}

/**
 * Formatea el monto como currency
 */
export function formatearMonto(monto: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(monto);
}

/**
 * Calcula ingresos por período
 */
export function calcularIngresosPorPeriodo(
  pagos: Pago[], 
  periodo: 'mes' | 'trimestre' | 'año' = 'mes'
): number {
  const ahora = new Date();
  let fechaInicio: Date;

  switch (periodo) {
    case 'mes':
      fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
      break;
    case 'trimestre':
      const mesActual = ahora.getMonth();
      const inicioTrimestre = Math.floor(mesActual / 3) * 3;
      fechaInicio = new Date(ahora.getFullYear(), inicioTrimestre, 1);
      break;
    case 'año':
      fechaInicio = new Date(ahora.getFullYear(), 0, 1);
      break;
  }

  return pagos
    .filter(pago => {
      const fechaPago = new Date(pago.fecha_pago);
      return fechaPago >= fechaInicio && fechaPago <= ahora;
    })
    .reduce((total, pago) => total + pago.monto, 0);
}

/**
 * Obtiene el saldo actual del médico desde el backend
 * El saldo es la suma de los montos de todas las citas pagadas
 */
export async function getSaldoMedico(medicoEmail: string): Promise<SaldoMedicoResponse> {
  try {
    // Temporalmente devolvemos datos de prueba hasta que el backend esté funcionando
    // El backend debe implementar: GET /api/medico/{email}/saldo
    
    // Simular una pequeña demora de red
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Calcular el saldo basándonos en los pagos mock
    const mockPagos = await getPagosMedico(medicoEmail);
    const saldo = mockPagos.total_ingresos;
    
    return {
      saldo: saldo,
      total_citas_pagadas: mockPagos.cantidad_pagos,
      ultimo_pago: mockPagos.pagos.length > 0 ? {
        fecha: mockPagos.pagos[mockPagos.pagos.length - 1].fecha_pago,
        monto: mockPagos.pagos[mockPagos.pagos.length - 1].monto
      } : undefined
    };

    // Código real para cuando el backend funcione:
    /*
    const response = await fetch(`/api/medico/saldo?medico_email=${encodeURIComponent(medicoEmail)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include',
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Error ${response.status} al obtener el saldo`);
    }

    const data = await response.json();
    return data;
    */
  } catch (error) {
    console.error('Error al obtener saldo del médico:', error);
    // Si falla, devolver saldo en 0
    return {
      saldo: 0,
      total_citas_pagadas: 0,
    };
  }
}
