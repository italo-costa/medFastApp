/**
 * Configurações centralizadas da aplicação MediApp
 * Todas as configurações são gerenciadas aqui para facilitar manutenção
 */

require('dotenv').config();

const config = {
  // Servidor
  server: {
    port: process.env.PORT || 3002,
    host: process.env.HOST || '0.0.0.0',
    env: process.env.NODE_ENV || 'development'
  },

  // Banco de dados
  database: {
    url: process.env.DATABASE_URL || 'postgresql://mediapp:mediapp123@localhost:5432/mediapp'
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'mediapp_secret_key_2025',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  },

  // Rate Limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // máximo 100 requests por IP por janela
    standardHeaders: true,
    legacyHeaders: false
  },

  // Upload de arquivos
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    destination: './uploads/'
  },

  // Logs
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'combined'
  },

  // Integrações externas
  external: {
    viaCepUrl: 'https://viacep.com.br/ws'
  }
};

module.exports = config;