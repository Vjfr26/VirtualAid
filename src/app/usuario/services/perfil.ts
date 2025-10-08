import { fetchJSON } from './api';

const avatarCache: Record<string, string | null> = {};
const AVATAR_FALLBACK = 'https://randomuser.me/api/portraits/lego/1.jpg';

const BACKEND_HOSTS = new Set([
  '13.60.223.37',
  'api.virtualaid.us',
  'api.virtualaid.es',
  'api.virtualaid.mx',
  'virtualaid.us',
]);

export const stripQuery = (value: string) => value.split('?')[0];

export const ensureStorageStylePath = (path: string): { withPrefix: string; relative: string } | null => {
  const clean = stripQuery(path).replace(/\\/g, '/');
  if (!clean) return null;
  if (clean.startsWith('/perfiles/')) {
    return { withPrefix: clean, relative: clean.replace(/^\/+/, '') };
  }

  const withoutLeading = clean.replace(/^\/+/, '');
  if (withoutLeading.startsWith('perfiles/')) {
    return { withPrefix: `/${withoutLeading}`, relative: withoutLeading };
  }

  if (clean.startsWith('/storage/')) {
    const relative = clean.replace(/^\/+?storage\/?/, '');
    return { withPrefix: clean, relative };
  }

  if (withoutLeading.startsWith('storage/')) {
    const relative = withoutLeading.replace(/^storage\/?/, '');
    return { withPrefix: `/storage/${relative}`, relative };
  }

  if (clean.startsWith('storage/')) {
    const relative = clean.replace(/^storage\/?/, '');
    return { withPrefix: `/storage/${relative}`, relative };
  }

  if (clean.startsWith('perfiles/')) {
    return { withPrefix: `/${clean}`, relative: clean };
  }

  return null;
};

export const analyzeRawAvatarValue = (raw: string | null | undefined) => {
  if (!raw) {
    return { storage: null, absolute: null, original: null } as const;
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    return { storage: null, absolute: null, original: null } as const;
  }

  const directStorage = ensureStorageStylePath(trimmed);
  if (directStorage) {
    return { storage: directStorage, absolute: null, original: trimmed } as const;
  }

  let parsed: URL | null = null;
  try {
    parsed = new URL(trimmed, 'http://localhost');
  } catch {
    parsed = null;
  }

  if (parsed) {
    if (BACKEND_HOSTS.has(parsed.hostname) || parsed.pathname.startsWith('/storage/')) {
      const combinedPath = `${parsed.pathname}${parsed.search || ''}`;
      const normalized = ensureStorageStylePath(combinedPath);
      if (normalized) {
        return { storage: normalized, absolute: null, original: trimmed } as const;
      }
    }
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return { storage: null, absolute: parsed.toString(), original: trimmed } as const;
    }
  }

  const inferred = ensureStorageStylePath(trimmed);
  if (inferred) {
    return { storage: inferred, absolute: null, original: trimmed } as const;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return { storage: null, absolute: trimmed, original: trimmed } as const;
  }

  return { storage: null, absolute: trimmed, original: trimmed } as const;
};

export const buildUsuarioDownloadUrl = (_email: string, storage: { withPrefix: string; relative: string } | null): string | null => {
  if (!storage) return null;
  return storage.withPrefix;
};

export const buildMedicoDownloadUrl = (_email: string, storage: { withPrefix: string; relative: string } | null): string | null => {
  if (!storage) return null;
  return storage.withPrefix;
};

export type AvatarUrlInfo = {
  displayUrl: string | null;
  storagePath: string | null;
  original: string | null;
};

export const resolveUsuarioAvatarUrls = (email: string, raw: string | null | undefined): AvatarUrlInfo => {
  const analysis = analyzeRawAvatarValue(raw);
  const displayFromStorage = buildUsuarioDownloadUrl(email, analysis.storage);
  const displayUrl = displayFromStorage ?? analysis.absolute ?? null;
  const storagePath = analysis.storage?.relative ?? null;
  return {
    displayUrl,
    storagePath,
    original: analysis.original,
  };
};

export const resolveMedicoAvatarUrls = (email: string, raw: string | null | undefined): AvatarUrlInfo => {
  const analysis = analyzeRawAvatarValue(raw);
  const displayFromStorage = buildMedicoDownloadUrl(email, analysis.storage);
  const displayUrl = displayFromStorage ?? analysis.absolute ?? null;
  const storagePath = analysis.storage?.relative ?? null;
  return {
    displayUrl,
    storagePath,
    original: analysis.original,
  };
};

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
    avatar_url?: string | null;
    avatar_path?: string | null;
    ruta?: string | null;
  };
  const raw = await fetchJSON<RawUsuarioPerfil>(`/api/usuario/${encodeURIComponent(email)}`);
  // Normalizar avatar con la nueva lógica (solo avatar del back; no usamos avatar_path)
  const avatarCandidates: Array<string | null | undefined> = [
    raw?.avatar_url,
    raw?.avatar,
    raw?.avatar_path,
    raw?.ruta,
  ];
  const rawAvatar = avatarCandidates.find((candidate): candidate is string => typeof candidate === 'string' && candidate.length > 0) ?? null;
  let avatar: string | null = null;
  const avatarInfo = resolveUsuarioAvatarUrls(email, rawAvatar);
  if (avatarInfo.displayUrl) {
    avatar = avatarInfo.displayUrl;
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
export async function updateUsuarioAvatar(email: string, avatarPath: string) {
  // Solo guardamos el campo avatar en backend.
  return fetchJSON<{ message: string }>(`/api/usuario/${encodeURIComponent(email)}`, {
    method: 'PUT',
    body: JSON.stringify({ avatar: avatarPath }),
  });
}
