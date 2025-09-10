import { fetchJSON } from './api';

const isBrowser = typeof window !== 'undefined';
const RAW_API_URL = isBrowser ? '' : (process.env.NEXT_PUBLIC_API_URL ?? '');
const API_URL = RAW_API_URL.replace(/\/$/, '');

export interface Especialidad {
  id: number;
  nombre: string;
  descripcion?: string;
  tarifa_base: number;
  created_at?: string;
  updated_at?: string;
}

export async function getEspecialidades(): Promise<Especialidad[]> {
  return fetchJSON<Especialidad[]>(`${API_URL}/api/especialidades`);
}
