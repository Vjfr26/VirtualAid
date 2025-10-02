import { NextRequest, NextResponse } from 'next/server';

/**
 * 🚧 ENDPOINT TEMPORAL DE PRUEBA
 * 
 * Este endpoint simula la respuesta del backend real mientras se implementa.
 * Una vez que el backend real esté disponible, este archivo debe ser eliminado.
 * 
 * El backend real debe estar en un servidor separado (ej: Python/Django, Node.js/Express, etc.)
 * y este endpoint frontend solo existe para pruebas locales.
 */

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const citaId = id;

    console.log(`📧 [MOCK] Simulando envío de recordatorio para cita ID: ${citaId}`);

    // Simular un pequeño delay como si se estuviera enviando un correo real
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 🎯 RESPUESTA SIMULADA - Este es el formato que el backend real debe devolver
    const responseData = {
      message: "Recordatorio enviado correctamente",
      cita_id: parseInt(citaId),
      email: "pedro@example.com", // En el backend real, obtener el email de la BD
      fecha: "2025-10-02",
      hora: "16:00"
    };

    console.log('✅ [MOCK] Respuesta simulada:', responseData);

    // ✅ IMPORTANTE: Devolver JSON con Content-Type correcto
    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      }
    });

  } catch (error) {
    console.error('❌ [MOCK] Error en endpoint temporal:', error);
    
    return NextResponse.json(
      { 
        error: "Error al procesar el recordatorio",
        message: error instanceof Error ? error.message : "Error desconocido"
      },
      { status: 500 }
    );
  }
}

/**
 * 📝 NOTAS PARA LA IMPLEMENTACIÓN REAL DEL BACKEND:
 * 
 * 1. Este endpoint debe estar en tu servidor backend (Python, Node.js, etc.)
 * 2. El endpoint debe ser: POST /api/cita/{id}/recordatorio
 * 3. Pasos que debe hacer el backend:
 *    a. Obtener los datos de la cita desde la base de datos usando el ID
 *    b. Obtener el email del paciente
 *    c. Generar el HTML del correo usando la plantilla
 *    d. Enviar el correo al servidor SMTP (Gmail, SendGrid, etc.)
 *    e. Devolver JSON (NO HTML) al frontend
 * 
 * 4. Respuesta esperada (JSON):
 *    {
 *      "message": "Recordatorio enviado correctamente",
 *      "cita_id": 2,
 *      "email": "pedro@example.com",
 *      "fecha": "2025-10-02",
 *      "hora": "16:00"
 *    }
 * 
 * 5. En caso de error:
 *    {
 *      "error": "Descripción del error",
 *      "message": "Mensaje detallado"
 *    }
 * 
 * 6. Headers importantes:
 *    Content-Type: application/json (OBLIGATORIO)
 *    Status Code: 200 (éxito) o 500/400 (error)
 */
