export const runtime = 'nodejs';
function generar(id: string){
  const pdf = `%PDF-1.1\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 80]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n4 0 obj<</Length 60>>stream\nBT /F1 16 Tf 15 50 Td (Receipt payment #${id}) Tj ET\nendstream endobj\n5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\nxref\n0 6\n0000000000 65535 f \n0000000010 00000 n \n0000000060 00000 n \n0000000113 00000 n \n0000000270 00000 n \n0000000371 00000 n \ntrailer<</Size 6/Root 1 0 R>>\nstartxref\n446\n%%EOF`;
  return new TextEncoder().encode(pdf);
}
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }){
  const { id } = await params;
  try {
    const bytes = generar(id);
    return new Response(Buffer.from(bytes),{status:200,headers:{'Content-Type':'application/pdf','Content-Disposition':`attachment; filename=receipt-${id}.pdf`,'Cache-Control':'no-store'}});
  } catch {
    return new Response('Error', {status:500});
  }
}
