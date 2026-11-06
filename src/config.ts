export interface Config {
  port: number;
  logLevel: string;
  musicBrainzBaseUrl: string;
  appContact: string;
  appVersion: string;
  minIntervalMs: number;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const port = Number(env.PORT ?? 3000);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`PORT inválida: ${env.PORT}`);
  }
  return {
    port,
    logLevel: env.LOG_LEVEL ?? 'info',
    musicBrainzBaseUrl: env.MUSICBRAINZ_BASE_URL ?? 'https://musicbrainz.org/ws/2',
    appContact: env.APP_CONTACT ?? 'contato@exemplo.com',
    appVersion: env.APP_VERSION ?? '0.0.0-dev',
    minIntervalMs: Number(env.MB_MIN_INTERVAL_MS ?? 1100),
  };
}
