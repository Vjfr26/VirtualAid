import { NextRequest, NextResponse } from 'next/server';

const LARAVEL_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  try {
    // Obtener el email del médico desde el query param
    const searchParams = request.nextUrl.searchParams;
    const medicoEmail = searchParams.get('medico_email');

    if (!medicoEmail) {
      return NextResponse.json(
        { error: 'Email del médico es requerido' },
        { status: 400 }
      );
    }

    // Control de mock por env var: NEXT_USE_MOCK_SALDO=true para forzar mock
    const USE_MOCK = String(process.env.NEXT_USE_MOCK_SALDO || '').toLowerCase() === 'true';

    // Hacer la petición al backend de Laravel
    const response = await fetch(
      `${LARAVEL_API_URL}/api/medico/${encodeURIComponent(medicoEmail)}/saldo`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error desde Laravel:', errorText);

      // Si NEXT_USE_MOCK_SALDO=true devolvemos mock, si no, devolvemos el error real
      if (USE_MOCK) {
        const mock = {
          saldo: 0,
          total_citas_pagadas: 0,
          ultimo_pago: null,
        } as const;
        console.warn('Usando respuesta MOCK para /api/medico/saldo (Laravel devolvió error)');
        return NextResponse.json(mock, { status: 200, headers: { 'x-mocked': 'true' } });
      }

      return NextResponse.json(
        { 
          error: 'Error al obtener el saldo del médico',
          details: errorText 
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error en el endpoint de saldo:', error);
    // Si la conexión al backend falla y está activado el mock, devolver mock; si no, devolver 500
    const USE_MOCK_CATCH = String(process.env.NEXT_USE_MOCK_SALDO || '').toLowerCase() === 'true';
    if (USE_MOCK_CATCH) {
      const mock = {
        saldo: 1250.75,
        total_citas_pagadas: 42,
        ultimo_pago: { fecha: new Date().toISOString().split('T')[0], monto: 150.0 }
      } as const;
      console.warn('Usando respuesta MOCK para /api/medico/saldo (fetch falló, NEXT_USE_MOCK_SALDO=true)');
      return NextResponse.json(mock, { status: 200, headers: { 'x-mocked': 'true' } });
    }

    return NextResponse.json(
      { 
        error: 'Error interno al obtener el saldo',
        message: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
