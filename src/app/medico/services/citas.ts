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
