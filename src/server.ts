import pino from 'pino';
import { createApp } from './app';
import { loadConfig } from './config';
import { MusicBrainzClient } from './musicbrainz/client';

const config = loadConfig();
const logger = pino({ level: config.logLevel });

const client = new MusicBrainzClient({
  baseUrl: config.musicBrainzBaseUrl,
  userAgent: `musicbrainz-devops-api/${config.appVersion} ( ${config.appContact} )`,
  minIntervalMs: config.minIntervalMs,
});

const app = createApp({ client, logger, version: config.appVersion });

const server = app.listen(config.port, () => {
  logger.info({ port: config.port, version: config.appVersion }, 'API iniciada');
});

function shutdown(signal: string) {
  logger.info({ signal }, 'Encerrando servidor');
  server.close(() => process.exit(0));
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
