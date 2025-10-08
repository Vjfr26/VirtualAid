import { fetchJSON } from './api';
import { resolveMedicoAvatarUrls } from '../../usuario/services/perfil';

// En navegador usamos rutas relativas (Next rewrites) para evitar problemas QUIC/CORS.
const isBrowser = typeof window !== 'undefined';
const RAW_API_URL = isBrowser ? '' : (process.env.NEXT_PUBLIC_API_URL ?? '');
const API_URL = RAW_API_URL.replace(/\/$/, '');

const ALLOWED_EXTS = ['png', 'jpg', 'jpeg', 'webp'] as const;
// Claves relevantes que aparecen en distintas respuestas al subir un avatar.
const DIRECT_AVATAR_KEYS = ['avatar_url', 'url', 'avatar', 'avatar_path', 'ruta', 'path', 'location', 'perfil', 'archivo', 'file'] as const;
const NESTED_PAYLOAD_KEYS = ['data', 'result', 'resultado', 'response'] as const;

const parseAvatarResponseUrl = (payload: unknown): string | null => {
  const pickString = (value: unknown): string | null => {
    if (typeof value === 'string' && value.length > 0) return value;
    if (Array.isArray(value)) {
      const first = value.find((item) => typeof item === 'string' && item.length > 0);
      if (typeof first === 'string') return first;
    }
    return null;
  };

  if (!payload) return null;
  if (typeof payload === 'string') return payload;
  if (Array.isArray(payload)) {
    const first = payload.find((item) => typeof item === 'string' && item.length > 0);
    if (typeof first === 'string') return first;
  }

  if (typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    for (const key of DIRECT_AVATAR_KEYS) {
      const candidate = pickString(record[key]);
      if (candidate) return candidate;
    }

    for (const key of NESTED_PAYLOAD_KEYS) {
      const nestedCandidate = pickString(record[key]);
      if (nestedCandidate) return nestedCandidate;
      const nestedValue = record[key];
      if (nestedValue && typeof nestedValue === 'object') {
        const nestedRecord = nestedValue as Record<string, unknown>;
        for (const nestedKey of DIRECT_AVATAR_KEYS) {
          const candidate = pickString(nestedRecord[nestedKey]);
          if (candidate) return candidate;
        }
      }
    }
  }

  return null;
};

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
  const fd = new FormData();
  fd.append('archivo', file);
  fd.append('uso', 'avatar');
  const response = await fetch(`/api/medico/${encodeURIComponent(email)}/archivo`, {
    method: 'POST',
    body: fd,
    credentials: 'include',
    cache: 'no-store',
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const msg = (data as { message?: string })?.message || `Error ${response.status}`;
    throw new Error(msg);
  }
  const rawUrl = parseAvatarResponseUrl(data);
  let avatarInfo = resolveMedicoAvatarUrls(email, rawUrl);
  let avatarUrl = avatarInfo.displayUrl || '';
  if (!avatarUrl) {
    try {
      const refreshed = await getMedicoPerfil(email);
      avatarInfo = resolveMedicoAvatarUrls(email, refreshed?.avatar ?? null);
      avatarUrl = avatarInfo.displayUrl || '';
    } catch (refetchError) {
      console.warn('No se pudo refrescar perfil tras subir avatar:', refetchError);
    }
  }
  if (!avatarUrl) {
    console.warn('Respuesta de avatar sin URL reconocible:', data);
    throw new Error('El avatar se guardó, pero no recibimos la URL. Refresca la página para confirmarlo.');
  }
  const message = (data as { message?: string })?.message || 'ok';
  return { message, avatar_path: avatarUrl };
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
