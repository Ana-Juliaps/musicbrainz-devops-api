"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MusicBrainzClient = exports.MusicBrainzError = void 0;
class MusicBrainzError extends Error {
    status;
    constructor(message, status) {
        super(message);
        this.status = status;
        this.name = 'MusicBrainzError';
    }
}
exports.MusicBrainzError = MusicBrainzError;
/* eslint-disable @typescript-eslint/no-explicit-any */
/** Cliente mínimo da MusicBrainz Web Service v2, com respeito ao limite de 1 req/s. */
class MusicBrainzClient {
    opts;
    lastCall = 0;
    fetchFn;
    constructor(opts) {
        this.opts = opts;
        this.fetchFn = opts.fetchFn ?? globalThis.fetch;
    }
    async throttle() {
        const wait = this.lastCall + (this.opts.minIntervalMs ?? 0) - Date.now();
        if (wait > 0)
            await new Promise((r) => setTimeout(r, wait));
        this.lastCall = Date.now();
    }
    async get(path, params) {
        await this.throttle();
        const qs = new URLSearchParams({ ...params, fmt: 'json' });
        const url = `${this.opts.baseUrl}/${path}?${qs.toString()}`;
        const res = await this.fetchFn(url, {
            headers: { 'User-Agent': this.opts.userAgent, Accept: 'application/json' },
        });
        if (res.status === 404)
            throw new MusicBrainzError('Recurso não encontrado na MusicBrainz', 404);
        if (!res.ok)
            throw new MusicBrainzError(`MusicBrainz respondeu com status ${res.status}`, 502);
        return res.json();
    }
    toArtist(a) {
        return {
            id: a.id,
            name: a.name,
            type: a.type ?? null,
            country: a.country ?? null,
            disambiguation: a.disambiguation || null,
            beginYear: a['life-span']?.begin?.slice(0, 4) ?? null,
            ...(a.score !== undefined ? { score: a.score } : {}),
        };
    }
    async searchArtists(query, limit) {
        const data = await this.get('artist', { query, limit });
        return (data.artists ?? []).map((a) => this.toArtist(a));
    }
    async getArtist(mbid) {
        return this.toArtist(await this.get(`artist/${mbid}`, {}));
    }
    async getArtistReleases(mbid, limit) {
        const data = await this.get('release', { artist: mbid, limit });
        return (data.releases ?? []).map((r) => ({
            id: r.id,
            title: r.title,
            date: r.date || null,
            country: r.country ?? null,
            status: r.status ?? null,
        }));
    }
    async searchRecordings(query, limit) {
        const data = await this.get('recording', { query, limit });
        return (data.recordings ?? []).map((r) => ({
            id: r.id,
            title: r.title,
            lengthMs: r.length ?? null,
            artists: (r['artist-credit'] ?? []).map((c) => c.name),
        }));
    }
}
exports.MusicBrainzClient = MusicBrainzClient;
