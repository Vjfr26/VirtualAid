import { generarHTMLCorreo } from './emailTemplates';

interface RecordatorioData {
  destinatario?: string;
  fechaCita: Date;
  horaCita: string;
  medico: string;
  especialidad?: string;
  tipoRecordatorio?: 'activacion' | 'desactivacion';
}

interface RecordatorioResponse {
  success: boolean;
  message: string;
  emailId?: string;
  error?: string;
}

class RecordatorioService {
  private static readonly API_ENDPOINT = '/api/recordatorios';

  /**
   * Envía un recordatorio por correo electrónico cuando se activa la notificación
   */
  static async enviarRecordatorioActivacion(data: RecordatorioData): Promise<RecordatorioResponse> {
    try {
      if (!data.destinatario) {
        throw new Error('No se proporcionó destinatario para el recordatorio');
      }

      // Generar el contenido del correo usando plantillas
      const { asunto, html } = generarHTMLCorreo('recordatorio', {
        fechaCita: data.fechaCita,
        horaCita: data.horaCita,
        medico: data.medico,
        especialidad: data.especialidad
      });

      const response = await fetch(this.API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          tipoRecordatorio: 'activacion',
          asunto,
          contenidoHTML: html
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al enviar recordatorio');
      }

      return result;
    } catch (error) {
      console.error('Error al enviar recordatorio:', error);
      return {
        success: false,
        message: 'Error al enviar recordatorio por correo',
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Obtiene el email del usuario desde localStorage o contexto
   */
  static obtenerEmailUsuario(): string | null {
    try {
      // Intentar obtener el email desde localStorage
      const userEmail = localStorage.getItem('userEmail');
      if (userEmail) {
        return userEmail;
      }

      // Si no está en localStorage, intentar obtenerlo desde sessionStorage
      const sessionEmail = sessionStorage.getItem('userEmail');
      if (sessionEmail) {
        return sessionEmail;
      }

      // Como fallback, podrías obtenerlo de un contexto de usuario o cookie
      return null;
    } catch (error) {
      console.error('Error al obtener email del usuario:', error);
      return null;
    }
  }

  /**
   * Valida si el email es válido
   */
  static validarEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Procesa el toggle del recordatorio con envío de correo
   */
  static async procesarToggleRecordatorio(
    cita: RecordatorioData,
    isActivando: boolean,
    emailUsuario?: string
  ): Promise<{ success: boolean; message: string }> {
    const email = emailUsuario || this.obtenerEmailUsuario();
    
    if (!email) {
      return {
        success: false,
        message: 'No se pudo obtener el email del usuario para enviar el recordatorio'
      };
    }

    if (!this.validarEmail(email)) {
      return {
        success: false,
        message: 'El email del usuario no es válido'
      };
    }

    const citaData: RecordatorioData = {
      ...cita,
      destinatario: email
    };

    if (isActivando) {
      const resultado = await this.enviarRecordatorioActivacion(citaData);

      return {
        success: resultado.success,
        message: resultado.message
      };
    }

    return {
      success: true,
      message: 'Recordatorio desactivado. No se envió correo electrónico.'
    };
  }
}

export default RecordatorioService;
export type { RecordatorioData, RecordatorioResponse };