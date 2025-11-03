/**
 * Middleware Centralizado - Fase 4 da Refatoração
 * Consolida todos os middlewares usando serviços centralizados
 */

const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

const AuthService = require('../services/authService');
const ResponseService = require('../services/responseService');
const databaseService = require('../services/database');

/**
 * Configurações de CORS centralizadas
 */
const corsOptions = {
  origin: function (origin, callback) {
    // Lista de origens permitidas
    const allowedOrigins = [
      'http://localhost:3000',  // React dev
      'http://localhost:3001',  // Next.js dev
      'http://localhost:3002',  // Backend
      'http://localhost:5173',  // Vite dev
      'http://127.0.0.1:5500',  // Live Server
      'http://localhost:8080',  // Vue dev
      process.env.FRONTEND_URL, // Produção
    ].filter(Boolean);

    // Permitir requests sem origin (Postman, mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log(`❌ [CORS] Origem bloqueada: ${origin}`);
      callback(new Error('Bloqueado pelo CORS'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With', 
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma'
  ],
  maxAge: 86400 // 24 horas
};

/**
 * Rate Limiting centralizado
 */
const createRateLimit = (windowMs = 15 * 60 * 1000, max = 1000, message = 'Muitas requisições') => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message,
      retryAfter: Math.ceil(windowMs / 1000),
      timestamp: new Date().toISOString()
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      return ResponseService.error(res, message, 429, {
        retryAfter: Math.ceil(windowMs / 1000),
        limit: max,
        windowMs
      });
    }
  });
};

/**
 * Rate limits específicos
 */
const rateLimits = {
  // Rate limit geral - 1000 requests por 15 minutos
  general: createRateLimit(15 * 60 * 1000, 1000, 'Limite de requisições atingido'),
  
  // Rate limit para autenticação - 10 tentativas por 15 minutos  
  auth: createRateLimit(15 * 60 * 1000, 10, 'Muitas tentativas de login'),
  
  // Rate limit para uploads - 20 uploads por hora
  upload: createRateLimit(60 * 60 * 1000, 20, 'Limite de uploads atingido'),
  
  // Rate limit para criação - 100 criações por hora
  create: createRateLimit(60 * 60 * 1000, 100, 'Limite de criações atingido')
};

/**
 * Middleware de segurança usando Helmet
 */
const securityMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Para desenvolvimento
    },
  },
  crossOriginEmbedderPolicy: false // Para compatibilidade
});

/**
 * Middleware de logging personalizado
 */
const loggingMiddleware = morgan('combined', {
  stream: {
    write: (message) => {
      // Filtrar logs desnecessários
      const skipPatterns = [
        '/favicon.ico',
        '/robots.txt',
        '/health',
        '.css',
        '.js',
        '.map',
        '.png',
        '.jpg',
        '.ico'
      ];
      
      const shouldSkip = skipPatterns.some(pattern => message.includes(pattern));
      if (!shouldSkip) {
        const timestamp = new Date().toISOString();
        const cleanMessage = message.trim();
        console.log(`[${timestamp}] ✅ [MEDIAPP] ${cleanMessage}`);
      }
    }
  }
});

/**
 * Middleware de compressão
 */
const compressionMiddleware = compression({
  filter: (req, res) => {
    // Não comprimir se a resposta está sendo cachada
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Comprimir por padrão
    return compression.filter(req, res);
  },
  level: 6, // Nível de compressão balanceado
  threshold: 1024 // Só comprimir arquivos > 1KB
});

/**
 * Middleware para adicionar headers de resposta padrão
 */
const responseHeadersMiddleware = (req, res, next) => {
  // Headers de segurança
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Headers de API
  res.setHeader('X-API-Version', '2.0.0');
  res.setHeader('X-Powered-By', 'MediApp-Backend');
  
  // Headers de cache para APIs
  if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  
  next();
};

/**
 * Middleware para capturar informações da requisição
 */
const requestInfoMiddleware = (req, res, next) => {
  // Adicionar timestamp à requisição
  req.timestamp = new Date().toISOString();
  
  // Adicionar ID único para rastreamento
  req.requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Adicionar informações do cliente
  req.clientInfo = {
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent') || 'Unknown',
    origin: req.get('Origin') || req.get('Referer') || 'Direct'
  };
  
  next();
};

/**
 * Middleware para validação de Content-Type em requests POST/PUT
 */
