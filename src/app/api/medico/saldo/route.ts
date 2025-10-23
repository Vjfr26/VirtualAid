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
    return NextResponse.json(
      { 
        error: 'Error interno al obtener el saldo',
        message: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
