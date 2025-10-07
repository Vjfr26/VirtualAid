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
type RecordatorioOptions = {
  force?: boolean;
  enabled?: boolean;
};

async function parseJsonResponse(response: Response) {
  const contentType = response.headers.get('content-type');

  if (!contentType || !contentType.includes('application/json')) {
    const textResponse = await response.text();
    console.error('❌ Respuesta no-JSON del backend:', textResponse.substring(0, 300));

    return {
      success: false as const,
      message: 'El servidor devolvió una respuesta inválida (HTML en lugar de JSON). Verifica que el endpoint backend esté configurado correctamente.',
    };
  }

  const data = await response.json();

  if (!response.ok) {
    return {
      success: false as const,
      message: data.error || 'Error al procesar la petición de recordatorio',
    };
  }

  return {
    success: true as const,
    message: data.message || 'Operación realizada correctamente',
    data,
  };
}

export async function enviarRecordatorio(
  citaId: number | string,
  options?: RecordatorioOptions
): Promise<{ success: boolean; message: string; data?: EnviarRecordatorioResponse }> {
  try {
    const payload: Record<string, unknown> = {};
    if (options?.force) payload.force = true;
    if (typeof options?.enabled === 'boolean') payload.enabled = options.enabled;
    const response = await fetch(`/api/cita/${citaId}/recordatorio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const resultado = await parseJsonResponse(response);
    if (!resultado.success) {
      throw new Error(resultado.message);
    }

    return {
      success: true,
      message: resultado.message || 'Recordatorio enviado correctamente',
      data: resultado.data,
    };
  } catch (error) {
    console.error('Error en enviarRecordatorio:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error desconocido al enviar el recordatorio',
    };
  }
}

export async function desactivarRecordatorio(
  citaId: number | string
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`/api/cita/${citaId}/recordatorio`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
      },
    });

    const resultado = await parseJsonResponse(response);
    if (!resultado.success) {
      throw new Error(resultado.message);
    }

    return {
      success: true,
      message: resultado.message || 'Recordatorio desactivado correctamente',
    };
  } catch (error) {
    console.error('Error en desactivarRecordatorio:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error desconocido al desactivar el recordatorio',
    };
  }
}
