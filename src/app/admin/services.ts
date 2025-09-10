export type AdminMedico = Partial<{
  nombre: string;
  apellido: string;
  email: string;
  especializacion: string;
  tlf: string;
  estado: string;
  avatar: string;
  id: string | number;
  created_at: string;
}> & Record<string, unknown>;

export type AdminUsuario = Partial<{
  nombre: string;
  apellido: string;
  email: string;
  tlf: string;
  avatar: string;
  pais: string;
  dni: string;
  created_at: string;
}> & Record<string, unknown>;

export type AdminCita = Partial<{
  id: number;
  medico_id: string; // email del médico
  usuario_id: string; // email del usuario
  fecha: string; // YYYY-MM-DD
  hora: string;  // HH:mm:ss
  archivo?: string;
  asistio?: boolean;
}> & Record<string, unknown>;

const api = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const res = await fetch(`/api/${path}` , {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json();
};

export const listMedicos = () => api<AdminMedico[]>(`medico`);
export const listUsuarios = () => api<AdminUsuario[]>(`usuario`);
export const listCitas = () => api<AdminCita[]>(`cita`); // si existe índice
export const listCitasPorMedico = (email: string) => api<AdminCita[]>(`medico/${encodeURIComponent(email)}/citas`);

export const fullName = (p: { nombre?: string; apellido?: string }) =>
  `${p.nombre ?? ''} ${p.apellido ?? ''}`.trim() || 'Sin nombre';

export const avatarUrl = (name?: string, avatar?: string) =>
  (avatar && avatar.startsWith('/perfiles/')) ? avatar : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || 'User')}`;
