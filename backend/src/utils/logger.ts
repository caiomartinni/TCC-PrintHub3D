import pino from 'pino';

// em desenvolvimento usa pino-pretty; em produção emite JSON estruturado (Datadog, Loki, etc.)
const logger = pino(
  {
    level: process.env['LOG_LEVEL'] || 'info',
    serializers: {
      err: pino.stdSerializers.err,
    },
  },
  process.env['NODE_ENV'] !== 'production'
    ? pino.transport({
        target: 'pino-pretty',
        options: {
          colorize:        true,
          translateTime:   'HH:MM:ss.l',
          ignore:          'pid,hostname',
          messageFormat:   '{msg}',
        },
      })
    : undefined,
);

export default logger;
