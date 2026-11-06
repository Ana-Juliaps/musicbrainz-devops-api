const MBID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** MBID é um UUID que identifica entidades na MusicBrainz. */
export function isValidMbid(value: string): boolean {
  return MBID_REGEX.test(value);
}

/** Normaliza o parâmetro `limit` (1..25, padrão 10). Retorna null se inválido. */
export function parseLimit(raw: unknown, fallback = 10, max = 25): number | null {
  if (raw === undefined) return fallback;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > max) return null;
  return n;
}

/** Valida o termo de busca: string não vazia, até 200 caracteres. */
export function parseQuery(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const q = raw.trim();
  if (q.length === 0 || q.length > 200) return null;
  return q;
}
