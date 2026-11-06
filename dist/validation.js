"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidMbid = isValidMbid;
exports.parseLimit = parseLimit;
exports.parseQuery = parseQuery;
const MBID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** MBID é um UUID que identifica entidades na MusicBrainz. */
function isValidMbid(value) {
    return MBID_REGEX.test(value);
}
/** Normaliza o parâmetro `limit` (1..25, padrão 10). Retorna null se inválido. */
function parseLimit(raw, fallback = 10, max = 25) {
    if (raw === undefined)
        return fallback;
    const n = Number(raw);
    if (!Number.isInteger(n) || n < 1 || n > max)
        return null;
    return n;
}
/** Valida o termo de busca: string não vazia, até 200 caracteres. */
function parseQuery(raw) {
    if (typeof raw !== 'string')
        return null;
    const q = raw.trim();
    if (q.length === 0 || q.length > 200)
        return null;
    return q;
}
