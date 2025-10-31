import { fetchJSON } from './api';

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
function convertirRecetaDBaFrontend(recetaDB: any): Receta {
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
function convertirRecetaFrontendaDB(recetaFrontend: NuevaRecetaData): any {
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
    // Usar la nueva ruta: GET /api/recetas/{paciente_email}
    const response = await fetchJSON<Receta[]>(`/api/recetas/${encodeURIComponent(emailPaciente)}`, {
      method: 'GET'
    });

    // Si la respuesta es un array, devolverlo directamente
    if (Array.isArray(response)) {
      return response;
    }

    // Si viene en formato de objeto con propiedad recetas
    if (response && typeof response === 'object' && 'recetas' in response) {
      return (response as any).recetas || [];
    }

    return [];
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

    // Usar la nueva ruta: POST /api/recetas
    const response = await fetchJSON<{ success: boolean; receta: any; message: string }>(`/api/recetas`, {
      method: 'POST',
      body: JSON.stringify(dataParaAPI)
    });

    if (response.success && response.receta) {
      let recetaFinal: Receta;
      if ('codigo_receta' in response.receta) {
        recetaFinal = convertirRecetaDBaFrontend(response.receta);
      } else {
        recetaFinal = response.receta;
      }

      return {
        success: true,
        receta: recetaFinal
      };
    }

    return {
      success: false,
      error: response.message || 'Error al crear la receta'
    };
  } catch (error) {
    console.error('Error creando receta:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}// Actualizar estado de una receta (completar, cancelar, etc.)
export async function actualizarEstadoReceta(emailPaciente: string, recetaId: string, nuevoEstado: Receta['estado']): Promise<{ success: boolean; error?: string }> {
  try {
    // Usar la nueva ruta: PUT /api/recetas/{recetaId}
    await fetchJSON(`/api/recetas/${encodeURIComponent(recetaId)}`, {
      method: 'PUT',
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

// Obtener una receta específica por ID
export async function getRecetaPorId(recetaId: string): Promise<Receta | null> {
  try {
    // Usar la nueva ruta: GET /api/recetas/{recetaId}
    const response = await fetchJSON<Receta>(`/api/recetas/${encodeURIComponent(recetaId)}`, {
      method: 'GET'
    });

    return response;
  } catch (error) {
    console.error('Error obteniendo receta por ID:', error);
    return null;
  }
}

// Obtener todas las recetas de un médico
export async function getRecetasMedico(emailMedico: string): Promise<Receta[]> {
  try {
    // Usar la nueva ruta: GET /api/recetas/{medico_email}
    const response = await fetchJSON<Receta[]>(`/api/recetas/${encodeURIComponent(emailMedico)}`, {
      method: 'GET'
    });

    // Si la respuesta es un array, devolverlo directamente
    if (Array.isArray(response)) {
      return response;
    }

    // Si viene en formato de objeto con propiedad recetas
    if (response && typeof response === 'object' && 'recetas' in response) {
      return (response as any).recetas || [];
    }

    return [];
  } catch (error) {
    console.error('Error obteniendo recetas del médico:', error);
    return [];
  }
}

// Actualizar una receta completa
export async function actualizarReceta(recetaId: string, recetaData: Partial<NuevaRecetaData & { estado?: Receta['estado'] }>): Promise<{ success: boolean; error?: string }> {
  try {
    // Usar la nueva ruta: PUT /api/recetas/{recetaId}
    await fetchJSON(`/api/recetas/${encodeURIComponent(recetaId)}`, {
      method: 'PUT',
      body: JSON.stringify(recetaData)
    });

    return { success: true };
  } catch (error) {
    console.error('Error actualizando receta:', error);
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
