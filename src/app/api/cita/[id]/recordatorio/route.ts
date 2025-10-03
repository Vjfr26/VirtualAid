import { NextRequest, NextResponse } from 'next/server';

const RAW_BACKEND_URL = process.env.BACKEND_BASE_URL
  ?? process.env.API_BASE_URL
  ?? process.env.NEXT_PUBLIC_API_URL
  ?? 'http://13.60.223.37';

const BACKEND_BASE_URL = RAW_BACKEND_URL.replace(/\/$/, '');

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: citaId } = await params;
  const endpoint = `${BACKEND_BASE_URL}/api/cita/${encodeURIComponent(citaId)}/recordatorio`;

  let body: string | undefined;
  try {
    const rawBody = await request.text();
    body = rawBody.trim().length > 0 ? rawBody : undefined;
  } catch (error) {
    console.warn('No se pudo leer el cuerpo de la petición entrante:', error);
  }

  const headers = new Headers();
  const incomingHeaders = request.headers;

  const forwardHeaderKeys = ['authorization', 'cookie', 'x-forwarded-for', 'x-real-ip'];
  forwardHeaderKeys.forEach((key) => {
    const value = incomingHeaders.get(key);
    if (value) {
      headers.set(key, value);
    }
  });

  if (body) {
    headers.set('Content-Type', incomingHeaders.get('content-type') ?? 'application/json');
  }

  headers.set('Accept', 'application/json');

  try {
    const backendResponse = await fetch(endpoint, {
      method: 'POST',
      headers,
      body,
      cache: 'no-store',
    });

    const responseContentType = backendResponse.headers.get('content-type') ?? '';

    if (!responseContentType.includes('application/json')) {
      const rawResponse = await backendResponse.text();
      console.error('Respuesta no JSON del backend de recordatorios:', rawResponse.slice(0, 500));

      return NextResponse.json(
        {
          error: 'Respuesta inválida del backend de recordatorios',
          message: 'Se esperaba JSON y se recibió otro formato',
          raw: rawResponse.slice(0, 500),
        },
        { status: 502 }
      );
    }

    const data = await backendResponse.json();

    if (!backendResponse.ok) {
      return NextResponse.json(data, { status: backendResponse.status });
    }

    return NextResponse.json(data, {
      status: backendResponse.status,
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error comunicándose con el backend de recordatorios:', error);

    return NextResponse.json(
      {
        error: 'No se pudo contactar con el backend de recordatorios',
        message: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 502 }
    );
  }
}
