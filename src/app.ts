import express, { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import pino, { Logger } from 'pino';
import pinoHttp from 'pino-http';
import { MusicBrainzClient, MusicBrainzError } from './musicbrainz/client';
import { isValidMbid, parseLimit, parseQuery } from './validation';

export type MusicBrainzService = Pick<
  MusicBrainzClient,
  'searchArtists' | 'getArtist' | 'getArtistReleases' | 'searchRecordings'
>;

export interface AppDeps {
  client: MusicBrainzService;
  logger?: Logger;
  version?: string;
}

const asyncHandler =
  (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    fn(req, res).catch(next);
  };

export function createApp({ client, logger = pino({ level: 'silent' }), version = '0.0.0-dev' }: AppDeps) {
  const app = express();
  const startedAt = Date.now();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(
    pinoHttp({
      logger,
      // Logs enxutos: sem headers (evita vazar cookies/tokens)
      serializers: {
        req: (req) => ({ id: req.id, method: req.method, url: req.url }),
        res: (res) => ({ statusCode: res.statusCode }),
      },
    }),
  );

  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      version,
      uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
      timestamp: new Date().toISOString(),
    });
  });

  app.get(
    '/api/artists',
    asyncHandler(async (req, res) => {
      const query = parseQuery(req.query.query);
      const limit = parseLimit(req.query.limit);
      if (!query) {
        res.status(400).json({ error: "Parâmetro 'query' é obrigatório (1 a 200 caracteres)" });
        return;
      }
      if (limit === null) {
        res.status(400).json({ error: "Parâmetro 'limit' deve ser um inteiro entre 1 e 25" });
        return;
      }
      res.json({ results: await client.searchArtists(query, limit) });
    }),
  );

  app.get(
    '/api/artists/:mbid',
    asyncHandler(async (req, res) => {
      const { mbid } = req.params;
      if (!isValidMbid(mbid)) {
        res.status(400).json({ error: 'MBID inválido (esperado um UUID)' });
        return;
      }
      res.json(await client.getArtist(mbid));
    }),
  );

  app.get(
    '/api/artists/:mbid/releases',
    asyncHandler(async (req, res) => {
      const { mbid } = req.params;
      const limit = parseLimit(req.query.limit);
      if (!isValidMbid(mbid)) {
        res.status(400).json({ error: 'MBID inválido (esperado um UUID)' });
        return;
      }
      if (limit === null) {
        res.status(400).json({ error: "Parâmetro 'limit' deve ser um inteiro entre 1 e 25" });
        return;
      }
      res.json({ results: await client.getArtistReleases(mbid, limit) });
    }),
  );

  app.get(
    '/api/recordings',
    asyncHandler(async (req, res) => {
      const query = parseQuery(req.query.query);
      const limit = parseLimit(req.query.limit);
      if (!query) {
        res.status(400).json({ error: "Parâmetro 'query' é obrigatório (1 a 200 caracteres)" });
        return;
      }
      if (limit === null) {
        res.status(400).json({ error: "Parâmetro 'limit' deve ser um inteiro entre 1 e 25" });
        return;
      }
      res.json({ results: await client.searchRecordings(query, limit) });
    }),
  );

  app.use((_req, res) => {
    res.status(404).json({ error: 'Rota não encontrada' });
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof MusicBrainzError) {
      req.log.warn({ status: err.status, msg: err.message }, 'Erro na MusicBrainz');
      res.status(err.status).json({ error: err.message });
      return;
    }
    req.log.error({ err }, 'Erro inesperado');
    res.status(500).json({ error: 'Erro interno do servidor' });
  });

  return app;
}
