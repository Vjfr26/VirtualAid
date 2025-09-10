import { fetchJSON } from './api';

export type Reunion = {
  id: number | string;
  medico_id: string;
  fecha: string;
  hora: string;
  archivo?: string | null;
  asistio: boolean;
};

export async function getReunionesDeUsuario(email: string): Promise<Reunion[]> {
  return fetchJSON<Reunion[]>(`/api/usuario/${encodeURIComponent(email)}/reuniones`);
}
