"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const pino_1 = __importDefault(require("pino"));
const pino_http_1 = __importDefault(require("pino-http"));
const client_1 = require("./musicbrainz/client");
const validation_1 = require("./validation");
const asyncHandler = (fn) => (req, res, next) => {
    fn(req, res).catch(next);
};
function createApp({ client, logger = (0, pino_1.default)({ level: 'silent' }), version = '0.0.0-dev' }) {
    const app = (0, express_1.default)();
    const startedAt = Date.now();
    app.disable('x-powered-by');
    app.use((0, helmet_1.default)());
    app.use((0, pino_http_1.default)({
        logger,
        // Logs enxutos: sem headers (evita vazar cookies/tokens)
        serializers: {
            req: (req) => ({ id: req.id, method: req.method, url: req.url }),
            res: (res) => ({ statusCode: res.statusCode }),
        },
    }));
    app.get('/health', (_req, res) => {
        res.json({
            status: 'ok',
            version,
            uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
            timestamp: new Date().toISOString(),
        });
    });
    app.get('/api/artists', asyncHandler(async (req, res) => {
        const query = (0, validation_1.parseQuery)(req.query.query);
        const limit = (0, validation_1.parseLimit)(req.query.limit);
        if (!query) {
            res.status(400).json({ error: "Parâmetro 'query' é obrigatório (1 a 200 caracteres)" });
            return;
        }
        if (limit === null) {
            res.status(400).json({ error: "Parâmetro 'limit' deve ser um inteiro entre 1 e 25" });
            return;
        }
        res.json({ results: await client.searchArtists(query, limit) });
    }));
    app.get('/api/artists/:mbid', asyncHandler(async (req, res) => {
        const { mbid } = req.params;
        if (!(0, validation_1.isValidMbid)(mbid)) {
            res.status(400).json({ error: 'MBID inválido (esperado um UUID)' });
            return;
        }
        res.json(await client.getArtist(mbid));
    }));
    app.get('/api/artists/:mbid/releases', asyncHandler(async (req, res) => {
        const { mbid } = req.params;
        const limit = (0, validation_1.parseLimit)(req.query.limit);
        if (!(0, validation_1.isValidMbid)(mbid)) {
            res.status(400).json({ error: 'MBID inválido (esperado um UUID)' });
            return;
        }
        if (limit === null) {
            res.status(400).json({ error: "Parâmetro 'limit' deve ser um inteiro entre 1 e 25" });
            return;
        }
        res.json({ results: await client.getArtistReleases(mbid, limit) });
    }));
    app.get('/api/recordings', asyncHandler(async (req, res) => {
        const query = (0, validation_1.parseQuery)(req.query.query);
        const limit = (0, validation_1.parseLimit)(req.query.limit);
        if (!query) {
            res.status(400).json({ error: "Parâmetro 'query' é obrigatório (1 a 200 caracteres)" });
            return;
        }
        if (limit === null) {
            res.status(400).json({ error: "Parâmetro 'limit' deve ser um inteiro entre 1 e 25" });
            return;
        }
        res.json({ results: await client.searchRecordings(query, limit) });
    }));
    app.use((_req, res) => {
        res.status(404).json({ error: 'Rota não encontrada' });
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    app.use((err, req, res, _next) => {
        if (err instanceof client_1.MusicBrainzError) {
            req.log.warn({ status: err.status, msg: err.message }, 'Erro na MusicBrainz');
            res.status(err.status).json({ error: err.message });
            return;
        }
        req.log.error({ err }, 'Erro inesperado');
        res.status(500).json({ error: 'Erro interno do servidor' });
    });
    return app;
}
