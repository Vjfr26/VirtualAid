// Utilidades de fetch para el dashboard de médico
// Nota: Next.js reescribe /api/* hacia Laravel (backend). Asegúrate que los rewrites estén activos.

// Obtiene el objeto guardado en localStorage por el login
export function getSession() {
  if (typeof window === 'undefined') return null;
  try {
    const email = localStorage.getItem('medicoEmail');
    const token = localStorage.getItem('medicoToken');
    if (!email) return null;
    return { tipo: 'medico', email, token };
  } catch {
    return null;
  }
}

export async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const session = getSession();
  const headers: Record<string, string> = { 
    'Content-Type': 'application/json', 
    'Accept': 'application/json',
    ...(init?.headers as Record<string, string> || {})
  };
  
  // Añadir token de autorización si existe
  if (session?.token) {
    headers['Authorization'] = `Bearer ${session.token}`;
  }

  const res = await fetch(url, {
    headers,
    ...init,
  });
  
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const data = await res.json();
    if (!res.ok) {
      const msg = (data && (data.message || data.error)) || `Error ${res.status}`;
      throw new Error(msg);
    }
    return data as T;
  }
  
  const text = await res.text();
  if (!res.ok) {
    throw new Error(text || `Error ${res.status}`);
  }
  
  // Intentar parsear si es JSON válido en texto; si no, devolver como unknown
  try {
    return JSON.parse(text) as T;
  } catch {
    return (text as unknown) as T;
  }
}
