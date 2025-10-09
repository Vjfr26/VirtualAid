import { fetchJSON } from './api';
import type { Cita } from './citas';
import type { Receta } from './recetas';
import { resolveUsuarioAvatarUrls } from '../../usuario/services/perfil';

const isBrowser = typeof window !== 'undefined';
const RAW_API_URL = isBrowser ? '' : (process.env.NEXT_PUBLIC_API_URL ?? '');
const API_URL = RAW_API_URL.replace(/\/$/, '');

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
  avatar_url?: string | null;
  avatar_path?: string | null;
  ruta?: string | null;
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
    const avatarCandidates: Array<string | null | undefined> = [
      data.avatar_url,  // Priorizar avatar_url (URL completa del backend)
      data.avatar_path, // Luego avatar_path (ruta relativa)
      data.avatar,      // Campo estándar
      data.ruta,        // Alternativa
    ];
    const rawAvatar = avatarCandidates.find((candidate): candidate is string => typeof candidate === 'string' && candidate.length > 0) ?? null;
    const avatarInfo = resolveUsuarioAvatarUrls(email, rawAvatar);
    const avatar = avatarInfo.displayUrl ?? '';
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
      const avatar = (datos?.avatar && datos.avatar.length > 0)
        ? datos.avatar
        : 'https://randomuser.me/api/portraits/lego/1.jpg';
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
