/**
 * Database service para conectar con la API remota
 * Este servicio maneja todas las operaciones de base de datos
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://13.60.223.37';

export interface Usuario {
  id?: number;
  email: string;
  nombre: string;
  tipo_usuario: 'paciente' | 'medico' | 'admin';
  telefono?: string;
  edad?: number;
  peso?: number;
  altura?: number;
  tipo_sangre?: string;
  direccion?: string;
  fecha_registro?: string;
  activo?: boolean;
}

export interface Medico {
  id?: number;
  usuario_id: number;
  numero_colegiado?: string;
  especialidad?: string;
  hospital_clinica?: string;
  años_experiencia?: number;
  verificado?: boolean;
  fecha_verificacion?: string;
}

export interface Receta {
  id?: number;
  codigo_receta?: string;
  paciente_id?: number;
  medico_id?: number;
  medicamento: string;
  dosis: string;
  frecuencia?: string;
  duracion: string;
  cantidad?: string;
  con_comidas?: 'Si' | 'No' | 'Antes' | 'Después' | 'Con mucha agua';
  indicaciones?: string;
  estado?: 'Activa' | 'Completada' | 'Cancelada' | 'Suspendida';
  fecha_prescripcion?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
  // Campos de vista completa
  paciente_email?: string;
  paciente_nombre?: string;
  medico_email?: string;
  medico?: string;
  numero_colegiado?: string;
  especialidad?: string;
}

export interface NuevaRecetaData {
  medicamento: string;
  dosis: string;
  frecuencia?: string;
  duracion: string;
  cantidad?: string;
  con_comidas?: string;
  indicaciones?: string;
  medico?: string;
  medico_email?: string;
}

class DatabaseService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  private async fetchAPI<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, { ...defaultOptions, ...options });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching ${url}:`, error);
      throw error;
    }
  }

  // Métodos para usuarios
  async obtenerUsuarioPorEmail(email: string): Promise<Usuario | null> {
    try {
      return await this.fetchAPI<Usuario>(`/api/usuarios/email/${encodeURIComponent(email)}`);
    } catch (error) {
      console.error('Error obteniendo usuario:', error);
      return null;
    }
  }

  async crearUsuario(usuario: Omit<Usuario, 'id'>): Promise<Usuario> {
    return await this.fetchAPI<Usuario>('/api/usuarios', {
      method: 'POST',
      body: JSON.stringify(usuario)
    });
  }

  // Métodos para recetas
  async obtenerRecetasPaciente(emailPaciente: string): Promise<Receta[]> {
    try {
      return await this.fetchAPI<Receta[]>(`/api/recetas/paciente/${encodeURIComponent(emailPaciente)}`);
    } catch (error) {
      console.error('Error obteniendo recetas del paciente:', error);
      return [];
    }
  }

  async crearReceta(emailPaciente: string, emailMedico: string, recetaData: NuevaRecetaData): Promise<{
    success: boolean;
    receta?: Receta;
    error?: string;
  }> {
    try {
      const receta = await this.fetchAPI<Receta>('/api/recetas', {
        method: 'POST',
        body: JSON.stringify({
          paciente_email: emailPaciente,
          medico_email: emailMedico,
          ...recetaData
        })
      });

      return { success: true, receta };
    } catch (error) {
      console.error('Error creando receta:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      };
    }
  }

  async actualizarReceta(recetaId: number, datos: Partial<Receta>): Promise<{
    success: boolean;
    receta?: Receta;
    error?: string;
  }> {
    try {
      const receta = await this.fetchAPI<Receta>(`/api/recetas/${recetaId}`, {
        method: 'PUT',
        body: JSON.stringify(datos)
      });

      return { success: true, receta };
    } catch (error) {
      console.error('Error actualizando receta:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      };
    }
  }

  async cambiarEstadoReceta(recetaId: number, nuevoEstado: Receta['estado']): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      await this.fetchAPI(`/api/recetas/${recetaId}/estado`, {
        method: 'PATCH',
        body: JSON.stringify({ estado: nuevoEstado })
      });

      return { success: true };
    } catch (error) {
      console.error('Error cambiando estado de receta:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      };
    }
  }

  // Métodos para médicos
  async obtenerMedicoPorEmail(email: string): Promise<(Usuario & Medico) | null> {
    try {
      return await this.fetchAPI<Usuario & Medico>(`/api/medicos/email/${encodeURIComponent(email)}`);
    } catch (error) {
      console.error('Error obteniendo médico:', error);
      return null;
    }
  }

  async obtenerRecetasMedico(emailMedico: string): Promise<Receta[]> {
    try {
      return await this.fetchAPI<Receta[]>(`/api/recetas/medico/${encodeURIComponent(emailMedico)}`);
    } catch (error) {
      console.error('Error obteniendo recetas del médico:', error);
      return [];
    }
  }

  // Método para inicializar/migrar la base de datos
  async ejecutarMigraciones(): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await this.fetchAPI<{ success: boolean; message: string }>('/api/database/migrate', {
        method: 'POST'
      });
      return { success: result.success };
    } catch (error) {
      console.error('Error ejecutando migraciones:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      };
    }
  }
}

// Instancia singleton
const dbService = new DatabaseService();
export default dbService;
