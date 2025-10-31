import { NextRequest, NextResponse } from 'next/server';

// GET /api/recetas/[id] - Obtener una receta específica o filtrar por médico/paciente
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Verificar si el ID es un email (médico o paciente) o un ID de receta
    const esEmail = id.includes('@');

    if (esEmail) {
      // Si es un email, devolver recetas asociadas a ese email
      // Por ahora simulamos con datos de prueba
      const recetasMock = [
        {
          id: 'receta_1',
          medicamento: 'Paracetamol',
          dosis: '500mg',
          frecuencia: 'Cada 8 horas',
          duracion: '5 días',
          cantidad: '15 comprimidos',
          con_comidas: 'Después de comidas',
          indicaciones: 'Tomar con agua',
          estado: 'Activa',
          medico: 'Dr. Médico',
          medico_email: id, // Usar el ID como email del médico
          paciente_email: 'paciente@ejemplo.com',
          fecha_creacion: new Date().toISOString(),
          fecha_prescripcion: new Date().toISOString().split('T')[0]
        }
      ];

      return NextResponse.json(recetasMock);
    } else {
      // Si es un ID de receta específico, devolver esa receta
      const recetaMock = {
        id,
        medicamento: 'Paracetamol',
        dosis: '500mg',
        frecuencia: 'Cada 8 horas',
        duracion: '5 días',
        cantidad: '15 comprimidos',
        con_comidas: 'Después de comidas',
        indicaciones: 'Tomar con agua',
        estado: 'Activa',
        medico: 'Dr. Médico',
        medico_email: 'medico@virtualaid.com',
        paciente_email: 'paciente@ejemplo.com',
        fecha_creacion: new Date().toISOString(),
        fecha_prescripcion: new Date().toISOString().split('T')[0]
      };

      return NextResponse.json(recetaMock);
    }

  } catch (error) {
    console.error('Error en GET /api/recetas/[id]:', error);
    return NextResponse.json({
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}

// PUT /api/recetas/[id] - Actualizar una receta específica
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    // Simular actualización de receta
    const recetaActualizada = {
      id,
      ...body,
      fecha_actualizacion: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      receta: recetaActualizada,
      message: 'Receta actualizada exitosamente'
    });

  } catch (error) {
    console.error('Error en PUT /api/recetas/[id]:', error);
    return NextResponse.json({
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}