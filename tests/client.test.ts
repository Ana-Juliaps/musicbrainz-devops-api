import { FetchLike, MusicBrainzClient, MusicBrainzError } from '../src/musicbrainz/client';

function makeClient(status: number, body: unknown) {
  const fetchFn = jest.fn(async () => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  })) as unknown as jest.MockedFunction<FetchLike>;
  const client = new MusicBrainzClient({
    baseUrl: 'https://mb.test/ws/2',
    userAgent: 'test/1.0 ( test@example.com )',
    minIntervalMs: 0,
    fetchFn,
  });
  return { client, fetchFn };
}

describe('MusicBrainzClient', () => {
  it('mapeia a busca de artistas e envia User-Agent', async () => {
    const { client, fetchFn } = makeClient(200, {
      artists: [
        {
          id: 'a1',
          name: 'Nirvana',
          type: 'Group',
          country: 'US',
          disambiguation: '',
          'life-span': { begin: '1987-01' },
          score: 100,
        },
      ],
    });
    const result = await client.searchArtists('Nirvana', 5);
    expect(result).toEqual([
      {
        id: 'a1',
        name: 'Nirvana',
        type: 'Group',
        country: 'US',
        disambiguation: null,
        beginYear: '1987',
        score: 100,
      },
    ]);
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toContain('/artist?');
    expect(url).toContain('fmt=json');
    expect(init?.headers?.['User-Agent']).toContain('test@example.com');
  });

  it('mapeia lançamentos do artista', async () => {
    const { client } = makeClient(200, {
      releases: [{ id: 'r1', title: 'Nevermind', date: '1991-09-24', country: 'US', status: 'Official' }],
    });
    const releases = await client.getArtistReleases('a1', 3);
    expect(releases[0]).toMatchObject({ id: 'r1', title: 'Nevermind', status: 'Official' });
  });

  it('mapeia gravações com créditos de artista', async () => {
    const { client } = makeClient(200, {
      recordings: [{ id: 'rec1', title: 'Come as You Are', length: 219000, 'artist-credit': [{ name: 'Nirvana' }] }],
    });
    const recs = await client.searchRecordings('come as you are', 1);
    expect(recs[0]).toEqual({ id: 'rec1', title: 'Come as You Are', lengthMs: 219000, artists: ['Nirvana'] });
  });

  it('lança 404 quando a MusicBrainz não encontra o recurso', async () => {
    const { client } = makeClient(404, {});
    await expect(client.getArtist('5b11f4ce-a62d-471e-81fc-a69a8278c7da')).rejects.toMatchObject({
      status: 404,
    });
  });

  it('converte falhas upstream em 502', async () => {
    const { client } = makeClient(503, {});
    await expect(client.searchArtists('x', 1)).rejects.toBeInstanceOf(MusicBrainzError);
    await expect(client.searchArtists('x', 1)).rejects.toMatchObject({ status: 502 });
  });
});
