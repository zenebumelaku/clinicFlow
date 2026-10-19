export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiPrefix: process.env.API_PREFIX || 'api/v1',
  swaggerPath: process.env.SWAGGER_PATH || 'api/docs',
  swaggerEnabled: process.env.SWAGGER_ENABLED,
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresDays: parseInt(process.env.JWT_REFRESH_EXPIRES_DAYS || '7', 10),
  },
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL || '60000', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
  },
  trustProxyHops: parseInt(process.env.TRUST_PROXY_HOPS || '0', 10),
  chapa: {
    secretKey: process.env.CHAPA_SECRET_KEY || '',
    baseUrl: process.env.CHAPA_BASE_URL || 'https://api.chapa.co/v1',
    webhookSecret: process.env.CHAPA_WEBHOOK_SECRET || process.env.CHAPA_SECRET_KEY || '',
  },
});
