// utils/observability.js
const pino = require('pino');
const pinoHttp = require('pino-http');
const client = require('prom-client');
const { v4: uuid } = require('uuid');

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  // Reduz risco de vazar dados em logs
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.body.password',
      'req.body.password_hash',
      'req.body.token',
      'res.headers["set-cookie"]'
    ],
    censor: '[REDACTED]'
  }
});

function requestId() {
  return (req, _res, next) => {
    req.id = req.headers['x-request-id'] || uuid();
    next();
  };
}

function httpLogger() {
  return pinoHttp({
    logger,
    genReqId: (req) => req.id || uuid(),
    customProps: (req) => ({ reqId: req.id }),
    autoLogging: {
      // evita “poluir” logs com healthchecks
      ignorePaths: ['/health', '/ready', '/metrics']
    }
  });
}

// Prometheus
const register = new client.Registry();
client.collectDefaultMetrics({ register });

function metricsRoute(app) {
  app.get('/metrics', async (_req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  });
}

module.exports = { logger, requestId, httpLogger, metricsRoute, register };


// adicione no arquivo acima
const httpDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duração das requisições HTTP',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5]
});
register.registerMetric(httpDuration);

function httpMetrics() {
  return (req, res, next) => {
    const end = httpDuration.startTimer();
    res.on('finish', () => {
      end({
        method: req.method,
        route: req.route?.path || req.path, // cuidado: pode agrupar por path completo
        status_code: res.statusCode
      });
    });
    next();
  };
}
module.exports.httpMetrics = httpMetrics;
