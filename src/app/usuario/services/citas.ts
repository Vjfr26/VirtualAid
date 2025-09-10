import { fetchJSON } from './api';

export type Cita = {
  id: number | string;
  medico_id: string;
  usuario_id: string;
  fecha: string;
  hora: string;
  archivo?: string | null;
};

export async function getCitasDeUsuario(email: string): Promise<Cita[]> {
  return fetchJSON<Cita[]>(`/api/cita/${encodeURIComponent(email)}`);
}

export async function crearCita(payload: {
  medico_id: string;
  usuario_id: string;
  fecha: string; // YYYY-MM-DD
  hora: string;  // HH:mm
}): Promise<Cita> {
  return fetchJSON<Cita>(`/api/cita/crear`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// Listar todas las citas de un médico (se filtran por día en el cliente)
export async function getCitasDeMedico(email: string): Promise<Cita[]> {
  return fetchJSON<Cita[]>(`/api/medico/${encodeURIComponent(email)}/citas`);
}

// Activar/Desactivar recordatorio por correo de una cita
export async function setRecordatorioCita(id: number | string, enabled: boolean, email: string) {
  return fetchJSON<{ message: string }>(`/api/cita/${encodeURIComponent(String(id))}/recordatorio`, {
    method: 'POST',
    body: JSON.stringify({ enabled, email }),
  });
}
