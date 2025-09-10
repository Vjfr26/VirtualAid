/**
 * Servicio para enviar recordatorios de citas por correo electrónico
 */

export interface EnviarRecordatorioResponse {
  message: string;
  cita_id: number;
  email: string;
  fecha: string;
  hora: string;
}

/**
 * Envía un recordatorio de cita al correo del paciente
 * @param citaId - ID de la cita para la que se enviará el recordatorio
 * @returns Promise con el resultado del envío
 */
export async function enviarRecordatorio(citaId: number | string): Promise<{ success: boolean; message: string; data?: EnviarRecordatorioResponse }> {
  try {
    const response = await fetch(`/api/cita/${citaId}/recordatorio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Verificar el tipo de contenido de la respuesta
    const contentType = response.headers.get('content-type');
    
    // Si la respuesta no es JSON, el backend está devolviendo algo inesperado (probablemente HTML)
    if (!contentType || !contentType.includes('application/json')) {
      const textResponse = await response.text();
      console.error('❌ Respuesta no-JSON del backend:', textResponse.substring(0, 300));
      
      return {
        success: false,
        message: 'El servidor devolvió una respuesta inválida (HTML en lugar de JSON). Verifica que el endpoint backend esté configurado correctamente.'
      };
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Error al enviar el recordatorio');
    }

    return {
      success: true,
      message: data.message || 'Recordatorio enviado correctamente',
      data: data
    };
  } catch (error) {
    console.error('Error en enviarRecordatorio:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error desconocido al enviar el recordatorio',
    };
  }
}
