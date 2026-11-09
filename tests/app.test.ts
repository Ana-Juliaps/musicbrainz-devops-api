import request from 'supertest';
import { createApp, MusicBrainzService } from '../src/app';
import { MusicBrainzError } from '../src/musicbrainz/client';

const MBID = '5b11f4ce-a62d-471e-81fc-a69a8278c7da';

function fakeClient(overrides: Partial<MusicBrainzService> = {}): MusicBrainzService {
  return {
    searchArtists: jest.fn().mockResolvedValue([{ id: MBID, name: 'Nirvana' }]),
    getArtist: jest.fn().mockResolvedValue({ id: MBID, name: 'Nirvana' }),
    getArtistReleases: jest.fn().mockResolvedValue([{ id: 'r1', title: 'Nevermind' }]),
    searchRecordings: jest.fn().mockResolvedValue([{ id: 'rec1', title: 'Lithium' }]),
    ...overrides,
  };
}

describe('API', () => {
  it('GET /health retorna status ok e a versão', async () => {
    const res = await request(createApp({ client: fakeClient(), version: '1.2.3' })).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok', version: '1.2.3' });
  });

  it('GET /api/artists retorna resultados da busca', async () => {
    const client = fakeClient();
    const res = await request(createApp({ client })).get('/api/artists?query=Nirvana&limit=3');
    expect(res.status).toBe(200);
    expect(res.body.results[0].name).toBe('Nirvana');
    expect(client.searchArtists).toHaveBeenCalledWith('Nirvana', 3);
  });

  it('GET /api/artists sem query retorna 400', async () => {
    const res = await request(createApp({ client: fakeClient() })).get('/api/artists');
    expect(res.status).toBe(400);
  });

  it('GET /api/artists/:mbid com MBID inválido retorna 400', async () => {
    const res = await request(createApp({ client: fakeClient() })).get('/api/artists/abc');
    expect(res.status).toBe(400);
  });

  it('GET /api/artists/:mbid retorna o artista', async () => {
    const res = await request(createApp({ client: fakeClient() })).get(`/api/artists/${MBID}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(MBID);
  });

  it('GET /api/artists/:mbid/releases retorna lançamentos', async () => {
    const res = await request(createApp({ client: fakeClient() })).get(`/api/artists/${MBID}/releases`);
    expect(res.status).toBe(200);
    expect(res.body.results[0].title).toBe('Nevermind');
  });

  it('GET /api/recordings retorna gravações', async () => {
    const res = await request(createApp({ client: fakeClient() })).get('/api/recordings?query=Lithium');
    expect(res.status).toBe(200);
    expect(res.body.results[0].title).toBe('Lithium');
  });

  it('propaga 404 vindo da MusicBrainz', async () => {
    const client = fakeClient({
      getArtist: jest.fn().mockRejectedValue(new MusicBrainzError('Recurso não encontrado na MusicBrainz', 404)),
    });
    const res = await request(createApp({ client })).get(`/api/artists/${MBID}`);
    expect(res.status).toBe(404);
  });

  it('retorna 500 para erros inesperados sem vazar detalhes', async () => {
    const client = fakeClient({ searchArtists: jest.fn().mockRejectedValue(new Error('segredo interno')) });
    const res = await request(createApp({ client })).get('/api/artists?query=x');
    expect(res.status).toBe(500);
    expect(JSON.stringify(res.body)).not.toContain('segredo');
  });

  it('rota desconhecida retorna 404', async () => {
    const res = await request(createApp({ client: fakeClient() })).get('/nada');
    expect(res.status).toBe(404);
  });
});
