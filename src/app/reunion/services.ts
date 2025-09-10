export type RoomState = { roomId: string; hasOffer: boolean; hasAnswer: boolean };
export type RoomInfo = { roomId: string; createdAt: string; hasOffer: boolean; hasAnswer: boolean };

const api = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const res = await fetch(`/api/${path}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json();
};

export const createRoom = () => api<{ roomId: string }>('reunion/create', { method: 'POST' });
export const listRooms = (openOnly = false) => api<{ rooms: RoomInfo[] }>(`reunion/rooms${openOnly ? '?open=true' : ''}`);
export const getState = (roomId: string) => api<RoomState>(`reunion/${roomId}/state`);
export const postOffer = (roomId: string, sdp: string) => api<{ ok: true }>(`reunion/${roomId}/offer`, { method: 'POST', body: JSON.stringify({ sdp }) });
export const getOffer = (roomId: string) => api<{ offer: string | null }>(`reunion/${roomId}/offer`);
export const postAnswer = (roomId: string, sdp: string) => api<{ ok: true }>(`reunion/${roomId}/answer`, { method: 'POST', body: JSON.stringify({ sdp }) });
export const getAnswer = (roomId: string) => api<{ answer: string | null }>(`reunion/${roomId}/answer`);
export const postCandidate = (roomId: string, from: 'caller'|'callee', candidate: RTCIceCandidateInit) =>
  api<{ ok: true }>(`reunion/${roomId}/candidate`, { method: 'POST', body: JSON.stringify({ from, candidate }) });
export const getCandidates = (roomId: string, _for: 'caller'|'callee') => api<{ candidates: RTCIceCandidateInit[] }>(`reunion/${roomId}/candidates?for=${_for}`);
export type ChatMessage = {
  type: 'text' | 'file';
  content: string | { name: string; url?: string };
  sender: string;
  avatar: string;
};
export const finalizarChat = (roomId: string, messages: ChatMessage[]) =>
  api<{ saved: boolean; path: string }>(`reunion/${roomId}/finalizar`, { method: 'POST', body: JSON.stringify({ messages }) });

// Utilidad para construir el enlace de una sala
export const roomLink = (roomId: string) => {
  if (typeof window === 'undefined') return `?room=${roomId}`;
  const url = new URL(window.location.href);
  url.searchParams.set('room', roomId);
  return url.toString();
};

// Construye enlace incluyendo el nombre si se proporciona
export const roomLinkWithName = (roomId: string, name?: string) => {
  const base = roomLink(roomId);
  try {
    const url = new URL(base);
    if (name && name.trim()) url.searchParams.set('name', name.trim());
    return url.toString();
  } catch { return base; }
};

// Backend lookups
export type BasicProfile = Partial<{ nombre: string; nombres: string; apellido: string; apellidos: string; name: string; displayName: string; username: string; first_name: string; last_name: string; email: string; id: number | string; }> & Record<string, unknown>;
export const getMedico = (email: string) => api<BasicProfile>(`medico/${encodeURIComponent(email)}`);
export const getUsuario = (id: string | number) => api<BasicProfile>(`usuario/${id}`);

export const extractDisplayName = (obj: BasicProfile): string => {
  if (!obj || typeof obj !== 'object') return '';
  const keys = Object.keys(obj).reduce<Record<string,string>>((acc, k) => { const v = obj[k]; if (typeof v === 'string') acc[k.toLowerCase()] = v; return acc; }, {});
  const first = keys['nombre'] || keys['nombres'] || keys['first_name'] || keys['firstname'] || '';
  const last = keys['apellido'] || keys['apellidos'] || keys['last_name'] || keys['lastname'] || '';
  const combined = `${first || ''} ${last || ''}`.trim();
  if (combined) return combined;
  // otros posibles campos
  return keys['name'] || keys['displayname'] || keys['username'] || '';
};
