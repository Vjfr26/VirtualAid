import { fetchJSON } from './api';
import type { Cita } from './citas';
import type { Receta } from './recetas';

const isBrowser = typeof window !== 'undefined';
const RAW_API_URL = isBrowser ? '' : (process.env.NEXT_PUBLIC_API_URL ?? '');
const API_URL = RAW_API_URL.replace(/\/$/, '');

// Extensiones soportadas para la imagen de perfil determinista
const ALLOWED_EXTS = ['png', 'jpg', 'jpeg', 'webp'] as const;

async function resolverAvatarDeterminista(tipo: 'usuario' | 'medico' | 'admin', id: string): Promise<string | ''> {
  // Probar HEAD contra /perfiles/{tipo}/{id}/perfil.{ext} y retornar la primera que exista
  const base = `/perfiles/${tipo}/${encodeURIComponent(id)}/perfil`;
  for (const ext of ALLOWED_EXTS) {
    const url = `${base}.${ext}`;
    try {
      const res = await fetch(url, { method: 'HEAD', cache: 'no-store' });
      if (res.ok) return url;
    } catch {
      // ignorar y probar siguiente extensión
    }
  }
  return '';
}

export interface Paciente {
  avatar: string; // URL del avatar del paciente
  nombre: string;
  email: string;
  edad: number;
  motivo: string;
  historial?: { nombre: string; url: string }[];
  recetas?: Receta[]; // Agregamos las recetas al interface
}

// Obtener datos completos de un paciente por email
interface PacienteAPIResponse {
  avatar?: string | null;
  nombre?: string;
  apellido?: string;
  email: string;
  edad?: number;
  motivo?: string;
  historial?: { nombre: string; url: string }[];
  recetas?: Receta[]; // Agregamos las recetas a la respuesta de API
}

export async function getPacientePorEmail(email: string): Promise<Partial<Paciente> | null> {
  try {
  const endpoint = API_URL && API_URL.length > 0 ? `${API_URL}/api/usuario/${encodeURIComponent(email)}` : `/api/usuario/${encodeURIComponent(email)}`;
  const data = await fetchJSON<PacienteAPIResponse>(endpoint);
    // Ajusta los campos según la respuesta real de tu API
    const raw = (data.avatar ?? '') as string;
    let avatar = (typeof raw === 'string' && raw.startsWith('/perfiles/')) ? raw : '';
    // Si no viene desde backend, intentar resolver por ruta determinista
    if (!avatar) {
      avatar = await resolverAvatarDeterminista('usuario', email);
    }
    return {
      avatar,
      nombre: data.nombre && data.apellido ? `${data.nombre} ${data.apellido}` : data.nombre || email.split('@')[0],
      email: data.email,
      edad: data.edad,
      motivo: data.motivo || '',
      historial: data.historial || [],
      recetas: data.recetas || [] // Incluimos las recetas en el retorno
    };
  } catch (error) {
    console.error('Error obteniendo paciente:', error);
    return null;
  }
}

// Función para obtener pacientes desde las citas
// Versión asíncrona que consulta la API para cada paciente
export async function extraerPacientes(citas: Cita[]): Promise<Paciente[]> {
  if (citas.length === 0) return [];
  const usuarios = Array.from(new Set(citas.map(c => c.usuario_id)));
  const pacientes = await Promise.all(
    usuarios.map(async usuarioId => {
      const datos = await getPacientePorEmail(usuarioId);
      let avatar = (datos?.avatar && datos.avatar.startsWith('/perfiles/')) ? datos.avatar : '';
      if (!avatar) {
        avatar = await resolverAvatarDeterminista('usuario', usuarioId) || 'https://randomuser.me/api/portraits/lego/1.jpg';
      }
      return {
        avatar,
        nombre: datos?.nombre || usuarioId.split('@')[0] || "Usuario",
        email: usuarioId,
        edad: datos?.edad || Math.floor(Math.random() * 40) + 20,
        motivo: citas.find(c => c.usuario_id === usuarioId)?.motivo || "Consulta",
        historial: datos?.historial || []
      } as Paciente;
    })
  );
  return pacientes;
}

// En una implementación real, esta función obtendría datos reales del backend
export async function getPacientesMedico(email: string): Promise<Paciente[]> {
  try {
    return fetchJSON<Paciente[]>(`${API_URL}/api/medico/${encodeURIComponent(email)}/pacientes`);
  } catch (error) {
    console.error("Error obteniendo pacientes:", error);
    return [];
  }                                                                         
}
