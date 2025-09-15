import { fetchJSON } from './api';

const avatarCache: Record<string, string | null> = {};
const AVATAR_FALLBACK = 'https://randomuser.me/api/portraits/lego/1.jpg';

async function resolverAvatarDeterministaUsuario(email: string): Promise<string | null> {
  if (email in avatarCache) return avatarCache[email];
  const base = `/perfiles/usuario/${encodeURIComponent(email)}/perfil`;
  try {
    const head = await fetch(base, { method: 'HEAD', cache: 'no-store' });
    if (head.ok) {
      avatarCache[email] = base;
      return base;
    }
  } catch {}
  // No más iteraciones sobre extensiones para evitar spam de 404 visibles.
  avatarCache[email] = null;
  return null;
}

export type UsuarioPerfil = {
  nombre: string;
  apellido?: string;
  email: string;
  tlf?: string | null;
  avatar?: string | null; // URL absoluta o relativa; preferimos /perfiles/...
};

export async function getUsuarioPerfil(email: string): Promise<UsuarioPerfil> {
  type RawUsuarioPerfil = {
    nombre?: string;
    apellido?: string;
    email: string;
    tlf?: string | null;
    telefono?: string | null;
    avatar?: string | null;
  };
  const raw = await fetchJSON<RawUsuarioPerfil>(`/api/usuario/${encodeURIComponent(email)}`);
  // Normalizar avatar con la nueva lógica (solo avatar del back; no usamos avatar_path)
  const rawAvatar: string | null = raw?.avatar ?? null;
  let avatar: string | null = null;
  if (typeof rawAvatar === 'string' && rawAvatar.length > 0) {
    if (rawAvatar.startsWith('/perfiles/')) {
      avatar = rawAvatar;
    } else if (rawAvatar.startsWith('/storage/') || rawAvatar.startsWith('http')) {
      avatar = rawAvatar;
    } else {
      avatar = `/storage/${rawAvatar}`;
    }
  } else {
    // Intentar resolver determinísticamente si no viene del backend
    const resolved = await resolverAvatarDeterministaUsuario(email);
    if (resolved) avatar = resolved; else avatar = AVATAR_FALLBACK;
  }
  return {
    nombre: raw?.nombre,
    apellido: raw?.apellido,
    email: raw?.email,
    tlf: raw?.tlf ?? raw?.telefono ?? null,
    avatar,
  } as UsuarioPerfil;
}

export async function updateUsuarioPerfil(email: string, data: Partial<UsuarioPerfil>) {
  const body = { nombre: data.nombre, tlf: data.tlf };
  return fetchJSON<{ message: string }>(`/api/usuario/${encodeURIComponent(email)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function changeUsuarioPassword(email: string, actual: string, nueva: string) {
  return fetchJSON<{ message: string }>(`/api/usuario/${encodeURIComponent(email)}/cambiar-contrasena`, {
    method: 'PUT',
    body: JSON.stringify({ actual, nueva }),
  });
}

// Persistir la nueva ruta del avatar en el backend para consistencia entre dispositivos
export async function updateUsuarioAvatar(email: string, avatarUrl: string) {
  // Solo guardamos el campo avatar en backend.
  return fetchJSON<{ message: string }>(`/api/usuario/${encodeURIComponent(email)}`, {
    method: 'PUT',
    body: JSON.stringify({ avatar: avatarUrl }),
  });
}
