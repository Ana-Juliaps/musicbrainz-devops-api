"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pino_1 = __importDefault(require("pino"));
const app_1 = require("./app");
const config_1 = require("./config");
const client_1 = require("./musicbrainz/client");
const config = (0, config_1.loadConfig)();
const logger = (0, pino_1.default)({ level: config.logLevel });
const client = new client_1.MusicBrainzClient({
    baseUrl: config.musicBrainzBaseUrl,
    userAgent: `musicbrainz-devops-api/${config.appVersion} ( ${config.appContact} )`,
    minIntervalMs: config.minIntervalMs,
});
const app = (0, app_1.createApp)({ client, logger, version: config.appVersion });
const server = app.listen(config.port, () => {
    logger.info({ port: config.port, version: config.appVersion }, 'API iniciada');
});
function shutdown(signal) {
    logger.info({ signal }, 'Encerrando servidor');
    server.close(() => process.exit(0));
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
