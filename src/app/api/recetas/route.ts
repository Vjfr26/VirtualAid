import { NextRequest, NextResponse } from 'next/server';

// POST /api/recetas - Crear una nueva receta
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      paciente_email,
      medico_email,
      medicamento,
      dosis,
      frecuencia,
      duracion,
      cantidad,
      con_comidas,
      indicaciones
    } = body;

    // Validaciones básicas
    if (!paciente_email || !medico_email || !medicamento) {
      return NextResponse.json({
        error: 'Faltan campos requeridos: paciente_email, medico_email, medicamento'
      }, { status: 400 });
    }

    // Simular creación de receta (por ahora)
    const nuevaReceta = {
      id: `receta_${Date.now()}`,
      medicamento,
      dosis,
      frecuencia,
      duracion,
      cantidad,
      con_comidas,
      indicaciones,
      estado: 'Activa',
      medico: 'Dr. Médico',
      medico_email,
      paciente_email,
      fecha_creacion: new Date().toISOString(),
      fecha_prescripcion: new Date().toISOString().split('T')[0]
    };

    return NextResponse.json({
      success: true,
      receta: nuevaReceta,
      message: 'Receta creada exitosamente'
    });

  } catch (error) {
    console.error('Error en POST /api/recetas:', error);
    return NextResponse.json({
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}

// GET /api/recetas - Obtener recetas (todas o filtradas)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const medico_email = searchParams.get('medico_email');
    const paciente_email = searchParams.get('paciente_email');

    // Simular respuesta con datos de prueba
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
        medico_email: medico_email || 'medico@virtualaid.com',
        paciente_email: paciente_email || 'paciente@ejemplo.com',
        fecha_creacion: new Date().toISOString(),
        fecha_prescripcion: new Date().toISOString().split('T')[0]
      }
    ];

    return NextResponse.json(recetasMock);

  } catch (error) {
    console.error('Error en GET /api/recetas:', error);
    return NextResponse.json({
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}