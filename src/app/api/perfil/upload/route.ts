import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, readdir, unlink } from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ message: 'Content-Type inválido' }, { status: 400 });
    }
    const formData = await req.formData();
    const tipo = String(formData.get('tipo') || '').trim(); // 'usuario' | 'medico' | 'admin'
    const id = String(formData.get('id') || '').trim();     // email o id único
    const file = formData.get('archivo');

    if (!tipo || !id) return NextResponse.json({ message: 'Faltan campos: tipo o id' }, { status: 400 });
    if (!(file instanceof File)) return NextResponse.json({ message: 'Archivo no enviado' }, { status: 400 });

    const allowed = ['usuario', 'medico', 'admin'];
    if (!allowed.includes(tipo)) return NextResponse.json({ message: 'Tipo inválido' }, { status: 400 });

    // crear carpeta: public/perfiles/{tipo}/{id}
    const baseDir = path.join(process.cwd(), 'public', 'perfiles', tipo, id);
    await mkdir(baseDir, { recursive: true });

    // nombre determinista: perfil.ext (ext preserva la original)
    const rawExt = path.extname(file.name || '').toLowerCase();
    const ext = rawExt && ['.png', '.jpg', '.jpeg', '.webp'].includes(rawExt) ? rawExt : '.png';
    const fileName = `perfil${ext}`;
    const filePath = path.join(baseDir, fileName);

    // Eliminar cualquier archivo previo perfil.* para conservar solo uno
    try {
      const files = await readdir(baseDir);
      await Promise.all(files
        .filter((f) => f.startsWith('perfil.'))
        .map((f) => unlink(path.join(baseDir, f)).catch(() => undefined))
      );
    } catch {}

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await writeFile(filePath, buffer);

  // URL pública
  const publicUrl = `/perfiles/${tipo}/${encodeURIComponent(id)}/${encodeURIComponent(fileName)}`;
  return NextResponse.json({ ok: true, url: publicUrl, fileName });
  } catch (err: unknown) {
    console.error('Upload error:', err);
    return NextResponse.json({ message: 'Error al guardar archivo' }, { status: 500 });
  }
}
