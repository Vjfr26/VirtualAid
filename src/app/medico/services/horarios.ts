import { fetchJSON } from './api';

const isBrowser = typeof window !== 'undefined';
const RAW_API_URL = isBrowser ? '' : (process.env.NEXT_PUBLIC_API_URL ?? '');
const API_URL = RAW_API_URL.replace(/\/$/, '');

export interface Horario {
  id?: number;
  medico_email: string;
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  created_at?: string;
  updated_at?: string;
}

export async function getHorarios(email: string): Promise<Horario[]> {
  return fetchJSON<Horario[]>(`${API_URL}/api/medico/${encodeURIComponent(email)}/horarios`);
}

export async function agregarHorario(email: string, horario: Omit<Horario, 'id' | 'medico_email'>): Promise<Horario> {
  return fetchJSON<Horario>(`${API_URL}/api/medico/${encodeURIComponent(email)}/horarios`, {
    method: 'POST',
    body: JSON.stringify(horario)
  });
}

export async function actualizarHorario(email: string, horarioId: number, datos: Partial<Horario>): Promise<Horario> {
  return fetchJSON<Horario>(`${API_URL}/api/medico/${encodeURIComponent(email)}/horarios/${horarioId}`, {
    method: 'PUT',
    body: JSON.stringify(datos)
  });
}

export async function eliminarHorario(email: string, horarioId: number): Promise<{ message: string }> {
  return fetchJSON<{ message: string }>(`${API_URL}/api/medico/${encodeURIComponent(email)}/horarios/${horarioId}`, {
    method: 'DELETE'
  });
}
