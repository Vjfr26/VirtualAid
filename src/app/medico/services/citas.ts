import { fetchJSON } from './api';

const isBrowser = typeof window !== 'undefined';
const RAW_API_URL = isBrowser ? '' : (process.env.NEXT_PUBLIC_API_URL ?? '');
const API_URL = RAW_API_URL.replace(/\/$/, '');

export interface Cita {
  id: number;
  usuario_id: string;
  medico_id: string;
  fecha: string;
  hora: string;
  estado: string;
  motivo?: string;
  notas?: string;
  asistio?: boolean;
  cancelada?: boolean; // true si la cita fue cancelada
  archivo?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FilterParams {
  fecha?: string;
  estado?: string;
}

export async function getCitas(email: string, params?: FilterParams): Promise<Cita[]> {
  let url = `${API_URL}/api/medico/${encodeURIComponent(email)}/citas`;
  
  if (params) {
    const queryParams = new URLSearchParams();
    if (params.fecha) queryParams.append('fecha', params.fecha);
    if (params.estado) queryParams.append('estado', params.estado);
    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }
  }
  
  return fetchJSON<Cita[]>(url);
}

export async function actualizarEstadoCita(citaId: number, estado: string): Promise<Cita> {
  return fetchJSON<Cita>(`${API_URL}/api/cita/${citaId}/estado`, {
    method: 'PUT',
    body: JSON.stringify({ estado })
  });
}

export async function agregarNotaCita(citaId: number, notas: string): Promise<Cita> {
  return fetchJSON<Cita>(`${API_URL}/api/cita/${citaId}/notas`, {
    method: 'PUT',
    body: JSON.stringify({ notas })
  });
}

/**
 * Interfaz para estadísticas de citas canceladas
 */
export interface CitasCanceladasStats {
  total_canceladas_7d: number; // Total de citas canceladas en los últimos 7 días
  total_canceladas_periodo_anterior: number; // Total del período anterior (para comparación)
  citas_canceladas: Cita[]; // Lista de citas canceladas (opcional)
}

/**
 * Obtiene estadísticas de citas canceladas de los últimos 7 días
 * @param email Email del médico
 * @returns Estadísticas de citas canceladas
 */
export async function getCitasCanceladasStats(email: string): Promise<CitasCanceladasStats> {
  try {
    const response = await fetch(
      `/api/medico/citas-canceladas-stats?medico_email=${encodeURIComponent(email)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Error ${response.status} al obtener estadísticas de cancelaciones`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error al obtener estadísticas de citas canceladas:', error);
    // Si falla, devolver valores en 0
    return {
      total_canceladas_7d: 0,
      total_canceladas_periodo_anterior: 0,
      citas_canceladas: [],
    };
  }
}
