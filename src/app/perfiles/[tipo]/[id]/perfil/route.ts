import { NextRequest } from 'next/server';
import { readdir, readFile } from 'fs/promises';
import path from 'path';

const allowedTipos = new Set(['usuario', 'medico', 'admin']);
const allowedExts = new Set(['.png', '.jpg', '.jpeg', '.webp']);

async function findPerfilFile(dir: string): Promise<{ filePath: string; contentType: string } | null> {
  try {
    const files = await readdir(dir);
    const match = files.find((f) => f.startsWith('perfil.') && allowedExts.has(path.extname(f).toLowerCase()));
    if (!match) return null;
    const ext = path.extname(match).toLowerCase();
    const filePath = path.join(dir, match);
    const contentType =
      ext === '.png' ? 'image/png' :
      ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
      ext === '.webp' ? 'image/webp' : 'application/octet-stream';
    return { filePath, contentType };
  } catch {
    return null;
  }
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ tipo: string; id: string }> }) {
  const { tipo, id } = await ctx.params;
  if (!allowedTipos.has(tipo)) return new Response('Tipo inválido', { status: 400 });
  const baseDir = path.join(process.cwd(), 'public', 'perfiles', tipo, id);
  const found = await findPerfilFile(baseDir);
  if (!found) return new Response('No encontrado', { status: 404 });
  const buf = await readFile(found.filePath);
  // Convertir a ArrayBuffer "puro" y castear para cumplir con BodyInit
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
  return new Response(ab as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': found.contentType,
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=3600',
    },
  });
}

export async function HEAD(_req: NextRequest, ctx: { params: Promise<{ tipo: string; id: string }> }) {
  const { tipo, id } = await ctx.params;
  if (!allowedTipos.has(tipo)) return new Response(undefined, { status: 400 });
  const baseDir = path.join(process.cwd(), 'public', 'perfiles', tipo, id);
  const found = await findPerfilFile(baseDir);
  if (!found) return new Response(undefined, { status: 404 });
  return new Response(undefined, {
    status: 200,
    headers: {
      'Content-Type': found.contentType,
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=3600',
    },
  });
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
