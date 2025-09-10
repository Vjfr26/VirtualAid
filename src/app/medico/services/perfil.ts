import { fetchJSON } from './api';

// En navegador usamos rutas relativas (Next rewrites) para evitar problemas QUIC/CORS.
const isBrowser = typeof window !== 'undefined';
const RAW_API_URL = isBrowser ? '' : (process.env.NEXT_PUBLIC_API_URL ?? '');
const API_URL = RAW_API_URL.replace(/\/$/, '');

const ALLOWED_EXTS = ['png', 'jpg', 'jpeg', 'webp'] as const;
export async function resolverAvatarDeterministaMedico(email: string): Promise<string | ''> {
  const base = `/perfiles/medico/${encodeURIComponent(email)}/perfil`;
  // Primero intenta la ruta sin extensión
  try {
    const head = await fetch(base, { method: 'HEAD', cache: 'no-store' });
    if (head.ok) return base;
  } catch {}
  // Fallback a extensiones
  for (const ext of ALLOWED_EXTS) {
    const url = `${base}.${ext}`;
    try {
      const res = await fetch(url, { method: 'HEAD', cache: 'no-store' });
      if (res.ok) return url;
    } catch {}
  }
  return '';
}

export interface Medico {
  email: string;
  nombre: string;
  apellido: string;
  especializacion: number;
  tlf?: string;
  estado: string;
  biografia?: string;
  experiencia?: Experiencia[];
  educacion?: Educacion[];
  avatar?: string;
  email_verified_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Experiencia {
  puesto: string;
  empresa: string;
  inicio: string;
  fin?: string;
  descripcion?: string;
}

export interface Educacion {
  institucion: string;
  titulo: string;
  inicio: string;
  fin?: string;
  descripcion?: string;
}

export interface UpdatePerfilData {
  nombre?: string;
  apellido?: string;
  biografia?: string;
}

export async function getMedicoPerfil(email: string): Promise<Medico> {
  return fetchJSON<Medico>(`${API_URL}/api/medico/${encodeURIComponent(email)}?incluir=especialidad`);
}

export async function actualizarMedicoPerfil(email: string, data: UpdatePerfilData): Promise<Medico> {
  // Solo datos JSON (sin avatar). El avatar se actualiza con actualizarMedicoAvatar.
  return fetchJSON<Medico>(`${API_URL}/api/medico/${encodeURIComponent(email)}/perfil`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

export async function actualizarMedicoAvatar(email: string, file: File): Promise<{ message: string; avatar_path: string }> {
  // Usamos el mismo endpoint interno que usuario: guarda en /public/perfiles/medico/{email}/
  const fd = new FormData();
  fd.append('archivo', file);
  fd.append('tipo', 'medico');
  fd.append('id', email);
  const res = await fetch(`/api/perfil/upload`, { method: 'POST', body: fd });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.message || `Error ${res.status}`;
    throw new Error(msg);
  }
  // Devolvemos la URL final del avatar en /perfiles/...
  return { message: 'ok', avatar_path: data.url };
}

// Persistir en backend la nueva ruta del avatar (campo avatar)
export async function updateMedicoAvatar(email: string, avatarUrl: string): Promise<{ message: string }>{
  return fetchJSON<{ message: string }>(`${API_URL}/api/medico/${encodeURIComponent(email)}/perfil`, {
    method: 'PUT',
    body: JSON.stringify({ avatar: avatarUrl }),
  });
}

export async function cambiarContrasena(email: string, actualPassword: string, nuevaPassword: string): Promise<{ message: string }> {
  return fetchJSON<{ message: string }>(`${API_URL}/api/medico/${encodeURIComponent(email)}/cambiar-contrasena`, {
    method: 'PUT',
    body: JSON.stringify({
      actual: actualPassword,
      nueva: nuevaPassword
    })
  });
}
