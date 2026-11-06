export class MusicBrainzError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'MusicBrainzError';
  }
}

export interface Artist {
  id: string;
  name: string;
  type: string | null;
  country: string | null;
  disambiguation: string | null;
  beginYear: string | null;
  score?: number;
}

export interface Release {
  id: string;
  title: string;
  date: string | null;
  country: string | null;
  status: string | null;
}

export interface Recording {
  id: string;
  title: string;
  lengthMs: number | null;
  artists: string[];
}

export type FetchLike = (url: string, init?: { headers?: Record<string, string> }) => Promise<{
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
}>;

export interface ClientOptions {
  baseUrl: string;
  userAgent: string;
  minIntervalMs?: number;
  fetchFn?: FetchLike;
}

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Cliente mínimo da MusicBrainz Web Service v2, com respeito ao limite de 1 req/s. */
export class MusicBrainzClient {
  private lastCall = 0;
  private readonly fetchFn: FetchLike;

  constructor(private readonly opts: ClientOptions) {
    this.fetchFn = opts.fetchFn ?? (globalThis.fetch as unknown as FetchLike);
  }

  private async throttle(): Promise<void> {
    const wait = this.lastCall + (this.opts.minIntervalMs ?? 0) - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    this.lastCall = Date.now();
  }

  private async get(path: string, params: Record<string, string | number>): Promise<any> {
    await this.throttle();
    const qs = new URLSearchParams({ ...params, fmt: 'json' } as Record<string, string>);
    const url = `${this.opts.baseUrl}/${path}?${qs.toString()}`;
    const res = await this.fetchFn(url, {
      headers: { 'User-Agent': this.opts.userAgent, Accept: 'application/json' },
    });
    if (res.status === 404) throw new MusicBrainzError('Recurso não encontrado na MusicBrainz', 404);
    if (!res.ok) throw new MusicBrainzError(`MusicBrainz respondeu com status ${res.status}`, 502);
    return res.json();
  }

  private toArtist(a: any): Artist {
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

  async searchArtists(query: string, limit: number): Promise<Artist[]> {
    const data = await this.get('artist', { query, limit });
    return (data.artists ?? []).map((a: any) => this.toArtist(a));
  }

  async getArtist(mbid: string): Promise<Artist> {
    return this.toArtist(await this.get(`artist/${mbid}`, {}));
  }

  async getArtistReleases(mbid: string, limit: number): Promise<Release[]> {
    const data = await this.get('release', { artist: mbid, limit });
    return (data.releases ?? []).map((r: any) => ({
      id: r.id,
      title: r.title,
      date: r.date || null,
      country: r.country ?? null,
      status: r.status ?? null,
    }));
  }

  async searchRecordings(query: string, limit: number): Promise<Recording[]> {
    const data = await this.get('recording', { query, limit });
    return (data.recordings ?? []).map((r: any) => ({
      id: r.id,
      title: r.title,
      lengthMs: r.length ?? null,
      artists: (r['artist-credit'] ?? []).map((c: any) => c.name),
    }));
  }
}