const contentTypeValidation = (req, res, next) => {
  const methods = ['POST', 'PUT', 'PATCH'];
  
  if (methods.includes(req.method)) {
    const contentType = req.get('Content-Type');
    
    // Permitir multipart para uploads
    if (req.path.includes('/upload') || req.path.includes('/foto')) {
      return next();
    }
    
    // Exigir application/json para APIs
    if (req.path.startsWith('/api/') && !contentType?.includes('application/json')) {
      return ResponseService.error(res, 'Content-Type deve ser application/json', 400);
    }
  }
  
  next();
};

/**
 * Middleware de health check para banco de dados
 */
const healthCheckMiddleware = async (req, res, next) => {
  // Só verificar em rotas de API críticas
  if (!req.path.startsWith('/api/')) {
    return next();
  }
  
  try {
    // Verificação rápida da conexão do banco
    await databaseService.client.$queryRaw`SELECT 1`;
    next();
  } catch (error) {
    console.error('❌ [DATABASE] Health check falhou:', error.message);
    return ResponseService.error(res, 'Serviço indisponível - banco de dados', 503);
  }
};

/**
 * Middleware para tratamento de rotas não encontradas
 */
const notFoundMiddleware = (req, res, next) => {
  // Recursos comuns que não precisam de log de erro
  const commonResources = [
    '/favicon.ico', 
    '/robots.txt', 
    '/sitemap.xml',
    '/apple-touch-icon.png',
    '/.well-known/security.txt'
  ];
  
  if (commonResources.includes(req.originalUrl)) {
    return res.status(204).end();
  }
  
  return ResponseService.notFound(res, 'Endpoint', req.originalUrl);
};

/**
 * Middleware global de tratamento de erros usando ResponseService
 */
const globalErrorHandler = (err, req, res, next) => {
  // Log detalhado do erro
  const errorInfo = {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.url,
    method: req.method,
    requestId: req.requestId,
    timestamp: req.timestamp,
    clientInfo: req.clientInfo,
    userId: req.user?.id || 'anonymous'
  };
  
  console.error('❌ [ERROR]', errorInfo);
  
  // Usar ResponseService para resposta padronizada
  let statusCode = 500;
  let message = 'Erro interno do servidor';
  let details = null;
  
  // Tratamento específico por tipo de erro
  if (err.isJoi) {
    statusCode = 400;
    message = 'Dados de entrada inválidos';
    details = err.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
  } else if (err.code === 'P2002') {
    statusCode = 409;
    message = 'Recurso já existe';
  } else if (err.code === 'P2025') {
    statusCode = 404;
    message = 'Recurso não encontrado';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token de acesso inválido';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token de acesso expirado';
  } else if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 413;
    message = 'Arquivo muito grande';
  } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    statusCode = 400;
    message = 'Tipo de arquivo não permitido';
  }
  
  return ResponseService.error(res, message, statusCode, details);
};

/**
 * Wrapper para capturar erros de funções assíncronas
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  // Configurações
  corsOptions,
  rateLimits,
  
  // Middlewares individuais
  securityMiddleware,
  loggingMiddleware,
  compressionMiddleware,
  responseHeadersMiddleware,
  requestInfoMiddleware,
  contentTypeValidation,
  healthCheckMiddleware,
  notFoundMiddleware,
  globalErrorHandler,
  
  // Utilitários
  asyncHandler,
  
  // Método para aplicar todos os middlewares básicos
  applyBasicMiddlewares: (app) => {
    console.log('🔧 [MIDDLEWARE] Aplicando middlewares centralizados...');
    
    // Ordem é importante!
    app.use(compressionMiddleware);
    app.use(securityMiddleware);
    app.use(cors(corsOptions));
    app.use(responseHeadersMiddleware);
    app.use(requestInfoMiddleware);
    app.use(loggingMiddleware);
    app.use(contentTypeValidation);
    
    // Rate limiting geral (comentado temporariamente)
    // app.use(rateLimits.general);
    
    console.log('✅ [MIDDLEWARE] Middlewares básicos aplicados');
  },
  
  // Método para aplicar middlewares finais
  applyFinalMiddlewares: (app) => {
    console.log('🔧 [MIDDLEWARE] Aplicando middlewares finais...');
    
    // Health check em rotas críticas (comentado temporariamente)
    // app.use(healthCheckMiddleware);
    
    // 404 handler
    app.use(notFoundMiddleware);
    
    // Error handler global (deve ser o último)
    app.use(globalErrorHandler);
    
    console.log('✅ [MIDDLEWARE] Middlewares finais aplicados');
  }
};