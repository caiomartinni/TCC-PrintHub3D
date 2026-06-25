import pino from 'pino';

// Em desenvolvimento usa pino-pretty (output colorido e legível no terminal).
// Em produção emite JSON estruturado (ideal para ingestão por Datadog, Loki, etc.).
const logger = pino(
  {
    level: process.env['LOG_LEVEL'] || 'info',
    // Serializa objetos Error de forma completa (message + stack + cause)
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
