import { fetchJSON } from './api';

export type MedicoResumen = {
  avatar: string;
  nombre: string;
  apellido?: string;
  email?: string;
  especialidad?: string;
  experiencia?: string;
  educacion?: string;
  telefono?: string;
  estado?: string;
  disponible?: boolean;
  online?: boolean;
  ultimaConexion?: Date;
};

type RawMedico = { 
  avatar?: string | null; 
  nombre: string; 
  apellido?: string; 
  email?: string; 
  especializacion?: string; 
  especialidad?: string; 
  telefono?: string;
  estado?: string;
  // experiencia/educacion pueden venir como string, null, o arrays (de strings o de objetos detallados)
  experiencia?: string | null | Array<string | Record<string, unknown>>;
  educacion?: string | null | Array<string | Record<string, unknown>>;
};

const ALLOWED_EXTS = ['png', 'jpg', 'jpeg', 'webp'] as const;
async function resolverAvatarDeterministaMedico(email?: string): Promise<string | ''> {
  if (!email) return '';
  // Primero intenta la ruta sin extensión servida por el app route
  const base = `/perfiles/medico/${encodeURIComponent(email)}/perfil`;
  try {
    const head = await fetch(base, { method: 'HEAD', cache: 'no-store' });
    if (head.ok) return base;
  } catch {}
  // Fallback: probar variantes estáticas con extensión
  for (const ext of ALLOWED_EXTS) {
    const url = `${base}.${ext}`;
    try {
      const res = await fetch(url, { method: 'HEAD', cache: 'no-store' });
      if (res.ok) return url;
    } catch {}
  }
  return '';
}

export async function getEspecialistas(): Promise<MedicoResumen[]> {
  const medicos = await fetchJSON<RawMedico[]>(`/api/medico`);
  const items = await Promise.all(medicos.map(async (m) => {
    let avatar = '';
    const p = m.avatar || '';
    if (typeof p === 'string' && p.startsWith('/perfiles/')) {
      avatar = p;
    } else {
      avatar = await resolverAvatarDeterministaMedico(m.email) || '';
    }
    if (!avatar) avatar = 'https://randomuser.me/api/portraits/lego/1.jpg';

    // Simular información de conexión (esto debería venir de la API en el futuro)
    const ahora = new Date();
    const horasAleatorias = Math.floor(Math.random() * 48); // 0-48 horas atrás
    const ultimaConexion = new Date(ahora.getTime() - (horasAleatorias * 60 * 60 * 1000));
    const online = horasAleatorias < 1; // Online si se conectó hace menos de 1 hora

    return {
      avatar,
      nombre: m.nombre,
      apellido: m.apellido,
      email: m.email,
      especialidad: m.especializacion || m.especialidad,
      telefono: m.telefono,
      estado: m.estado || 'activo',
      disponible: m.estado === 'activo',
      online,
      ultimaConexion,
      experiencia: ((): string => {
        const v = m.experiencia;
        if (!v) return '';
        if (Array.isArray(v)) {
          // Si son strings
          if (v.every(x => typeof x === 'string')) return v.join(', ');
          // Si son objetos (e.g. { puesto, empresa, inicio, fin, descripcion }) los formateamos
          return v.map(item => {
            if (!item) return '';
            if (typeof item === 'string') return item;
            const parts: string[] = [];
            if (item.puesto) parts.push(String(item.puesto));
            if (item.empresa) parts.push('en ' + String(item.empresa));
            let periodo = '';
            if (item.inicio) periodo += String(item.inicio);
            if (item.fin) periodo += (periodo ? ' - ' : '') + String(item.fin);
            if (periodo) parts.push('(' + periodo + ')');
            if (item.descripcion && !parts.length) return String(item.descripcion);
            return parts.join(' ');
          }).filter(Boolean).join('\n');
        }
        return typeof v === 'string' ? v : '';
      })(),
      educacion: ((): string => {
        const v = m.educacion;
        if (!v) return '';
        if (Array.isArray(v)) {
          if (v.every(x => typeof x === 'string')) return v.join(', ');
          return v.map(item => {
            if (!item) return '';
            if (typeof item === 'string') return item;
            const parts: string[] = [];
            if (item.titulo) parts.push(String(item.titulo));
            if (item.institucion) parts.push('— ' + String(item.institucion));
            let periodo = '';
            if (item.inicio) periodo += String(item.inicio);
            if (item.fin) periodo += (periodo ? ' - ' : '') + String(item.fin);
            if (periodo) parts.push('(' + periodo + ')');
            if (item.descripcion && !parts.length) return String(item.descripcion);
            return parts.join(' ');
          }).filter(Boolean).join('\n');
        }
        return typeof v === 'string' ? v : '';
      })(),
    } as MedicoResumen;
  }));
  return items;
}

// Función para determinar el estado del médico basado en su conexión
export function getMedicoStatus(medico: MedicoResumen): { status: string; color: string; showDot: boolean } {
  if (medico.online) {
    return {
      status: 'Online',
      color: 'bg-green-500',
      showDot: true
    };
  }

  if (!medico.ultimaConexion) {
    return {
      status: 'Desconocido',
      color: 'bg-gray-400',
      showDot: false
    };
  }

  const ahora = new Date();
  const diferenciaMs = ahora.getTime() - medico.ultimaConexion.getTime();
  const diferenciaHoras = diferenciaMs / (1000 * 60 * 60);

  if (diferenciaHoras < 1) {
    return {
      status: 'Reciente',
      color: 'bg-yellow-500',
      showDot: true
    };
  } else {
    const horasRedondeadas = Math.floor(diferenciaHoras);
    return {
      status: `Hace ${horasRedondeadas} hr${horasRedondeadas !== 1 ? 's' : ''}`,
      color: 'bg-gray-500',
      showDot: false
    };
  }
}
