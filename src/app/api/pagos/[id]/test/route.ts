export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  return new Response(JSON.stringify({ 
    message: 'Test endpoint funciona', 
    pagoId: id 
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    }
  });
}