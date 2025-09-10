import { fetchJSON } from './api';
import dbService from '@/lib/database';
import type { Receta as DBReceta, NuevaRecetaData as DBNuevaRecetaData } from '@/lib/database';

const isBrowser = typeof window !== 'undefined';
const RAW_API_URL = isBrowser ? '' : (process.env.NEXT_PUBLIC_API_URL ?? '');
const API_URL = RAW_API_URL.replace(/\/$/, '');

// Mantenemos la interfaz existente para compatibilidad
export interface Receta {
  id: string;
  medicamento: string;
  fecha: string;
  fechaCreacion: string;
  dosis: string;
  frecuencia: string;
  duracion: string;
  cantidad: string;
  conComidas: string;
  indicaciones: string;
  estado: 'Activa' | 'Completada' | 'Cancelada' | 'Suspendida';
  medico: string;
  medicoEmail: string;
}

export interface NuevaRecetaData {
  medicamento: string;
  dosis: string;
  frecuencia: string;
  duracion: string;
  cantidad: string;
  conComidas: string;
  indicaciones: string;
  medico?: string;
  medicoEmail?: string;
}

// Función para convertir de formato DB a formato frontend
function convertirRecetaDBaFrontend(recetaDB: DBReceta): Receta {
  return {
    id: recetaDB.codigo_receta || recetaDB.id?.toString() || '',
    medicamento: recetaDB.medicamento,
    fecha: recetaDB.fecha_prescripcion || recetaDB.fecha_creacion?.split('T')[0] || '',
    fechaCreacion: recetaDB.fecha_creacion || new Date().toISOString(),
    dosis: recetaDB.dosis,
    frecuencia: recetaDB.frecuencia || '',
    duracion: recetaDB.duracion,
    cantidad: recetaDB.cantidad || '',
    conComidas: recetaDB.con_comidas || '',
    indicaciones: recetaDB.indicaciones || '',
    estado: recetaDB.estado || 'Activa',
    medico: recetaDB.medico || 'Dr. Médico',
    medicoEmail: recetaDB.medico_email || ''
  };
}

// Función para convertir de formato frontend a formato DB
function convertirRecetaFrontendaDB(recetaFrontend: NuevaRecetaData): DBNuevaRecetaData {
  return {
    medicamento: recetaFrontend.medicamento,
    dosis: recetaFrontend.dosis,
    frecuencia: recetaFrontend.frecuencia,
    duracion: recetaFrontend.duracion,
    cantidad: recetaFrontend.cantidad,
    con_comidas: recetaFrontend.conComidas,
    indicaciones: recetaFrontend.indicaciones,
    medico: recetaFrontend.medico,
    medico_email: recetaFrontend.medicoEmail
  };
}

// Obtener todas las recetas de un paciente
export async function getRecetasPaciente(emailPaciente: string): Promise<Receta[]> {
  try {
    // Primero intentar con las rutas locales de Next.js (nuevas)
    try {
      const localRecetas = await fetchJSON<Receta[]>(`/api/recetas/paciente/${encodeURIComponent(emailPaciente)}`);
      if (localRecetas && localRecetas.length >= 0) {
        return localRecetas;
      }
    } catch (localError) {
      console.log('Rutas nuevas no disponibles localmente, intentando con API remota...');
    }

    // Luego intentar con la API remota (nuevas rutas)
    if (API_URL && API_URL.length > 0) {
      try {
        const recetasRemota = await fetchJSON<any[]>(`${API_URL}/api/recetas/paciente/${encodeURIComponent(emailPaciente)}`);
        if (recetasRemota && recetasRemota.length >= 0) {
          // Si son recetas de la nueva DB, convertir formato
          if (recetasRemota[0] && 'codigo_receta' in recetasRemota[0]) {
            return recetasRemota.map(convertirRecetaDBaFrontend);
          }
          return recetasRemota;
        }
      } catch (remoteError) {
        console.log('API remota con nuevas rutas no disponible, intentando con rutas anteriores...');
      }
    }

    // Fallback al sistema anterior (JSON mock)
    const recetas = await fetchJSON<Receta[]>(`/api/usuario/${encodeURIComponent(emailPaciente)}/recetas`);
    return recetas;
  } catch (error) {
    console.error('Error obteniendo recetas del paciente:', error);
    return [];
  }
}

