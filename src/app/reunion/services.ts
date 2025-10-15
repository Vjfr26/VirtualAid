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

// ============================================
// 📡 API ENDPOINTS - Backend Flow
// ============================================

// 2. Crear/Obtener roomId
export const createRoom = () => api<{ roomId: string }>('reunion/create', { method: 'POST' });

// 3. Ver estado inicial de la sala
export const getState = (roomId: string) => api<RoomState>(`reunion/${roomId}/state`);

// 4. Caller publica la oferta (con clientId opcional)
export const postOffer = (roomId: string, sdp: string, clientId?: string) => 
  api<{ ok: true }>(`reunion/${roomId}/offer`, { 
    method: 'POST', 
    body: JSON.stringify({ sdp, clientId }) 
  });

// 4. Caller hace polling de answer
export const getAnswer = (roomId: string) => api<{ answer: string | null }>(`reunion/${roomId}/answer`);

// 5. Callee obtiene la oferta
export const getOffer = (roomId: string) => api<{ offer: string | null }>(`reunion/${roomId}/offer`);

// 5. Callee publica la respuesta
export const postAnswer = (roomId: string, sdp: string) => 
  api<{ ok: true }>(`reunion/${roomId}/answer`, { 
    method: 'POST', 
    body: JSON.stringify({ sdp }) 
  });

// 6. Intercambio de ICE candidates
export const postCandidate = (roomId: string, from: 'caller'|'callee', candidate: RTCIceCandidateInit) =>
  api<{ ok: true }>(`reunion/${roomId}/candidate`, { 
    method: 'POST', 
    body: JSON.stringify({ from, candidate }) 
  });

// 6. Obtener candidatos nuevos con filtro `since` (timestamp ISO)
export const getCandidates = (roomId: string, _for: 'caller'|'callee', since?: string) => {
  const params = since ? `?for=${_for}&since=${encodeURIComponent(since)}` : `?for=${_for}`;
  return api<{ candidates: RTCIceCandidateInit[] }>(`reunion/${roomId}/candidates${params}`);
};

// 7. Mantener la sala viva y respaldar chat (heartbeat)
export type ChatMessage = {
  type: 'text' | 'file';
  content?: string | { name: string; url?: string };
  text?: string; // Para compatibilidad con backend
  sender: string;
  avatar?: string;
  timestamp?: string;
};

export const sendHeartbeat = (roomId: string, messages: ChatMessage[]) =>
  api<{ ok: true }>(`reunion/${roomId}/heartbeat`, { 
    method: 'POST', 
    body: JSON.stringify({ messages }) 
  });

// 8. Resetear negociación de sala (limpiar offer/answer/candidates para reconexión)
export const resetRoom = (roomId: string) =>
  api<{ ok: true; reset: boolean }>(`reunion/${roomId}/reset`, { method: 'POST' });

// 9. Confirmar conexión WebRTC (marca asistencia automática)
export const confirmConnection = (roomId: string) =>
  api<{ ok: true }>(`reunion/${roomId}/confirm-connection`, { method: 'POST' });

// 10. Listar salas activas
export const listRooms = (openOnly = false) => 
  api<{ rooms: RoomInfo[] }>(`reunion/rooms${openOnly ? '?open=true' : ''}`);

// 11. Finalizar chat y guardar historial completo
export const finalizarChat = (roomId: string, messages: ChatMessage[]) =>
  api<{ saved: boolean; path: string }>(`reunion/${roomId}/finalizar`, { 
    method: 'POST', 
    body: JSON.stringify({ messages }) 
  });

// 12. Eliminar sala en cache
export const deleteRoom = (roomId: string) =>
  api<{ ok: true; deleted: boolean }>(`reunion/${roomId}`, { method: 'DELETE' });

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
