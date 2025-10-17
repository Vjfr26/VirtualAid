export function isPagoCompletado(estado: unknown): boolean {
  if (typeof estado !== 'string') return false;
  const norm = estado.trim().toLowerCase();
  if (!norm) return false;

  if (
    norm.includes('no pagad') ||
    norm.includes('pend') ||
    norm.includes('rechaz') ||
    norm.includes('cancel') ||
    norm.includes('fall') ||
    norm.includes('error')
  ) {
    return false;
  }

  return (
    norm.includes('pagad') ||
    norm.includes('paid') ||
    norm.includes('complet') ||
    norm.includes('success') ||
    norm.includes('confirm')
  );
}