// Crear una nueva receta para un paciente
export async function crearReceta(emailPaciente: string, recetaData: NuevaRecetaData): Promise<{ success: boolean; receta?: Receta; error?: string }> {
  try {
    // Obtener información del médico actual
    const medicoInfo = getInfoMedicoActual();
    const emailMedico = recetaData.medicoEmail || medicoInfo.medicoEmail;
    
    // Preparar datos para la API
    const dataParaAPI = {
      paciente_email: emailPaciente,
      medico_email: emailMedico,
      medicamento: recetaData.medicamento,
      dosis: recetaData.dosis,
      frecuencia: recetaData.frecuencia,
      duracion: recetaData.duracion,
      cantidad: recetaData.cantidad,
      con_comidas: recetaData.conComidas,
      indicaciones: recetaData.indicaciones,
      medico: recetaData.medico || medicoInfo.medico
    };

    // Primero intentar con las rutas locales de Next.js (nuevas)
    try {
      const localResponse = await fetchJSON<{ success: boolean; receta: any; message: string }>(`/api/recetas/paciente/${encodeURIComponent(emailPaciente)}`, {
        method: 'POST',
        body: JSON.stringify(dataParaAPI)
      });
      
      if (localResponse.success && localResponse.receta) {
        let recetaFinal: Receta;
        if ('codigo_receta' in localResponse.receta) {
          recetaFinal = convertirRecetaDBaFrontend(localResponse.receta);
        } else {
          recetaFinal = localResponse.receta;
        }
        
        return { 
          success: true, 
          receta: recetaFinal
        };
      }
    } catch (localError) {
      console.log('Rutas nuevas no disponibles localmente, intentando con API remota...');
    }

    // Luego intentar con la API remota (nuevas rutas)
    if (API_URL && API_URL.length > 0) {
      try {
        const remoteResponse = await fetchJSON<{ success: boolean; receta: any; message: string }>(`${API_URL}/api/recetas`, {
          method: 'POST',
          body: JSON.stringify(dataParaAPI)
        });
        
        if (remoteResponse.success && remoteResponse.receta) {
          let recetaFinal: Receta;
          if ('codigo_receta' in remoteResponse.receta) {
            recetaFinal = convertirRecetaDBaFrontend(remoteResponse.receta);
          } else {
            recetaFinal = remoteResponse.receta;
          }
          
          return { 
            success: true, 
            receta: recetaFinal
          };
        }
      } catch (remoteError) {
        console.log('API remota con nuevas rutas no disponible, intentando con rutas anteriores...');
      }
    }

    // Fallback al sistema anterior (JSON mock)
    const fallbackResponse = await fetchJSON<{ success: boolean; receta: Receta; message: string }>(`/api/usuario/${encodeURIComponent(emailPaciente)}/recetas`, {
      method: 'POST',
      body: JSON.stringify({
        ...recetaData,
        medico: recetaData.medico || medicoInfo.medico,
        medicoEmail: emailMedico
      })
    });
    
    return { 
      success: fallbackResponse.success, 
      receta: fallbackResponse.receta 
    };
  } catch (error) {
    console.error('Error creando receta:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    };
  }
}

// Actualizar estado de una receta (completar, cancelar, etc.)
export async function actualizarEstadoReceta(emailPaciente: string, recetaId: string, nuevoEstado: Receta['estado']): Promise<{ success: boolean; error?: string }> {
  try {
    // Intentar con la nueva base de datos primero
    const idNumerico = parseInt(recetaId.replace(/\D/g, ''));
    if (!isNaN(idNumerico)) {
      const resultado = await dbService.cambiarEstadoReceta(idNumerico, nuevoEstado);
      if (resultado.success) {
        return resultado;
      }
    }

    // Fallback al sistema anterior
    const endpoint = API_URL && API_URL.length > 0 
      ? `${API_URL}/api/usuario/${encodeURIComponent(emailPaciente)}/recetas/${recetaId}` 
      : `/api/usuario/${encodeURIComponent(emailPaciente)}/recetas/${recetaId}`;
    
    await fetchJSON(endpoint, {
      method: 'PATCH',
      body: JSON.stringify({ estado: nuevoEstado })
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error actualizando estado de receta:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    };
  }
}

// Función auxiliar para obtener información del médico actual (desde sesión)
export function getInfoMedicoActual() {
  if (typeof window === 'undefined') return { medico: 'Dr. Médico', medicoEmail: 'medico@virtualaid.com' };
  
  try {
    const email = localStorage.getItem('medicoEmail');
    const nombre = localStorage.getItem('medicoNombre') || 'Dr. Médico';
    
    return {
      medico: nombre,
      medicoEmail: email || 'medico@virtualaid.com'
    };
  } catch {
    return { medico: 'Dr. Médico', medicoEmail: 'medico@virtualaid.com' };
  }
}
